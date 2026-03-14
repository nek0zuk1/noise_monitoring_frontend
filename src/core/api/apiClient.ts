import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

const resolveWebApiBaseUrl = (): string => {
    if (typeof window === 'undefined') {
        return 'http://127.0.0.1:5000';
    }
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const hostname = window.location.hostname || '127.0.0.1';
    return `${protocol}//${hostname}:5000`;
};

const getDevHostFromBundleUrl = (): string | null => {
    const scriptURL = NativeModules?.SourceCode?.scriptURL as string | undefined;
    if (!scriptURL) {
        return null;
    }

    try {
        const parsed = new URL(scriptURL);
        const host = parsed.hostname;
        if (!host || host === 'localhost' || host === '127.0.0.1') {
            return null;
        }
        return host;
    } catch {
        return null;
    }
};

const getNativeDevBaseUrl = (): string => {
    const devHost = getDevHostFromBundleUrl();
    if (devHost) {
        return `http://${devHost}:5000`;
    }

    if (Platform.OS === 'android') {
        // Android emulator maps host loopback to 10.0.2.2.
        return 'http://10.0.2.2:5000';
    }

    return 'http://127.0.0.1:5000';
};

const NATIVE_PROD_BASE_URL = 'https://api.bagumbayan-noise.com/v1';

const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    (Platform.OS === 'web'
        ? resolveWebApiBaseUrl()
        : isDev
            ? getNativeDevBaseUrl()
            : NATIVE_PROD_BASE_URL);

const getFallbackBaseUrls = (): string[] => {
    const urls = new Set<string>();

    const envFallbacks = (process.env.EXPO_PUBLIC_API_FALLBACK_URLS || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

    for (const url of envFallbacks) {
        urls.add(url);
    }

    if (Platform.OS === 'web') {
        urls.add(resolveWebApiBaseUrl());
        urls.add('http://localhost:5000');
        urls.add('http://127.0.0.1:5000');
        return Array.from(urls);
    }

    if (isDev) {
        const devHost = getDevHostFromBundleUrl();
        if (devHost) {
            urls.add(`http://${devHost}:5000`);
        }
        urls.add(getNativeDevBaseUrl());
        urls.add('http://localhost:5000');
        urls.add('http://127.0.0.1:5000');
    }

    return Array.from(urls);
};

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ─── Request Interceptor ───────────────────────────────────────────────────
// Attach the JWT token from AsyncStorage to every outgoing request.
apiClient.interceptors.request.use(
    async (config) => {
        try {
            const token =
                Platform.OS === 'web'
                    ? localStorage.getItem('@jwt_token')
                    : await AsyncStorage.getItem('@jwt_token');
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error fetching token for API request', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── Response Interceptor ──────────────────────────────────────────────────
// Automatically intercept 401 Unauthorized responses to trigger global logouts
// or handle silent token refreshes if implemented.
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error?.config;

        // Retry once with alternate base URL when request fails to reach server.
        if (
            originalRequest &&
            !error?.response &&
            !originalRequest.__retriedWithFallback
        ) {
            const candidates = getFallbackBaseUrls();
            const currentBase = originalRequest.baseURL || API_BASE_URL;
            const nextBase = candidates.find((url) => url !== currentBase);

            if (nextBase) {
                originalRequest.__retriedWithFallback = true;
                originalRequest.baseURL = nextBase;
                return apiClient.request(originalRequest);
            }
        }

        if (error.response && error.response.status === 401) {
            console.warn('Unauthorized! JWT token is missing or expired.');
            // Implementation detail: Token refresh logic or
            // dispatching an event to the AuthContext to log the user out goes here.
        }
        return Promise.reject(error);
    }
);

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
const DEFAULT_API_BASE_URL = 'https://noise-monitoring-backend.onrender.com';

const DEV_API_PORT = '5000';

const sanitizeHost = (value: string): string =>
    value
        .trim()
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '')
        .split(':')[0];

const toBaseUrl = (host: string): string => `http://${sanitizeHost(host)}:${DEV_API_PORT}`;

const resolveWebApiBaseUrl = (): string => {
    if (typeof window === 'undefined') {
        return `http://127.0.0.1:${DEV_API_PORT}`;
    }
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const hostname = window.location.hostname || '127.0.0.1';
    return `${protocol}//${hostname}:${DEV_API_PORT}`;
};

const getDevHostFromBundleUrl = (): string | null => {
    const expoHostUri =
        Constants?.expoConfig?.hostUri ||
        (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ||
        (Constants as any)?.expoGoConfig?.debuggerHost;

    if (expoHostUri) {
        const host = String(expoHostUri).split(':')[0];
        if (host && host !== 'localhost' && host !== '127.0.0.1') {
            return host;
        }
    }

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
    const configuredHost = process.env.EXPO_PUBLIC_DEV_API_HOST?.trim();
    if (configuredHost) {
        return toBaseUrl(configuredHost);
    }

    const devHost = getDevHostFromBundleUrl();
    if (devHost) {
        return toBaseUrl(devHost);
    }

    if (Platform.OS === 'android') {
        // Android emulator maps host loopback to 10.0.2.2.
        return `http://10.0.2.2:${DEV_API_PORT}`;
    }

    if (Platform.OS === 'ios') {
        // iOS simulator can reach host via localhost.
        return `http://localhost:${DEV_API_PORT}`;
    }

    // Last-resort fallback for physical devices: set EXPO_PUBLIC_DEV_API_HOST to your LAN IP.
    return `http://localhost:${DEV_API_PORT}`;
};

const resolveApiBaseUrl = (): string => {
    // Mobile should always target the deployed backend by default.
    if (Platform.OS !== 'web') {
        return DEFAULT_API_BASE_URL;
    }

    const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
    return configuredBaseUrl || DEFAULT_API_BASE_URL;
};

const API_BASE_URL = resolveApiBaseUrl();

const getFallbackBaseUrls = (): string[] => {
    const urls = new Set<string>();
    urls.add(DEFAULT_API_BASE_URL);

    // Keep native retries pinned to deployed backend to avoid localhost fallbacks.
    if (Platform.OS !== 'web') {
        return Array.from(urls);
    }

    const configuredHost = process.env.EXPO_PUBLIC_DEV_API_HOST?.trim();
    if (configuredHost) {
        urls.add(toBaseUrl(configuredHost));
    }

    const envFallbacks = (process.env.EXPO_PUBLIC_API_FALLBACK_URLS || '')
        .split(',')
        .map((value: string) => value.trim())
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
            urls.add(toBaseUrl(devHost));
        }
        urls.add(getNativeDevBaseUrl());
        urls.add(`http://localhost:${DEV_API_PORT}`);
        urls.add(`http://127.0.0.1:${DEV_API_PORT}`);
        urls.add(`http://10.0.2.2:${DEV_API_PORT}`);
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

        // Retry with alternate base URLs when request fails to reach server.
        if (
            originalRequest &&
            !error?.response
        ) {
            const currentBase = (originalRequest.baseURL || API_BASE_URL) as string;
            const sequence = originalRequest.__fallbackSequence || [
                currentBase,
                ...getFallbackBaseUrls().filter((url) => url !== currentBase),
            ];
            const currentIndex = typeof originalRequest.__fallbackIndex === 'number'
                ? originalRequest.__fallbackIndex
                : sequence.findIndex((url: string) => url === currentBase);
            const nextIndex = currentIndex + 1;
            const nextBase = sequence[nextIndex];

            if (nextBase) {
                originalRequest.__fallbackSequence = sequence;
                originalRequest.__fallbackIndex = nextIndex;
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

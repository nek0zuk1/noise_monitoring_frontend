import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { jwtDecode } from 'jwt-decode';

type UserData = {
    id: string;
    email: string;
    name: string;
    username?: string;
    isAdmin?: boolean;
};

type AuthContextType = {
    user: UserData | null;
    isLoading: boolean;
    login: (token: string) => Promise<void>;
    loginWithUser: (userData: UserData) => Promise<void>;
    logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    login: async () => { },
    loginWithUser: async () => { },
    logout: async () => { },
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Bootstrap the app by checking for an existing JWT token
        const bootstrapAsync = async () => {
            try {
                // Mobile policy: always start from login screen on fresh app launch.
                if (Platform.OS !== 'web') {
                    await AsyncStorage.removeItem('@jwt_token');
                    await AsyncStorage.removeItem('@auth_user');
                    setUser(null);
                    return;
                }

                // Safely load token depending on platform
                let storedToken = null;
                if (Platform.OS === 'web') {
                    storedToken = localStorage.getItem('@jwt_token');
                    const storedUser = localStorage.getItem('@auth_user');
                    if (storedUser) {
                        setUser(JSON.parse(storedUser) as UserData);
                        return;
                    }
                } else {
                    storedToken = await AsyncStorage.getItem('@jwt_token');
                    const storedUser = await AsyncStorage.getItem('@auth_user');
                    if (storedUser) {
                        setUser(JSON.parse(storedUser) as UserData);
                        return;
                    }
                }

                if (storedToken) {
                    const decoded = jwtDecode<UserData>(storedToken);
                    setUser(decoded);
                }
            } catch (e) {
                console.warn('Failed to restore token', e);
            } finally {
                setIsLoading(false);
            }
        };

        bootstrapAsync();
    }, []);

    // Helper to safely store tokens across Web and Native
    const storeToken = async (token: string) => {
        if (Platform.OS === 'web') {
            try {
                localStorage.setItem('@jwt_token', token);
            } catch (e) {
                console.error('Failed to save token to localStorage', e);
            }
        } else {
            await AsyncStorage.setItem('@jwt_token', token);
        }
    };

    const storeUser = async (userData: UserData) => {
        const raw = JSON.stringify(userData);
        if (Platform.OS === 'web') {
            localStorage.setItem('@auth_user', raw);
            return;
        }
        await AsyncStorage.setItem('@auth_user', raw);
    };

    // Helper to safely remove tokens across Web and Native
    const removeToken = async () => {
        if (Platform.OS === 'web') {
            try {
                localStorage.removeItem('@jwt_token');
                localStorage.removeItem('@auth_user');
            } catch (e) {
                console.error('Failed to remove token from localStorage', e);
            }
        } else {
            await AsyncStorage.removeItem('@jwt_token');
            await AsyncStorage.removeItem('@auth_user');
        }
    };

    const login = async (token: string) => {
        try {
            await storeToken(token);
            const decoded = jwtDecode<UserData>(token);
            await storeUser(decoded);
            setUser(decoded);
        } catch (error) {
            console.error('Login failed to bind token', error);
        }
    };

    const loginWithUser = async (userData: UserData) => {
        try {
            await storeUser(userData);
            setUser(userData);
        } catch (error) {
            console.error('Login failed to persist user', error);
        }
    };

    const logout = async () => {
        try {
            await removeToken();
            setUser(null);
        } catch (error) {
            console.error('Logout failed to remove token', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, loginWithUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

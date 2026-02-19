import * as SecureStore from 'expo-secure-store';
import { authApi } from './api';

const TOKEN_KEY = 'kavach_token';
const USER_KEY = 'kavach_user';

export type AuthUser = {
    id: string;
    email: string;
    role: string;
    name?: string;
    wardId?: string;
};

export const authService = {
    async login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
        const res = await authApi.login(email, password);
        const { token, user } = res.data;
        await SecureStore.setItemAsync(TOKEN_KEY, token);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
        return { token, user };
    },

    async register(data: {
        email: string;
        password: string;
        name: string;
        wardId?: string;
    }): Promise<{ token: string; user: AuthUser }> {
        const res = await authApi.register(data);
        const { token, user } = res.data;
        await SecureStore.setItemAsync(TOKEN_KEY, token);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
        return { token, user };
    },

    async getStoredToken(): Promise<string | null> {
        return SecureStore.getItemAsync(TOKEN_KEY);
    },

    async getStoredUser(): Promise<AuthUser | null> {
        const raw = await SecureStore.getItemAsync(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    },

    async logout(): Promise<void> {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
    },

    async me(): Promise<AuthUser> {
        const res = await authApi.me();
        return res.data;
    },
};

import { io } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from './api';

let socket = null;

export const connectSocket = async () => {
    if (socket?.connected) return socket;

    const token = await SecureStore.getItemAsync('kavach_token');
    if (!token) return null;

    socket = io(API_URL, {
        transports: ['websocket'],
        auth: { token },
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 5,
    });

    socket.on('connect', () => console.log('⚡ Socket connected:', socket.id));
    socket.on('connect_error', (err) => console.warn('⚠️ Socket error:', err.message));
    socket.on('disconnect', (reason) => console.log('⚡ Socket disconnected:', reason));

    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const getSocket = () => socket;

export const onRiskUpdate = (callback) => {
    socket?.on('risk:update', callback);
    return () => socket?.off('risk:update', callback);
};

export const onAlertNew = (callback) => {
    socket?.on('alert:new', callback);
    return () => socket?.off('alert:new', callback);
};

export const onFeedPost = (callback) => {
    socket?.on('feed:post', callback);
    return () => socket?.off('feed:post', callback);
};

export const onReportNew = (callback) => {
    socket?.on('report:new', callback);
    return () => socket?.off('report:new', callback);
};

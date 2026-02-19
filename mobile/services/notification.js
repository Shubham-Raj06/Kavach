import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiSavePushToken } from './api';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export const registerForPushNotifications = async () => {
    if (!Device.isDevice) {
        console.warn('Push notifications require a physical device');
        return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.warn('Push notification permission denied');
        return null;
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Kavach Alerts',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF453A',
        });
    }

    const token = (await Notifications.getExpoPushTokenAsync({
        projectId: 'kavach-mobile',
    })).data;

    console.log('📱 Push token:', token);

    // Save to backend
    try {
        await apiSavePushToken(token);
    } catch (e) {
        console.warn('Could not save push token:', e.message);
    }

    return token;
};

export const addNotificationListener = (callback) =>
    Notifications.addNotificationReceivedListener(callback);

export const addNotificationResponseListener = (callback) =>
    Notifications.addNotificationResponseReceivedListener(callback);

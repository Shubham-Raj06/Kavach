import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useUserStore } from '../store/userStore';
import { colors } from '../constants/theme';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import AlertsScreen from '../screens/AlertsScreen';
import ReportScreen from '../screens/ReportScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CommunityScreen from '../screens/CommunityScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
    const icons: Record<string, string> = {
        Home: '🏠', Alerts: '🔔', Report: '📝', Community: '💬', Profile: '👤',
    };
    return (
        <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.35 }}>{icons[name] ?? '•'}</Text>
    );
}

function AppTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                    borderTopWidth: 1,
                    height: 65,
                    paddingBottom: 10,
                },
                tabBarActiveTintColor: colors.accent,
                tabBarInactiveTintColor: colors.textDim,
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
                tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Alerts" component={AlertsScreen} />
            <Tab.Screen name="Report" component={ReportScreen} />
            <Tab.Screen name="Community" component={CommunityScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

function AuthStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
    );
}

export default function RootNavigator() {
    const { token, isHydrated, hydrate } = useUserStore();

    useEffect(() => { hydrate(); }, []);

    if (!isHydrated) {
        return (
            <View style={styles.splash}>
                <Text style={styles.splashTitle}>⚡ Kavach</Text>
                <Text style={styles.splashSub}>Hyperlocal Safety Radar</Text>
                <ActivityIndicator color={colors.accent} style={{ marginTop: 20 }} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {token ? <AppTabs /> : <AuthStack />}
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    splash: {
        flex: 1, backgroundColor: colors.bg,
        alignItems: 'center', justifyContent: 'center',
    },
    splashTitle: {
        fontSize: 36, fontWeight: '800', color: colors.text, letterSpacing: -1,
    },
    splashSub: {
        fontSize: 14, color: colors.textMuted, marginTop: 6,
    },
});

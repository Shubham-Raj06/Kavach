import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import useAuthStore from '../store/authStore';
import { onAlertNew, onRiskUpdate, onFeedPost } from '../services/socket';
import useAlertStore from '../store/alertStore';
import useRiskStore from '../store/riskStore';
import useFeedStore from '../store/feedStore';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

import HomeScreen from '../screens/HomeScreen';
import FeedScreen from '../screens/FeedScreen';
import ReportScreen from '../screens/ReportScreen';
import AlertsScreen from '../screens/AlertsScreen';
import MapScreen from '../screens/MapScreen';
import AwarenessScreen from '../screens/AwarenessScreen';
import ProfileScreen from '../screens/ProfileScreen';
import HospitalScreen from '../screens/HospitalScreen';
import GovtScreen from '../screens/GovtScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const DARK = '#0A0A0F';
const ACCENT = '#00D4FF';
const CARD = '#13131A';

const tabIcon = (name, focused) => {
    const icons = {
        Home: focused ? 'home' : 'home-outline',
        Feed: focused ? 'newspaper' : 'newspaper-outline',
        Report: focused ? 'add-circle' : 'add-circle-outline',
        Alerts: focused ? 'notifications' : 'notifications-outline',
        Map: focused ? 'map' : 'map-outline',
        Awareness: focused ? 'book' : 'book-outline',
        Profile: focused ? 'person' : 'person-outline',
        Hospital: focused ? 'medical' : 'medical-outline',
        Govt: focused ? 'business' : 'business-outline',
    };
    return icons[name] || 'ellipse';
};

const TAB_OPTS = {
    tabBarActiveTintColor: ACCENT,
    tabBarInactiveTintColor: '#555',
    tabBarStyle: { backgroundColor: CARD, borderTopColor: '#1E1E2E', height: 60 },
    tabBarLabelStyle: { fontSize: 10, marginBottom: 4 },
    headerShown: false,
};

const tabScreenOptions = ({ route }) => ({
    ...TAB_OPTS,
    tabBarIcon: ({ focused, color, size }) => (
        <Ionicons name={tabIcon(route.name, focused)} size={size} color={color} />
    ),
});

function CitizenTabs() {
    return (
        <Tab.Navigator screenOptions={tabScreenOptions}>
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Feed" component={FeedScreen} />
            <Tab.Screen name="Report" component={ReportScreen} />
            <Tab.Screen name="Alerts" component={AlertsScreen} />
            <Tab.Screen name="Map" component={MapScreen} />
            <Tab.Screen name="Awareness" component={AwarenessScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

function HospitalTabs() {
    return (
        <Tab.Navigator screenOptions={tabScreenOptions}>
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Hospital" component={HospitalScreen} />
            <Tab.Screen name="Alerts" component={AlertsScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

function GovtTabs() {
    return (
        <Tab.Navigator screenOptions={tabScreenOptions}>
            <Tab.Screen name="Govt" component={GovtScreen} />
            <Tab.Screen name="Alerts" component={AlertsScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

// ─── MainApp — renders the right tab set based on role ───────────────────────
function MainApp() {
    const user = useAuthStore(s => s.user);
    const addAlert = useAlertStore(s => s.addAlert);
    const updateRisk = useRiskStore(s => s.updateRisk);
    const addPost = useFeedStore(s => s.addPost);

    // Fix P1 socket leak: use refs to hold the current unsub functions.
    // Re-run when user changes so we never stack duplicate listeners.
    const unsubsRef = useRef([]);

    useEffect(() => {
        // Unsub any previous listeners from prior login sessions
        unsubsRef.current.forEach(fn => fn?.());
        unsubsRef.current = [
            onAlertNew(addAlert),
            onRiskUpdate(updateRisk),
            onFeedPost(addPost),
        ];
        return () => {
            unsubsRef.current.forEach(fn => fn?.());
            unsubsRef.current = [];
        };
    }, [user?.id]); // re-subscribe when user identity changes

    // New backend: role is uppercase CITIZEN / HOSPITAL / GOV
    if (user?.role === 'HOSPITAL') return <HospitalTabs />;
    if (user?.role === 'GOV') return <GovtTabs />;
    return <CitizenTabs />;
}

// ─── Root navigator ──────────────────────────────────────────────────────────
export default function AppNavigator() {
    const { user, isLoading, loadUser } = useAuthStore();

    useEffect(() => { loadUser(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: DARK }}>
                <ActivityIndicator size="large" color={ACCENT} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!user ? (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                    </>
                ) : (
                    <Stack.Screen name="Main" component={MainApp} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

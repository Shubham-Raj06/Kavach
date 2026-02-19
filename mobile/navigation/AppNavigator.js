import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Activity, Map as MapIcon, Bell, PlusCircle, User, Building, ShieldCheck, MessageSquare } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons'; // Keep for fallbacks if needed

import useAuthStore from '../store/authStore';
import { onAlertNew, onRiskUpdate, onFeedPost } from '../services/socket';
import useAlertStore from '../store/alertStore';
import useRiskStore from '../store/riskStore';
import useFeedStore from '../store/feedStore';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

import CitizenHome from '../screens/CitizenHome'; // New Safety Radar
import HomeScreen from '../screens/HomeScreen'; // Keep for Hospital/Govt for now
import FeedScreen from '../screens/FeedScreen';
import CommunityScreen from '../screens/CommunityScreen'; // New Chat
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

// ─── Legacy styling removed ───────────────────────────────────────────────────

// ─── Shared Tab Styling ───────────────────────────────────────────────────────
const TAB_OPTS = {
    tabBarActiveTintColor: '#009688',
    tabBarInactiveTintColor: '#999',
    tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 8, backgroundColor: '#FFFFFF', borderTopColor: '#F0F0F0' },
    tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
    headerShown: false,
};

function CitizenTabs() {
    return (
        <Tab.Navigator screenOptions={TAB_OPTS}>
            <Tab.Screen
                name="Home"
                component={CitizenHome}
                options={{
                    tabBarLabel: 'Safety',
                    tabBarIcon: ({ color, size }) => <Activity color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="Map"
                component={MapScreen}
                options={{
                    tabBarLabel: 'Map',
                    tabBarIcon: ({ color, size }) => <MapIcon color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="Community"
                component={CommunityScreen}
                options={{
                    tabBarLabel: 'Chat',
                    tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="Report"
                component={ReportScreen}
                options={{
                    tabBarLabel: 'Report',
                    tabBarIcon: ({ color, size }) => <PlusCircle color={color} size={32} />
                }}
            />
            <Tab.Screen
                name="Alerts"
                component={AlertsScreen}
                options={{
                    tabBarLabel: 'Alerts',
                    tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({ color, size }) => <User color={color} size={size} />
                }}
            />
        </Tab.Navigator>
    );
}

function HospitalTabs() {
    return (
        <Tab.Navigator screenOptions={TAB_OPTS}>
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Dashboard',
                    tabBarIcon: ({ color, size }) => <Activity color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="Hospital"
                component={HospitalScreen}
                options={{
                    tabBarLabel: 'Admissions',
                    tabBarIcon: ({ color, size }) => <Building color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="Alerts"
                component={AlertsScreen}
                options={{
                    tabBarLabel: 'Alerts',
                    tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({ color, size }) => <User color={color} size={size} />
                }}
            />
        </Tab.Navigator>
    );
}

function GovtTabs() {
    return (
        <Tab.Navigator screenOptions={TAB_OPTS}>
            <Tab.Screen
                name="Govt"
                component={GovtScreen}
                options={{
                    tabBarLabel: 'City View',
                    tabBarIcon: ({ color, size }) => <MapIcon color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="Alerts"
                component={AlertsScreen}
                options={{
                    tabBarLabel: 'Broadcast',
                    tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({ color, size }) => <ShieldCheck color={color} size={size} />
                }}
            />
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

    // New backend: role is uppercase or lowercase, normalize
    const role = user?.role?.toUpperCase();
    if (role === 'HOSPITAL') return <HospitalTabs />;
    if (role === 'GOV' || role === 'GOVT') return <GovtTabs />;
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

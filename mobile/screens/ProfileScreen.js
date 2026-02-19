import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../store/authStore';

const ROLE_CONFIG = {
    citizen: { emoji: '👤', color: '#00D4FF', label: 'Citizen' },
    hospital: { emoji: '🏥', color: '#30D158', label: 'Hospital' },
    govt: { emoji: '🏛️', color: '#FF9F0A', label: 'Government' },
};

export default function ProfileScreen() {
    const { user, logout } = useAuthStore();
    const cfg = ROLE_CONFIG[user?.role] || ROLE_CONFIG.citizen;

    const handleLogout = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: logout },
        ]);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Avatar */}
            <View style={styles.avatarSection}>
                <View style={[styles.avatar, { backgroundColor: cfg.color + '22', borderColor: cfg.color + '44' }]}>
                    <Text style={styles.avatarEmoji}>{cfg.emoji}</Text>
                </View>
                <Text style={styles.name}>{user?.name}</Text>
                <Text style={styles.email}>{user?.email}</Text>
                <View style={[styles.roleBadge, { backgroundColor: cfg.color + '22', borderColor: cfg.color + '44' }]}>
                    <Text style={[styles.roleText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
            </View>

            {/* Info cards */}
            <View style={styles.infoCard}>
                <InfoRow icon="location" label="Ward" value={`Ward ${user?.ward}`} />
                <InfoRow icon="shield" label="Role" value={cfg.label} />
                <InfoRow icon="calendar" label="Member since" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : '—'} />
            </View>

            {/* App info */}
            <View style={styles.infoCard}>
                <InfoRow icon="layers" label="App Version" value="2.0.0" />
                <InfoRow icon="server" label="Backend" value="kavach-api" />
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
                <Ionicons name="log-out-outline" size={18} color="#FF453A" />
                <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

function InfoRow({ icon, label, value }) {
    return (
        <View style={styles.row}>
            <Ionicons name={icon + '-outline'} size={16} color="#555" />
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0F' },
    content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
    avatarSection: { alignItems: 'center', marginBottom: 28 },
    avatar: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', borderWidth: 2, marginBottom: 14 },
    avatarEmoji: { fontSize: 40 },
    name: { color: '#FFF', fontSize: 24, fontWeight: '800' },
    email: { color: '#555', fontSize: 14, marginTop: 4 },
    roleBadge: { marginTop: 10, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
    roleText: { fontWeight: '700', fontSize: 13 },
    infoCard: { backgroundColor: '#13131A', borderRadius: 16, padding: 4, marginBottom: 14, borderWidth: 1, borderColor: '#1E1E2E' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
    rowLabel: { color: '#888', fontSize: 14, flex: 1 },
    rowValue: { color: '#FFF', fontSize: 14, fontWeight: '600' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FF453A11', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#FF453A33' },
    logoutText: { color: '#FF453A', fontWeight: '700', fontSize: 15 },
});

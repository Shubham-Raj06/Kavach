import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert
} from 'react-native';
import { ShieldCheck, MapPin, FileText, Award, LogOut, TrendingUp, User } from 'lucide-react-native';
import useAuthStore from '../store/authStore';

const RISK_HISTORY = [
    { day: 'M', level: 'LOW', height: 20 },
    { day: 'T', level: 'LOW', height: 15 },
    { day: 'W', level: 'MOD', height: 45 },
    { day: 'T', level: 'MOD', height: 50 },
    { day: 'F', level: 'HIGH', height: 80 },
    { day: 'S', level: 'HIGH', height: 90 },
    { day: 'S', level: 'MOD', height: 55 },
];

const BAR_COLOR = { LOW: '#2ECC71', MOD: '#F39C12', HIGH: '#E74C3C' };

const ProfileScreen = () => {
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout },
        ]);
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.avatarCircle}>
                    <User size={36} color="#009688" />
                </View>
                <Text style={styles.name}>{user?.name || 'Shubham Raj'}</Text>
                <Text style={styles.email}>{user?.email || 'rajshubham556@gmail.com'}</Text>
                <View style={styles.wardBadge}>
                    <MapPin size={14} color="#009688" />
                    <Text style={styles.wardText}>Ward 12 — Seelampur, Delhi</Text>
                </View>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statNum}>12</Text>
                    <Text style={styles.statLabel}>Reports Filed</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNum}>HIGH</Text>
                    <Text style={styles.statLabel}>Current Risk</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNum}>272</Text>
                    <Text style={styles.statLabel}>Ward Rank</Text>
                </View>
            </View>

            {/* Risk History Graph */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <TrendingUp size={20} color="#009688" />
                    <Text style={styles.cardTitle}>7-Day Ward Risk</Text>
                </View>
                <View style={styles.barChart}>
                    {RISK_HISTORY.map((r, i) => (
                        <View key={i} style={styles.barWrapper}>
                            <View style={[styles.bar, { height: r.height, backgroundColor: BAR_COLOR[r.level] }]} />
                            <Text style={styles.barLabel}>{r.day}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Privacy Badge */}
            <View style={[styles.card, { backgroundColor: '#E8F5E9' }]}>
                <View style={styles.cardHeader}>
                    <ShieldCheck size={20} color="#27AE60" />
                    <Text style={[styles.cardTitle, { color: '#27AE60' }]}>Privacy Guarantee</Text>
                </View>
                <Text style={styles.privacyText}>
                    Kavach never stores personal health data. Only anonymous ward-level signals are used for outbreak prediction. Your identity remains protected.
                </Text>
            </View>

            {/* Achievements */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Award size={20} color="#F39C12" />
                    <Text style={styles.cardTitle}>Civic Contributor</Text>
                </View>
                <Text style={styles.achieveText}>
                    You are among the top 3% most active citizens in Ward 12. Your reports have helped flag 2 early outbreaks.
                </Text>
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <LogOut size={20} color="#E74C3C" />
                <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>

            <View style={{ height: 100 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    header: { backgroundColor: '#FFF', padding: 32, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEE' },
    avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E0F2F1', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    name: { fontSize: 22, fontWeight: 'bold', color: '#222' },
    email: { fontSize: 14, color: '#888', marginTop: 4 },
    wardBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: '#E0F2F1', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    wardText: { color: '#009688', fontWeight: '600', fontSize: 13 },
    statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
    statCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 12, padding: 16, alignItems: 'center', elevation: 2 },
    statNum: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    statLabel: { fontSize: 11, color: '#999', marginTop: 4, textAlign: 'center' },
    card: { backgroundColor: '#FFF', marginHorizontal: 16, marginBottom: 14, borderRadius: 16, padding: 20, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    barChart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 100 },
    barWrapper: { alignItems: 'center', gap: 6 },
    bar: { width: 28, borderRadius: 6, minHeight: 8 },
    barLabel: { fontSize: 12, color: '#999' },
    privacyText: { fontSize: 14, color: '#555', lineHeight: 22 },
    achieveText: { fontSize: 14, color: '#555', lineHeight: 22 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: 16, backgroundColor: '#FFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#FDECEA' },
    logoutText: { color: '#E74C3C', fontWeight: 'bold', fontSize: 16 },
});

export default ProfileScreen;

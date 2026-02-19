import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../store/userStore';
import { colors, spacing, radius } from '../constants/theme';
import GlowCard from '../components/GlowCard';

const RISK_HISTORY = [
    { day: 'M', score: 15, level: 'LOW' },
    { day: 'T', score: 22, level: 'LOW' },
    { day: 'W', score: 48, level: 'MEDIUM' },
    { day: 'T', score: 55, level: 'MEDIUM' },
    { day: 'F', score: 78, level: 'HIGH' },
    { day: 'S', score: 87, level: 'CRITICAL' },
    { day: 'S', score: 52, level: 'MEDIUM' },
];

const LEVEL_COLOR: Record<string, string> = {
    LOW: colors.green, MEDIUM: colors.yellow, HIGH: colors.orange, CRITICAL: colors.red,
};

export default function ProfileScreen() {
    const { user, logout } = useUserStore();

    const handleLogout = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: logout },
        ]);
    };

    const maxScore = Math.max(...RISK_HISTORY.map(r => r.score));

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Identity Card */}
                <GlowCard glowColor={colors.accentGlow} style={styles.identityCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{(user?.name ?? 'S').charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.name}>{user?.name ?? 'Shubham Raj'}</Text>
                    <Text style={styles.email}>{user?.email ?? 'rajshubham556@gmail.com'}</Text>
                    <View style={styles.wardPill}>
                        <Text style={styles.wardText}>📍 Ward 12 — Seelampur, Delhi</Text>
                    </View>
                </GlowCard>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    {[
                        { label: 'Reports Filed', value: '12' },
                        { label: 'Current Risk', value: 'HIGH', color: colors.orange },
                        { label: 'Ward Active', value: '3y' },
                    ].map((s, i) => (
                        <View key={i} style={styles.statCard}>
                            <Text style={[styles.statVal, s.color ? { color: s.color } : {}]}>{s.value}</Text>
                            <Text style={styles.statLabel}>{s.label}</Text>
                        </View>
                    ))}
                </View>

                {/* 7-Day Risk History */}
                <GlowCard style={styles.section}>
                    <Text style={styles.sectionTitle}>📊 7-Day Risk History</Text>
                    <View style={styles.barChart}>
                        {RISK_HISTORY.map((r, i) => {
                            const col = LEVEL_COLOR[r.level];
                            const barH = Math.max(8, (r.score / maxScore) * 80);
                            return (
                                <View key={i} style={styles.barCol}>
                                    <Text style={[styles.barScore, { color: col }]}>{r.score}</Text>
                                    <View style={[styles.bar, { height: barH, backgroundColor: col }]} />
                                    <Text style={styles.barDay}>{r.day}</Text>
                                </View>
                            );
                        })}
                    </View>
                </GlowCard>

                {/* Privacy Badge */}
                <GlowCard glowColor={colors.greenGlow} style={styles.section}>
                    <Text style={styles.sectionTitle}>🔒 Privacy Guarantee</Text>
                    <Text style={styles.bodyText}>
                        Kavach never stores personal health data. Only anonymous ward-level signals are used for outbreak prediction. Your identity is always protected.
                    </Text>
                    <View style={styles.privacyBadge}>
                        <Text style={styles.privacyBadgeText}>✓ Zero PII Collected</Text>
                    </View>
                </GlowCard>

                {/* Contributor Badge */}
                <GlowCard glowColor={colors.yellowGlow} style={styles.section}>
                    <Text style={styles.sectionTitle}>🏅 Civic Contributor</Text>
                    <Text style={styles.bodyText}>
                        Top 3% most active citizen in Ward-12. Your 12 reports have helped flag 2 early outbreak clusters and prevent 500+ potential cases.
                    </Text>
                </GlowCard>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>

                <View style={{ height: 80 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    scroll: { flex: 1 },
    content: { padding: spacing.lg },
    identityCard: { alignItems: 'center', paddingVertical: 28 },
    avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.accentGlow, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    avatarText: { fontSize: 28, fontWeight: '800', color: colors.accent },
    name: { fontSize: 20, fontWeight: '700', color: colors.text },
    email: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
    wardPill: { marginTop: 12, backgroundColor: colors.surfaceAlt, paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
    wardText: { color: colors.accent, fontSize: 12, fontWeight: '600' },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    statVal: { fontSize: 18, fontWeight: '800', color: colors.text },
    statLabel: { fontSize: 10, color: colors.textDim, marginTop: 4, textAlign: 'center' },
    section: { marginBottom: 14 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
    bodyText: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
    barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 110 },
    barCol: { alignItems: 'center', flex: 1 },
    bar: { width: 20, borderRadius: 4, minHeight: 8 },
    barScore: { fontSize: 9, fontWeight: '700', marginBottom: 4 },
    barDay: { fontSize: 11, color: colors.textDim, marginTop: 4 },
    privacyBadge: { marginTop: 10, alignSelf: 'flex-start', backgroundColor: colors.greenGlow, paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.full },
    privacyBadgeText: { color: colors.green, fontSize: 12, fontWeight: '700' },
    logoutBtn: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.red + '44' },
    logoutText: { color: colors.red, fontWeight: '700', fontSize: 15 },
});

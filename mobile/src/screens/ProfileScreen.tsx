import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Alert, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
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
    const { user, setUser, logout } = useUserStore();

    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(user?.name ?? '');
    const [wardId, setWardId] = useState(user?.wardId ?? '');
    const [saving, setSaving] = useState(false);

    const wardMissing = !user?.wardId;

    const handleSave = async () => {
        if (!wardId.trim()) {
            Alert.alert('Ward Number Required', 'Please enter your ward number to continue. This is needed to show you local risk data.');
            return;
        }
        const trimmedName = name.trim();
        const trimmedWard = wardId.trim();

        setSaving(true);
        try {
            const updated = { ...user!, name: trimmedName, wardId: trimmedWard };
            // Persist locally
            await SecureStore.setItemAsync('kavach_user', JSON.stringify(updated));
            setUser(updated);
            setEditing(false);
            Alert.alert('✅ Saved', 'Your profile has been updated.');
        } catch {
            Alert.alert('Error', 'Could not save profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDiscard = () => {
        setName(user?.name ?? '');
        setWardId(user?.wardId ?? '');
        setEditing(false);
    };

    const handleLogout = () => {
        Alert.alert('Sign Out', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: logout },
        ]);
    };

    const maxScore = Math.max(...RISK_HISTORY.map(r => r.score));

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Ward Missing Banner */}
                {wardMissing && !editing && (
                    <TouchableOpacity style={styles.wardBanner} onPress={() => setEditing(true)} activeOpacity={0.8}>
                        <Text style={styles.wardBannerIcon}>⚠️</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.wardBannerTitle}>Ward number missing!</Text>
                            <Text style={styles.wardBannerSub}>Tap to set now — required for local risk data</Text>
                        </View>
                        <Text style={styles.wardBannerArrow}>›</Text>
                    </TouchableOpacity>
                )}

                {/* Identity / Edit Card */}
                <GlowCard glowColor={colors.accentGlow} style={styles.identityCard}>
                    {editing ? (
                        /* ── EDIT MODE ── */
                        <View style={styles.editForm}>
                            <Text style={styles.editTitle}>Edit Profile</Text>

                            <Text style={styles.fieldLabel}>Name</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Your name"
                                placeholderTextColor={colors.textDim}
                                autoCapitalize="words"
                            />

                            <View style={styles.fieldRow}>
                                <Text style={styles.fieldLabel}>Ward Number</Text>
                                <View style={styles.requiredPill}><Text style={styles.requiredText}>Required</Text></View>
                            </View>
                            <TextInput
                                style={[styles.input, { borderColor: wardId ? colors.border : colors.red }]}
                                value={wardId}
                                onChangeText={setWardId}
                                placeholder="e.g. 12"
                                placeholderTextColor={colors.textDim}
                                keyboardType="number-pad"
                                maxLength={6}
                            />
                            {!wardId.trim() && (
                                <Text style={styles.fieldError}>Ward number is required</Text>
                            )}

                            <View style={styles.editActions}>
                                <TouchableOpacity style={styles.discardBtn} onPress={handleDiscard}>
                                    <Text style={styles.discardText}>Discard</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                                    {saving
                                        ? <ActivityIndicator color="#fff" size="small" />
                                        : <Text style={styles.saveText}>Save</Text>
                                    }
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        /* ── VIEW MODE ── */
                        <>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{(user?.name ?? 'U').charAt(0).toUpperCase()}</Text>
                            </View>
                            <Text style={styles.name}>{user?.name ?? 'Set your name'}</Text>
                            <Text style={styles.email}>{user?.email ?? ''}</Text>
                            <View style={styles.wardPill}>
                                <Text style={styles.wardText}>
                                    {user?.wardId ? `📍 Ward ${user.wardId}` : '📍 Ward not set'}
                                </Text>
                            </View>
                            <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
                                <Text style={styles.editBtnText}>✏️ Edit Profile</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </GlowCard>

                {/* Stats Row */}
                {!editing && (
                    <>
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

                        {/* Logout */}
                        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                            <Text style={styles.logoutText}>Sign Out</Text>
                        </TouchableOpacity>
                    </>
                )}

                <View style={{ height: 80 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    scroll: { flex: 1 },
    content: { padding: spacing.lg },

    // Ward Missing Banner
    wardBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: colors.red + '18', borderWidth: 1, borderColor: colors.red + '44',
        borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md,
    },
    wardBannerIcon: { fontSize: 22 },
    wardBannerTitle: { color: colors.red, fontWeight: '700', fontSize: 14 },
    wardBannerSub: { color: colors.textDim, fontSize: 12, marginTop: 2 },
    wardBannerArrow: { color: colors.red, fontSize: 22, fontWeight: '300' },

    // Identity Card
    identityCard: { alignItems: 'center', paddingVertical: 28, marginBottom: spacing.md },
    avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.accentGlow, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    avatarText: { fontSize: 28, fontWeight: '800', color: colors.accent },
    name: { fontSize: 20, fontWeight: '700', color: colors.text },
    email: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
    wardPill: { marginTop: 12, backgroundColor: colors.surfaceAlt, paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
    wardText: { color: colors.accent, fontSize: 12, fontWeight: '600' },
    editBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: colors.surfaceAlt, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
    editBtnText: { color: colors.accent, fontSize: 13, fontWeight: '600' },

    // Edit Form
    editForm: { width: '100%' },
    editTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: spacing.lg, textAlign: 'center' },
    fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
    requiredPill: { backgroundColor: colors.red + '22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
    requiredText: { color: colors.red, fontSize: 10, fontWeight: '700' },
    input: {
        backgroundColor: colors.surfaceAlt, borderRadius: radius.md,
        borderWidth: 1, borderColor: colors.border,
        color: colors.text, fontSize: 15,
        paddingHorizontal: 14, paddingVertical: 12,
        marginBottom: 4,
    },
    fieldError: { color: colors.red, fontSize: 11, marginBottom: 10, marginLeft: 4 },
    editActions: { flexDirection: 'row', gap: 12, marginTop: spacing.md },
    discardBtn: {
        flex: 1, paddingVertical: 12, alignItems: 'center',
        borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
        backgroundColor: colors.surfaceAlt,
    },
    discardText: { color: colors.textMuted, fontWeight: '600', fontSize: 14 },
    saveBtn: {
        flex: 1, paddingVertical: 12, alignItems: 'center',
        borderRadius: radius.md, backgroundColor: colors.accent,
    },
    saveText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    // Stats
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    statVal: { fontSize: 18, fontWeight: '800', color: colors.text },
    statLabel: { fontSize: 10, color: colors.textDim, marginTop: 4, textAlign: 'center' },

    // Risk Bar Chart
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

import React, { useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAuthStore from '../store/authStore';
import useRiskStore from '../store/riskStore';
import useAlertStore from '../store/alertStore';
import RiskBadge from '../components/RiskBadge';
import AlertCard from '../components/AlertCard';

const LEVEL_COLORS = { LOW: '#30D158', MEDIUM: '#FFD60A', HIGH: '#FF9F0A', CRITICAL: '#FF453A' };

export default function HomeScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const user = useAuthStore(s => s.user);
    const { wardRisk, fetchWardRisk, isLoading: riskLoading, error: riskError } = useRiskStore();
    const { alerts, fetchAlerts } = useAlertStore();

    const load = useCallback(() => {
        if (user?.wardId) {
            fetchWardRisk(user.wardId);
            fetchAlerts(user.wardId);
        }
    }, [user?.wardId]);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const levelColor = LEVEL_COLORS[wardRisk?.level] || '#30D158';
    const recentAlerts = alerts.slice(0, 3);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
            refreshControl={<RefreshControl refreshing={riskLoading} onRefresh={load} tintColor="#00D4FF" />}
        >
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</Text>
                    <Text style={styles.sub}>Ward {user?.wardId} · {user?.role?.toLowerCase()}</Text>
                </View>
                <View style={[styles.roleDot, { backgroundColor: getRoleColor(user?.role) }]} />
            </View>

            {/* Error banner for risk */}
            {!!riskError && (
                <View style={styles.errBanner}>
                    <Ionicons name="warning-outline" size={14} color="#FF9F0A" />
                    <Text style={styles.errBannerTxt}> {riskError}</Text>
                </View>
            )}

            {/* Risk Card */}
            <View style={[styles.riskCard, { borderColor: levelColor + '44' }]}>
                <View style={styles.riskTop}>
                    <Text style={styles.riskTitle}>Your Ward Risk</Text>
                    <RiskBadge level={wardRisk?.level || 'LOW'} score={wardRisk?.score} />
                </View>

                <View style={styles.scoreWrap}>
                    <Text style={[styles.scoreNum, { color: levelColor }]}>{wardRisk?.score ?? 0}</Text>
                    <Text style={styles.scoreLabel}>/ 100</Text>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.stat}>
                        <Ionicons name="body" size={16} color="#00D4FF" />
                        <Text style={styles.statVal}>{wardRisk?.symptomCount ?? 0}</Text>
                        <Text style={styles.statLabel}>Reports</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.stat}>
                        <Ionicons name="bed" size={16} color="#FF9F0A" />
                        <Text style={styles.statVal}>{wardRisk?.admissionCount ?? 0}</Text>
                        <Text style={styles.statLabel}>Admissions</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.stat}>
                        <Ionicons name="time" size={16} color="#888" />
                        <Text style={styles.statVal}>{wardRisk?.updatedAt ? relativeTime(wardRisk.updatedAt) : 'N/A'}</Text>
                        <Text style={styles.statLabel}>Updated</Text>
                    </View>
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.actionsRow}>
                <QuickAction icon="add-circle" label="Report" color="#30D158" onPress={() => navigation.navigate('Report')} />
                <QuickAction icon="notifications" label="Alerts" color="#FF9F0A" onPress={() => navigation.navigate('Alerts')} />
                <QuickAction icon="map" label="Map" color="#00D4FF" onPress={() => navigation.navigate('Map')} />
                <QuickAction icon="newspaper" label="Feed" color="#BF5AF2" onPress={() => navigation.navigate('Feed')} />
            </View>

            {/* Recent Alerts */}
            {recentAlerts.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Alerts</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
                            <Text style={styles.seeAll}>See all</Text>
                        </TouchableOpacity>
                    </View>
                    {recentAlerts.map((a, i) => <AlertCard key={a._id || a.id || i} alert={a} />)}
                </View>
            )}
        </ScrollView>
    );
}

function QuickAction({ icon, label, color, onPress }) {
    return (
        <TouchableOpacity style={styles.action} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.actionIcon, { backgroundColor: color + '22' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <Text style={styles.actionLabel}>{label}</Text>
        </TouchableOpacity>
    );
}

const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
};

const getRoleColor = (role) => {
    if (role === 'GOV') return '#FF9F0A';
    if (role === 'HOSPITAL') return '#30D158';
    return '#00D4FF';
};

const relativeTime = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 60000);
    if (diff < 60) return `${diff}m`;
    return `${Math.floor(diff / 60)}h`;
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0F' },
    content: { padding: 20, paddingBottom: 30 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    greeting: { color: '#FFF', fontSize: 22, fontWeight: '700' },
    sub: { color: '#555', fontSize: 13, marginTop: 2, textTransform: 'capitalize' },
    roleDot: { width: 10, height: 10, borderRadius: 5 },
    errBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF9F0A15', borderRadius: 10, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#FF9F0A33' },
    errBannerTxt: { color: '#FF9F0A', fontSize: 12, flex: 1 },
    riskCard: { backgroundColor: '#13131A', borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 20 },
    riskTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    riskTitle: { color: '#888', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    scoreWrap: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 20 },
    scoreNum: { fontSize: 64, fontWeight: '800', lineHeight: 68 },
    scoreLabel: { color: '#444', fontSize: 20, marginBottom: 8, marginLeft: 4 },
    statsRow: { flexDirection: 'row', alignItems: 'center' },
    stat: { flex: 1, alignItems: 'center', gap: 3 },
    statVal: { color: '#FFF', fontWeight: '700', fontSize: 16 },
    statLabel: { color: '#555', fontSize: 10 },
    divider: { width: 1, height: 30, backgroundColor: '#1E1E2E' },
    actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    action: { flex: 1, alignItems: 'center', gap: 8 },
    actionIcon: { width: 54, height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    actionLabel: { color: '#888', fontSize: 11, fontWeight: '600' },
    section: { marginTop: 8 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { color: '#FFF', fontSize: 17, fontWeight: '700' },
    seeAll: { color: '#00D4FF', fontSize: 13 },
});

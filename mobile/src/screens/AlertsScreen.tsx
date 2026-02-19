import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlerts } from '../hooks/useAlerts';
import { colors, spacing, radius } from '../constants/theme';
import GlowCard from '../components/GlowCard';

const SEV_COLOR: Record<string, string> = {
    CRITICAL: colors.red,
    HIGH: colors.orange,
    MEDIUM: colors.yellow,
    LOW: colors.green,
};

const CAT_ICON: Record<string, string> = {
    VECTOR_BORNE: '🦟',
    WATERBORNE: '💧',
    HEALTH_ADVISORY: '🏥',
    RESPIRATORY: '🫁',
    STABLE: '✅',
};

const PAST_ALERTS = [
    { id: 'p1', title: 'Fogging Drive — Lane 7 & 8', date: 'Feb 17', type: 'Vector' },
    { id: 'p2', title: 'School Closure — Fever Surge', date: 'Feb 15', type: 'Health' },
    { id: 'p3', title: 'Water Tanker Deployed — Seelampur', date: 'Feb 13', type: 'Water' },
    { id: 'p4', title: 'Awareness Camp — Malaria Prevention', date: 'Feb 10', type: 'Vector' },
];

function timeAgo(iso: string): string {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function AlertsScreen() {
    const { data: alerts, isLoading } = useAlerts();
    const [filter, setFilter] = useState('ALL');

    const filtered = filter === 'ALL'
        ? (alerts ?? [])
        : (alerts ?? []).filter((a: any) => a.severity === filter);

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>🔔 Live Alerts</Text>
                    <Text style={styles.subtitle}>Ward 12 — Seelampur</Text>
                </View>

                {/* Filter Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
                    {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(f => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.chip, filter === f && { backgroundColor: SEV_COLOR[f] ?? colors.accent, borderColor: SEV_COLOR[f] ?? colors.accent }]}
                            onPress={() => setFilter(f)}
                        >
                            <Text style={[styles.chipText, filter === f && { color: '#fff' }]}>{f}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Alert Cards */}
                {isLoading ? (
                    <Text style={styles.loadingText}>Loading alerts...</Text>
                ) : filtered.length === 0 ? (
                    <GlowCard style={styles.emptyCard}>
                        <Text style={styles.emptyText}>✅ No active {filter !== 'ALL' ? filter.toLowerCase() : ''} alerts for your ward right now.</Text>
                    </GlowCard>
                ) : (
                    filtered.map((alert: any) => {
                        const col = SEV_COLOR[alert.severity] ?? colors.textMuted;
                        const icon = CAT_ICON[alert.outbreakCategory] ?? '⚠️';
                        return (
                            <GlowCard key={alert.id} glowColor={col + '40'} style={{ ...styles.alertCard, borderLeftColor: col }}>
                                <View style={styles.alertTop}>
                                    <Text style={styles.alertIcon}>{icon}</Text>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.alertTitle}>{alert.title}</Text>
                                        <Text style={styles.alertMeta}>
                                            {alert.issuedBy} · {timeAgo(alert.createdAt)}
                                        </Text>
                                    </View>
                                    <View style={[styles.sevBadge, { backgroundColor: col + '22', borderColor: col + '44' }]}>
                                        <Text style={[styles.sevText, { color: col }]}>{alert.severity}</Text>
                                    </View>
                                </View>
                                <Text style={styles.alertBody}>{alert.message}</Text>
                            </GlowCard>
                        );
                    })
                )}

                {/* Past Alerts */}
                <Text style={styles.sectionTitle}>📋 Past Alerts</Text>
                {PAST_ALERTS.map(p => (
                    <View key={p.id} style={styles.pastRow}>
                        <View style={styles.pastDot} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.pastTitle}>{p.title}</Text>
                            <Text style={styles.pastMeta}>{p.date} · {p.type}</Text>
                        </View>
                    </View>
                ))}

                <View style={{ height: 80 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    scroll: { flex: 1 },
    content: { padding: spacing.lg },
    header: { marginBottom: spacing.lg },
    title: { fontSize: 24, fontWeight: '800', color: colors.text },
    subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
    filterScroll: { marginBottom: spacing.lg },
    filterRow: { gap: 8, paddingRight: spacing.lg },
    chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    chipText: { fontWeight: '600', color: colors.textMuted, fontSize: 12 },
    loadingText: { color: colors.textDim, textAlign: 'center', padding: 20 },
    emptyCard: { alignItems: 'center', paddingVertical: 24 },
    emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
    alertCard: { marginBottom: spacing.md, borderLeftWidth: 3 },
    alertTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
    alertIcon: { fontSize: 22, marginTop: 1 },
    alertTitle: { fontWeight: '700', color: colors.text, fontSize: 14 },
    alertMeta: { fontSize: 11, color: colors.textDim, marginTop: 2 },
    sevBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm, borderWidth: 1 },
    sevText: { fontSize: 10, fontWeight: '700' },
    alertBody: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: spacing.md, marginTop: spacing.lg },
    pastRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    pastDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textDim },
    pastTitle: { fontWeight: '600', color: colors.textMuted, fontSize: 13 },
    pastMeta: { fontSize: 11, color: colors.textDim, marginTop: 2 },
});

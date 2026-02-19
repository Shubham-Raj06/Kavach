import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView
} from 'react-native';
import { AlertTriangle, Droplet, Activity, Building, ChevronRight, Bell, Info } from 'lucide-react-native';

const ALERTS = [
    {
        id: '1',
        type: 'HEALTH',
        title: 'Dengue Advisory — Ward 12',
        body: 'Dengue cases have risen 3x this week. Use repellents and clean stagnant water.',
        authority: 'Delhi Health Dept',
        time: '10 min ago',
        urgent: true,
        icon: Activity,
        color: '#E74C3C',
        bg: '#FDEDEC',
    },
    {
        id: '2',
        type: 'WATER',
        title: 'Water Supply Disruption',
        body: 'Planned maintenance in Blocks B–D until 4 PM. Store water in advance.',
        authority: 'Delhi Jal Board',
        time: '1 hour ago',
        urgent: false,
        icon: Droplet,
        color: '#2980B9',
        bg: '#EBF5FB',
    },
    {
        id: '3',
        type: 'HOSPITAL',
        title: 'GTB Hospital OPD — High Load',
        body: 'OPD footfall is 140% above normal. Expect 2-3 hr wait. Visit only if urgent.',
        authority: 'GTB Hospital Admin',
        time: '2 hours ago',
        urgent: false,
        icon: Building,
        color: '#8E44AD',
        bg: '#F5EEF8',
    },
    {
        id: '4',
        type: 'HEALTH',
        title: 'Cholera Surveillance Alert',
        body: 'Precautionary alert based on water sample irregularity. Avoid tap water directly.',
        authority: 'Municipal Corp. Of Delhi',
        time: '5 hours ago',
        urgent: false,
        icon: AlertTriangle,
        color: '#E67E22',
        bg: '#FEF9E7',
    },
];

const PAST_ALERTS = [
    { id: 'p1', title: 'Fogging Drive — Lane 7 & 8', date: 'Feb 17', type: 'Vector' },
    { id: 'p2', title: 'School Closure — Fever Surge', date: 'Feb 15', type: 'Health' },
    { id: 'p3', title: 'Water Tanker Deployed — Seelampur', date: 'Feb 13', type: 'Water' },
];

const AlertsScreen = () => {
    const [filter, setFilter] = useState('ALL');

    const filtered = filter === 'ALL' ? ALERTS : ALERTS.filter(a => a.type === filter);

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <Bell size={28} color="#FFF" />
                <View style={{ marginLeft: 12 }}>
                    <Text style={styles.headerTitle}>Live Alerts</Text>
                    <Text style={styles.headerSub}>Ward 12 • Seelampur</Text>
                </View>
            </View>

            {/* Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap: 10, paddingHorizontal: 20 }}>
                {['ALL', 'HEALTH', 'WATER', 'HOSPITAL'].map(f => (
                    <TouchableOpacity key={f} style={[styles.chip, filter === f && styles.activeChip]} onPress={() => setFilter(f)}>
                        <Text style={[styles.chipText, filter === f && styles.activeChipText]}>{f}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Alert Cards */}
            <View style={{ padding: 16, gap: 14 }}>
                {filtered.map(alert => {
                    const Icon = alert.icon;
                    return (
                        <TouchableOpacity key={alert.id} style={[styles.card, { borderLeftColor: alert.color, backgroundColor: alert.bg }]}>
                            <View style={styles.cardRow}>
                                <View style={[styles.iconBox, { backgroundColor: alert.color + '22' }]}>
                                    <Icon size={22} color={alert.color} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={styles.titleRow}>
                                        <Text style={styles.cardTitle}>{alert.title}</Text>
                                        {alert.urgent && <View style={styles.urgentBadge}><Text style={styles.urgentText}>URGENT</Text></View>}
                                    </View>
                                    <Text style={styles.cardBody}>{alert.body}</Text>
                                    <Text style={styles.authority}>Issued by {alert.authority} • {alert.time}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Past Alerts */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Past Alerts</Text>
            </View>
            {PAST_ALERTS.map(p => (
                <View key={p.id} style={styles.pastRow}>
                    <View style={styles.dot} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.pastTitle}>{p.title}</Text>
                        <Text style={styles.pastMeta}>{p.date} • {p.type}</Text>
                    </View>
                    <ChevronRight size={16} color="#CCC" />
                </View>
            ))}

            <View style={{ height: 100 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: {
        backgroundColor: '#C0392B', paddingTop: 55, paddingBottom: 24,
        paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center',
        borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
    headerSub: { color: '#FADBD8', fontSize: 13 },
    filterRow: { marginTop: 16, marginBottom: 4 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EEE' },
    activeChip: { backgroundColor: '#C0392B' },
    chipText: { fontWeight: '600', color: '#666', fontSize: 12 },
    activeChipText: { color: '#FFF' },
    card: { borderRadius: 14, padding: 16, borderLeftWidth: 4, marginBottom: 2 },
    cardRow: { flexDirection: 'row', gap: 14 },
    iconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    cardTitle: { fontWeight: 'bold', fontSize: 15, color: '#222', flex: 1 },
    cardBody: { marginTop: 6, color: '#555', fontSize: 14, lineHeight: 20 },
    authority: { marginTop: 8, fontSize: 11, color: '#888' },
    urgentBadge: { backgroundColor: '#E74C3C', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    urgentText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
    sectionHeader: { paddingHorizontal: 20, marginTop: 16, marginBottom: 8 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    pastRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', gap: 12 },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#BDC3C7' },
    pastTitle: { fontWeight: '600', color: '#444' },
    pastMeta: { fontSize: 12, color: '#999', marginTop: 2 },
});

export default AlertsScreen;

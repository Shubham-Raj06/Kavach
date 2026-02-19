import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../store/authStore';
import { apiGetGovtDashboard, apiBroadcastAlert } from '../services/api';
import RiskBadge from '../components/RiskBadge';

export default function GovtScreen() {
    const user = useAuthStore(s => s.user);
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(false);
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [broadcastSev, setBroadcastSev] = useState('WARNING');
    const [broadcasting, setBroadcasting] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const data = await apiGetGovtDashboard();
            setDashboard(data);
        } catch (e) {
            console.warn(e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { load(); }, []));

    const handleBroadcast = async () => {
        if (!broadcastMsg.trim()) return Alert.alert('Error', 'Enter a message to broadcast');
        setBroadcasting(true);
        try {
            await apiBroadcastAlert({ message: broadcastMsg, severity: broadcastSev });
            setBroadcastMsg('');
            Alert.alert('✅ Broadcast Sent', 'Alert sent to all wards citywide');
        } catch (e) {
            Alert.alert('Error', e.message);
        } finally {
            setBroadcasting(false);
        }
    };

    const s = dashboard?.summary;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#FF9F0A" />}
        >
            <Text style={styles.title}>Govt Dashboard</Text>
            <Text style={styles.sub}>Delhi City Overview</Text>

            {/* Summary stats */}
            {s && (
                <View style={styles.statsGrid}>
                    <StatCard label="Critical Wards" value={s.criticalWards} color="#FF453A" icon="warning" />
                    <StatCard label="High Risk" value={s.highWards} color="#FF9F0A" icon="alert-circle" />
                    <StatCard label="Active Alerts" value={s.activeAlerts} color="#FFD60A" icon="notifications" />
                    <StatCard label="Reports 24h" value={s.reportsLast24h} color="#00D4FF" icon="document-text" />
                    <StatCard label="Citizens" value={s.totalCitizens} color="#30D158" icon="people" />
                    <StatCard label="Total Wards" value={s.totalWards} color="#BF5AF2" icon="map" />
                </View>
            )}

            {/* Broadcast */}
            <View style={styles.card}>
                <Text style={styles.sectionLabel}>📢 Broadcast Alert Citywide</Text>
                <TextInput
                    style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                    placeholder="Type your alert message..."
                    placeholderTextColor="#444"
                    value={broadcastMsg}
                    onChangeText={setBroadcastMsg}
                    multiline
                />
                <View style={styles.sevRow}>
                    {['INFO', 'WARNING', 'HIGH', 'CRITICAL'].map(sev => (
                        <TouchableOpacity
                            key={sev}
                            style={[styles.sevBtn, broadcastSev === sev && styles.sevSelected]}
                            onPress={() => setBroadcastSev(sev)}
                        >
                            <Text style={[styles.sevText, broadcastSev === sev && { color: '#FFF' }]}>{sev}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <TouchableOpacity style={styles.broadcastBtn} onPress={handleBroadcast} disabled={broadcasting}>
                    <Ionicons name="megaphone-outline" size={18} color="#000" />
                    <Text style={styles.broadcastText}>{broadcasting ? 'Sending...' : 'Broadcast Now'}</Text>
                </TouchableOpacity>
            </View>

            {/* Ward risk table */}
            {dashboard?.wardRisks?.length > 0 && (
                <View style={styles.card}>
                    <Text style={styles.sectionLabel}>All Ward Risk Scores</Text>
                    {dashboard.wardRisks.slice(0, 20).map(w => (
                        <View key={w.ward} style={styles.wardRow}>
                            <Text style={styles.wardNum}>Ward {w.ward}</Text>
                            <Text style={styles.wardScore}>{w.score}</Text>
                            <RiskBadge level={w.level} size="sm" />
                        </View>
                    ))}
                </View>
            )}
        </ScrollView>
    );
}

function StatCard({ label, value, color, icon }) {
    return (
        <View style={[styles.statCard, { borderColor: color + '33' }]}>
            <Ionicons name={icon + '-outline'} size={20} color={color} />
            <Text style={[styles.statVal, { color }]}>{value ?? '—'}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0F' },
    content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
    title: { color: '#FFF', fontSize: 28, fontWeight: '800', marginBottom: 4 },
    sub: { color: '#555', fontSize: 13, marginBottom: 20 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
    statCard: { width: '30%', backgroundColor: '#13131A', borderRadius: 14, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1 },
    statVal: { fontSize: 24, fontWeight: '800' },
    statLabel: { color: '#555', fontSize: 10, textAlign: 'center' },
    card: { backgroundColor: '#13131A', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1E1E2E' },
    sectionLabel: { color: '#888', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
    input: { backgroundColor: '#0A0A0F', borderWidth: 1, borderColor: '#2A2A3A', borderRadius: 10, padding: 12, color: '#FFF', fontSize: 14, marginBottom: 12 },
    sevRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    sevBtn: { flex: 1, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#2A2A3A', alignItems: 'center' },
    sevSelected: { backgroundColor: '#2A2A3A', borderColor: '#00D4FF' },
    sevText: { color: '#555', fontSize: 11, fontWeight: '700' },
    broadcastBtn: { backgroundColor: '#FF9F0A', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    broadcastText: { color: '#000', fontWeight: '700', fontSize: 15 },
    wardRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1E1E2E' },
    wardNum: { color: '#FFF', fontWeight: '600', fontSize: 14, width: 70 },
    wardScore: { color: '#888', fontSize: 14, flex: 1 },
});

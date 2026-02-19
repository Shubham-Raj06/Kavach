import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import useRiskStore from '../store/riskStore';
import RiskBadge from '../components/RiskBadge';

const LEVEL_COLORS = { LOW: '#30D158', MEDIUM: '#FFD60A', HIGH: '#FF9F0A', CRITICAL: '#FF453A' };

// Simple ward grid heatmap (no native maps dependency)
export default function MapScreen() {
    const { heatmap, fetchHeatmap, isLoading } = useRiskStore();
    const [selected, setSelected] = useState(null);

    useEffect(() => { fetchHeatmap(); }, []);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Risk Heatmap</Text>
                <Text style={styles.sub}>Tap a ward for details</Text>
            </View>

            {/* Legend */}
            <View style={styles.legend}>
                {Object.entries(LEVEL_COLORS).map(([level, color]) => (
                    <View key={level} style={styles.legendItem}>
                        <View style={[styles.dot, { backgroundColor: color }]} />
                        <Text style={styles.legendLabel}>{level}</Text>
                    </View>
                ))}
            </View>

            {isLoading && <ActivityIndicator color="#00D4FF" style={{ marginTop: 20 }} />}

            <ScrollView contentContainerStyle={styles.grid}>
                {heatmap.map(ward => (
                    <TouchableOpacity
                        key={ward.ward}
                        style={[styles.wardCell, { backgroundColor: LEVEL_COLORS[ward.level] + '33', borderColor: LEVEL_COLORS[ward.level] + '66' }]}
                        onPress={() => setSelected(ward)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.wardNum, { color: LEVEL_COLORS[ward.level] }]}>{ward.ward}</Text>
                        <Text style={styles.wardScore}>{ward.score}</Text>
                    </TouchableOpacity>
                ))}
                {heatmap.length === 0 && !isLoading && (
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No risk data yet. Reports will populate this map.</Text>
                    </View>
                )}
            </ScrollView>

            {/* Ward detail modal */}
            <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
                <TouchableOpacity style={styles.overlay} onPress={() => setSelected(null)} activeOpacity={1}>
                    <View style={styles.modal}>
                        <Text style={styles.modalTitle}>Ward {selected?.ward}</Text>
                        <RiskBadge level={selected?.level} score={selected?.score} />
                        <View style={styles.modalStats}>
                            <Stat label="Symptom Reports" value={selected?.symptomCount ?? 0} />
                            <Stat label="Hospital Admissions" value={selected?.admissionCount ?? 0} />
                            <Stat label="Risk Score" value={`${selected?.score ?? 0}/100`} />
                        </View>
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
                            <Text style={styles.closeBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

function Stat({ label, value }) {
    return (
        <View style={styles.modalStat}>
            <Text style={styles.modalStatVal}>{value}</Text>
            <Text style={styles.modalStatLabel}>{label}</Text>
        </View>
    );
}



const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0F' },
    header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
    title: { color: '#FFF', fontSize: 28, fontWeight: '800' },
    sub: { color: '#555', fontSize: 13, marginTop: 4 },
    legend: { flexDirection: 'row', paddingHorizontal: 20, gap: 16, marginBottom: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    legendLabel: { color: '#777', fontSize: 12 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, paddingBottom: 30 },
    wardCell: { width: '18%', margin: '1%', aspectRatio: 1, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    wardNum: { fontSize: 11, fontWeight: '700' },
    wardScore: { fontSize: 9, color: '#888' },
    empty: { flex: 1, width: '100%', alignItems: 'center', paddingTop: 40 },
    emptyText: { color: '#444', textAlign: 'center', fontSize: 14 },
    overlay: { flex: 1, backgroundColor: '#000A', justifyContent: 'flex-end' },
    modal: { backgroundColor: '#13131A', borderRadius: 24, padding: 28, margin: 16, borderWidth: 1, borderColor: '#2A2A3A' },
    modalTitle: { color: '#FFF', fontSize: 26, fontWeight: '800', marginBottom: 10 },
    modalStats: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20 },
    modalStat: { alignItems: 'center' },
    modalStatVal: { color: '#FFF', fontSize: 22, fontWeight: '800' },
    modalStatLabel: { color: '#555', fontSize: 11, marginTop: 3, textAlign: 'center' },
    closeBtn: { backgroundColor: '#1E1E2E', borderRadius: 12, padding: 14, alignItems: 'center' },
    closeBtnText: { color: '#FFF', fontWeight: '600' },
});

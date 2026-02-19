import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ADVISORIES = [
    { id: '1', title: '🦟 Dengue Prevention Advisory', body: 'Remove standing water from containers, flower pots, and tyres. Use mosquito nets and repellents. Wear long-sleeved clothing during peak mosquito hours (dawn and dusk).', source: 'MCD Health Dept', date: 'Feb 2026', severity: 'HIGH', url: 'https://mcdonline.nic.in' },
    { id: '2', title: '🚰 Water Quality Alert — Zone B', body: 'Water supply from certain areas may be contaminated. Boil water before drinking. Avoid consuming raw vegetables washed with tap water.', source: 'Delhi Jal Board', date: 'Feb 2026', severity: 'WARNING', url: null },
    { id: '3', title: '🤧 Seasonal Flu Advisory', body: 'Influenza cases are rising. Get vaccinated at your nearest health center. Wash hands frequently. Stay home if you have fever or respiratory symptoms.', source: 'Ministry of Health', date: 'Jan 2026', severity: 'INFO', url: 'https://mohfw.gov.in' },
    { id: '4', title: '🌡️ Heat Wave Preparedness', body: 'Stay indoors between 12pm–3pm. Drink plenty of water. Wet cloth on forehead helps. Contact nearest health center if you experience heat exhaustion.', source: 'NDMA', date: 'Jan 2026', severity: 'INFO', url: null },
    { id: '5', title: '💉 Free Vaccination Drive', body: 'Free COVID booster and seasonal flu vaccination available at all ward clinics. Carry Aadhaar card. No appointment needed.', source: 'Govt of Delhi', date: 'Dec 2025', severity: 'INFO', url: null },
];

const SEV_COLORS = { HIGH: '#FF9F0A', WARNING: '#FFD60A', INFO: '#00D4FF' };

export default function AwarenessScreen() {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Awareness Center</Text>
                <Text style={styles.sub}>Official health advisories</Text>
            </View>
            <FlatList
                data={ADVISORIES}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <View style={[styles.card, { borderLeftColor: SEV_COLORS[item.severity] }]}>
                        <View style={styles.cardHeader}>
                            <Text style={[styles.sev, { color: SEV_COLORS[item.severity] }]}>{item.severity}</Text>
                            <Text style={styles.date}>{item.date}</Text>
                        </View>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <Text style={styles.cardBody}>{item.body}</Text>
                        <View style={styles.cardFooter}>
                            <View style={styles.sourceRow}>
                                <Ionicons name="shield-checkmark" size={12} color="#555" />
                                <Text style={styles.source}>{item.source}</Text>
                            </View>
                            {item.url && (
                                <TouchableOpacity onPress={() => Linking.openURL(item.url)}>
                                    <Text style={styles.link}>Read more →</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0F' },
    header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
    title: { color: '#FFF', fontSize: 28, fontWeight: '800' },
    sub: { color: '#555', fontSize: 13, marginTop: 4 },
    list: { padding: 16, paddingBottom: 30 },
    card: { backgroundColor: '#13131A', borderRadius: 14, padding: 16, marginBottom: 12, borderLeftWidth: 3, borderWidth: 1, borderColor: '#1E1E2E' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    sev: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
    date: { color: '#444', fontSize: 11 },
    cardTitle: { color: '#FFF', fontWeight: '700', fontSize: 15, marginBottom: 8 },
    cardBody: { color: '#AAA', fontSize: 13, lineHeight: 20 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    source: { color: '#555', fontSize: 11 },
    link: { color: '#00D4FF', fontSize: 12, fontWeight: '600' },
});

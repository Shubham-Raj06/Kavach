import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../store/authStore';
import useRiskStore from '../store/riskStore';
import { apiLogAdmission } from '../services/api';
import RiskBadge from '../components/RiskBadge';

export default function HospitalScreen() {
    const user = useAuthStore(s => s.user);
    const { hospitalOverview, fetchHospitalOverview, isLoading } = useRiskStore();
    const [form, setForm] = useState({ count: '', bedCapacity: '', bedsAvailable: '', diseaseCategory: 'general' });
    const [submitting, setSubmitting] = useState(false);

    useFocusEffect(useCallback(() => { fetchHospitalOverview(); }, []));

    const handleLog = async () => {
        if (!form.count) return Alert.alert('Error', 'Please enter admission count');
        setSubmitting(true);
        try {
            await apiLogAdmission({
                count: parseInt(form.count),
                bedCapacity: parseInt(form.bedCapacity) || 0,
                bedsAvailable: parseInt(form.bedsAvailable) || 0,
                diseaseCategory: form.diseaseCategory,
            });
            setForm({ count: '', bedCapacity: '', bedsAvailable: '', diseaseCategory: 'general' });
            Alert.alert('✅ Logged', 'Admission data submitted successfully');
            fetchHospitalOverview();
        } catch (e) {
            Alert.alert('Error', e.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchHospitalOverview} tintColor="#30D158" />}
        >
            <Text style={styles.title}>Hospital Dashboard</Text>
            <Text style={styles.sub}>Ward {user?.ward} · {user?.name}</Text>

            {/* Log admissions */}
            <View style={styles.card}>
                <Text style={styles.sectionLabel}>Log Today's Admissions</Text>
                {[['count', 'Admission Count *', 'numeric'], ['bedCapacity', 'Total Bed Capacity', 'numeric'], ['bedsAvailable', 'Beds Available', 'numeric']].map(([key, label, kb]) => (
                    <View key={key}>
                        <Text style={styles.inputLabel}>{label}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0"
                            placeholderTextColor="#444"
                            value={form[key]}
                            onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
                            keyboardType={kb}
                        />
                    </View>
                ))}
                <TouchableOpacity style={styles.submitBtn} onPress={handleLog} disabled={submitting}>
                    <Ionicons name="save-outline" size={18} color="#000" />
                    <Text style={styles.submitText}>{submitting ? 'Saving...' : 'Log Admissions'}</Text>
                </TouchableOpacity>
            </View>

            {/* High-risk wards */}
            <View style={styles.card}>
                <Text style={styles.sectionLabel}>⚠️ High-Risk Wards Citywide</Text>
                {hospitalOverview.length === 0 ? (
                    <Text style={styles.emptyText}>No HIGH/CRITICAL wards — city is safe 🟢</Text>
                ) : (
                    hospitalOverview.map(w => (
                        <View key={w.ward} style={styles.wardRow}>
                            <Text style={styles.wardNum}>Ward {w.ward}</Text>
                            <View style={styles.wardStats}>
                                <Text style={styles.wardStat}>{w.symptomCount} reports</Text>
                            </View>
                            <RiskBadge level={w.level} score={w.score} size="sm" />
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0F' },
    content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
    title: { color: '#FFF', fontSize: 28, fontWeight: '800', marginBottom: 4 },
    sub: { color: '#555', fontSize: 13, marginBottom: 24 },
    card: { backgroundColor: '#13131A', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1E1E2E' },
    sectionLabel: { color: '#888', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
    inputLabel: { color: '#666', fontSize: 12, marginBottom: 5 },
    input: { backgroundColor: '#0A0A0F', borderWidth: 1, borderColor: '#2A2A3A', borderRadius: 10, padding: 12, color: '#FFF', fontSize: 15, marginBottom: 12 },
    submitBtn: { backgroundColor: '#30D158', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
    submitText: { color: '#000', fontWeight: '700', fontSize: 15 },
    wardRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1E1E2E' },
    wardNum: { color: '#FFF', fontWeight: '700', fontSize: 15, width: 70 },
    wardStats: { flex: 1 },
    wardStat: { color: '#555', fontSize: 12 },
    emptyText: { color: '#555', fontSize: 13, textAlign: 'center', paddingVertical: 12 },
});

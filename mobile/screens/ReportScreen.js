import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAuthStore from '../store/authStore';
import { apiSubmitReport } from '../services/api';
import SymptomChip from '../components/SymptomChip';

const ALL_SYMPTOMS = ['Fever', 'Cough', 'Cold', 'Diarrhea', 'Vomiting', 'Headache', 'Rash',
    'Breathlessness', 'Fatigue', 'Chest Pain', 'Sore Throat', 'Body Ache', 'Loss of Smell', 'Loss of Taste', 'Other'];

const SEVERITY_LABELS = ['', 'Mild', 'Moderate', 'Noticeable', 'Severe', 'Critical'];
const SEVERITY_COLORS = ['', '#30D158', '#FFD60A', '#FF9F0A', '#FF6B2B', '#FF453A'];

export default function ReportScreen() {
    const insets = useSafeAreaInsets();
    const { user, isDemo } = useAuthStore();
    const [selected, setSelected] = useState([]);
    const [severity, setSeverity] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    // Fix P0: use /\s+/g regex to replace ALL whitespace.
    // Without global flag: 'Loss of Smell' → 'loss_of smell' (space remains, key broken)
    // With global flag:   'Loss of Smell' → 'loss_of_smell' ✓
    const toKey = (sym) => sym.toLowerCase().replace(/\s+/g, '_');

    const toggleSymptom = (sym) => {
        const key = toKey(sym);
        setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    };

    const handleSubmit = async () => {
        if (selected.length === 0) return Alert.alert('Select Symptoms', 'Please select at least one symptom.');
        setSubmitting(true);
        try {
            await apiSubmitReport({ symptoms: selected, severity, wardId: user?.wardId });
            setDone(true);
            setSelected([]);
            setSeverity(1);
        } catch (e) {
            Alert.alert('Error', e.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Fix P2: Demo guard — demo users can't submit real reports (would 401)
    if (isDemo) {
        return (
            <View style={[styles.doneWrap, { paddingTop: insets.top + 20 }]}>
                <Text style={styles.doneEmoji}>🔌</Text>
                <Text style={styles.doneTitle}>Demo Mode</Text>
                <Text style={styles.doneSub}>Connect to a live backend to submit real symptom reports.</Text>
            </View>
        );
    }

    if (done) {
        return (
            <View style={[styles.doneWrap, { paddingTop: insets.top + 20 }]}>
                <Text style={styles.doneEmoji}>✅</Text>
                <Text style={styles.doneTitle}>Report Submitted</Text>
                <Text style={styles.doneSub}>Thank you for keeping Ward {user?.wardId} safe.</Text>
                <TouchableOpacity style={styles.btn} onPress={() => setDone(false)}>
                    <Text style={styles.btnText}>Report Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
            <Text style={styles.title}>Report Symptoms</Text>
            <Text style={styles.sub}>Your anonymous report helps protect Ward {user?.wardId}</Text>

            {/* Symptom selection */}
            <View style={styles.card}>
                <Text style={styles.sectionLabel}>What are you experiencing?</Text>
                <View style={styles.chips}>
                    {ALL_SYMPTOMS.map(s => (
                        <SymptomChip
                            key={s}
                            label={s}
                            selected={selected.includes(toKey(s))}
                            onPress={() => toggleSymptom(s)}
                        />
                    ))}
                </View>
            </View>

            {/* Severity slider */}
            <View style={styles.card}>
                <Text style={styles.sectionLabel}>Severity</Text>
                <View style={styles.severityRow}>
                    <Text style={[styles.severityVal, { color: SEVERITY_COLORS[severity] }]}>
                        {SEVERITY_LABELS[severity]}
                    </Text>
                    <Text style={styles.severityNum}>{severity}/5</Text>
                </View>
                <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={1} maximumValue={5} step={1}
                    value={severity} onValueChange={setSeverity}
                    minimumTrackTintColor={SEVERITY_COLORS[severity]}
                    maximumTrackTintColor="#2A2A3A"
                    thumbTintColor={SEVERITY_COLORS[severity]}
                />
                <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabel}>Mild</Text>
                    <Text style={styles.sliderLabel}>Critical</Text>
                </View>
            </View>

            {/* Selected summary */}
            {selected.length > 0 && (
                <View style={styles.summary}>
                    <Ionicons name="checkmark-circle" size={16} color="#30D158" />
                    <Text style={styles.summaryText}>{selected.length} symptom{selected.length > 1 ? 's' : ''} selected</Text>
                </View>
            )}

            <TouchableOpacity style={[styles.btn, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
                <Text style={styles.btnText}>{submitting ? 'Submitting...' : 'Submit Report'}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0F' },
    content: { padding: 20, paddingBottom: 40 },
    title: { color: '#FFF', fontSize: 28, fontWeight: '800', marginBottom: 6 },
    sub: { color: '#555', fontSize: 14, marginBottom: 24 },
    card: { backgroundColor: '#13131A', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1E1E2E' },
    sectionLabel: { color: '#888', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
    chips: { flexDirection: 'row', flexWrap: 'wrap' },
    severityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    severityVal: { fontSize: 18, fontWeight: '700' },
    severityNum: { color: '#555', fontSize: 14 },
    sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
    sliderLabel: { color: '#444', fontSize: 11 },
    summary: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
    summaryText: { color: '#30D158', fontSize: 13 },
    btn: { backgroundColor: '#00D4FF', borderRadius: 14, padding: 16, alignItems: 'center' },
    btnText: { color: '#000', fontWeight: '700', fontSize: 16 },
    doneWrap: { flex: 1, backgroundColor: '#0A0A0F', justifyContent: 'center', alignItems: 'center', padding: 30 },
    doneEmoji: { fontSize: 80, marginBottom: 16 },
    doneTitle: { color: '#FFF', fontSize: 28, fontWeight: '800', marginBottom: 8 },
    doneSub: { color: '#555', fontSize: 15, textAlign: 'center', marginBottom: 32 },
});

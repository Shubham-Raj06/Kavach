import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, SafeAreaView,
} from 'react-native';

const STEPS = [
    {
        emoji: '📋',
        title: 'Citizens Report Anonymously',
        desc: 'You submit symptoms via the app. No name, no phone. Only ward and symptom type.',
    },
    {
        emoji: '🌧️',
        title: 'We Fuse Multiple Data Signals',
        desc: 'AI combines your report with water quality, weather, and hospital admissions in your ward.',
    },
    {
        emoji: '🧠',
        title: 'ML Model Scores Each Ward',
        desc: 'Our XGBoost model scores 0–100. SHAP analysis explains which signals drove the score.',
    },
    {
        emoji: '📡',
        title: 'Alerts Sent in Real-Time',
        desc: 'When risk crosses a threshold, alerts go to citizens, hospitals, and government officers instantly.',
    },
];

const DATA_SOURCES = [
    { icon: '👥', label: 'Citizen symptom reports' },
    { icon: '🏥', label: 'Hospital admission data' },
    { icon: '🚰', label: 'DJB water quality readings' },
    { icon: '🌦️', label: 'Weather & rainfall data' },
];

export default function TrustScreen() {
    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
                <Text style={styles.heading}>How Kavach Works</Text>
                <Text style={styles.sub}>
                    Kavach is a transparent, zero-PII disease intelligence system.{'\n'}
                    Your health data is <Text style={styles.accent}>never stored or shared.</Text>
                </Text>

                {/* Steps */}
                <View style={styles.section}>
                    {STEPS.map((s, i) => (
                        <View key={i} style={styles.step}>
                            <View style={styles.stepNum}><Text style={styles.stepNumTxt}>{i + 1}</Text></View>
                            <View style={styles.stepBody}>
                                <Text style={styles.stepEmoji}>{s.emoji}</Text>
                                <Text style={styles.stepTitle}>{s.title}</Text>
                                <Text style={styles.stepDesc}>{s.desc}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Data sources */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>📊 Data Sources</Text>
                    {DATA_SOURCES.map((d, i) => (
                        <Text key={i} style={styles.dataRow}>{d.icon}  {d.label}</Text>
                    ))}
                </View>

                {/* Privacy badge */}
                <View style={styles.privacyBadge}>
                    <Text style={styles.privacyText}>
                        🔒 Zero Personal Data Stored{'\n'}
                        Reports are anonymised at ward level before any ML processing.
                    </Text>
                </View>

                {/* Model info */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>🤖 AI Model Info</Text>
                    <Text style={styles.metaRow}>Algorithm:  XGBoost Classifier (v1.0)</Text>
                    <Text style={styles.metaRow}>Anomaly:    IsolationForest</Text>
                    <Text style={styles.metaRow}>Forecast:   Facebook Prophet (48h)</Text>
                    <Text style={styles.metaRow}>Explainer:  SHAP (SHapley Additive eXplanations)</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#0A0A0F' },
    scroll: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },
    heading: { color: '#e2e8f0', fontSize: 26, fontWeight: '800', marginBottom: 8 },
    sub: { color: '#94a3b8', fontSize: 14, lineHeight: 22, marginBottom: 24 },
    accent: { color: '#a78bfa', fontWeight: '700' },
    section: { marginBottom: 20, gap: 16 },
    step: { flexDirection: 'row', backgroundColor: '#13131a', borderRadius: 14, padding: 14, gap: 12 },
    stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#6366f110', alignItems: 'center', justifyContent: 'center' },
    stepNumTxt: { color: '#6366f1', fontWeight: '700', fontSize: 13 },
    stepBody: { flex: 1 },
    stepEmoji: { fontSize: 20, marginBottom: 4 },
    stepTitle: { color: '#e2e8f0', fontSize: 14, fontWeight: '700', marginBottom: 4 },
    stepDesc: { color: '#94a3b8', fontSize: 13, lineHeight: 20 },
    card: { backgroundColor: '#13131a', borderRadius: 14, padding: 16, marginBottom: 12 },
    cardTitle: { color: '#e2e8f0', fontWeight: '700', fontSize: 14, marginBottom: 10 },
    dataRow: { color: '#94a3b8', fontSize: 13, lineHeight: 26 },
    metaRow: { color: '#94a3b8', fontSize: 12, lineHeight: 24, fontFamily: 'monospace' },
    privacyBadge: { backgroundColor: '#0d2310', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#22543d' },
    privacyText: { color: '#68d391', fontSize: 13, lineHeight: 22, textAlign: 'center' },
});

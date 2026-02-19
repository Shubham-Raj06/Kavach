import React, { useEffect, useRef } from 'react';
import {
    View, Text, ScrollView, StyleSheet,
    Animated, RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRiskData, cycleDemoRisk } from '../hooks/useRiskData';
import { useAlerts } from '../hooks/useAlerts';
import { useUserStore } from '../store/userStore';
import { colors, risk, getRiskLevel, spacing, radius } from '../constants/theme';
import GlowCard from '../components/GlowCard';
import RiskBadge from '../components/RiskBadge';
import AlertCard from '../components/AlertCard';

function RiskGauge({ score }: { score: number }) {
    const anim = useRef(new Animated.Value(0)).current;
    const level = getRiskLevel(score);
    const { color, glow } = risk[level];

    useEffect(() => {
        Animated.timing(anim, {
            toValue: score / 100,
            duration: 1200,
            useNativeDriver: false,
        }).start();
    }, [score]);

    const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

    return (
        <View style={styles.gaugeWrap}>
            <View style={styles.gaugeTrack}>
                <Animated.View style={[styles.gaugeFill, { width, backgroundColor: color, shadowColor: glow }]} />
            </View>
            <View style={styles.gaugeLabels}>
                <Text style={styles.gaugeMin}>0</Text>
                <Text style={[styles.gaugeScore, { color }]}>{Math.round(score)}</Text>
                <Text style={styles.gaugeMax}>100</Text>
            </View>
        </View>
    );
}

function CategoryLabel({ cat }: { cat: string }) {
    const labels: Record<string, string> = {
        VECTOR_BORNE: '🦟 Vector-Borne (Dengue/Malaria)',
        WATERBORNE: '💧 Waterborne (Cholera/Gastro)',
        STABLE: '✅ Stable — Low Outbreak Risk',
        RESPIRATORY: '🫁 Respiratory (Flu/Pollution)',
        UNKNOWN: '🔍 Analysing...',
    };
    return <Text style={styles.category}>{labels[cat] ?? cat}</Text>;
}

export default function HomeScreen() {
    const { user } = useUserStore();
    const { data, isLoading, refetch, isFetching } = useRiskData();
    const { data: alerts } = useAlerts();

    const score: number = data?.riskScore ?? 0;
    const level = getRiskLevel(score);
    const { color, glow } = risk[level];

    const latestAlert = alerts?.[0];

    const handleCycle = () => {
        cycleDemoRisk();
        refetch();
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={isFetching} onRefresh={handleCycle} tintColor={colors.accent} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>⚡ Safety Radar</Text>
                        <Text style={styles.ward}>Ward 12 — Seelampur, Delhi</Text>
                    </View>
                    <TouchableOpacity onPress={handleCycle} style={styles.cycleBtn}>
                        <Text style={styles.cycleBtnText}>↻ Cycle Demo</Text>
                    </TouchableOpacity>
                </View>

                {/* Risk Score Card */}
                <GlowCard glowColor={glow} style={styles.riskCard}>
                    {isLoading ? (
                        <View style={styles.loadingState}>
                            <Text style={styles.loadingText}>Analysing ward data...</Text>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.scoreLabel}>WARD RISK SCORE</Text>
                            <Text style={[styles.scoreValue, { color }]}>{Math.round(score)}</Text>
                            <CategoryLabel cat={data?.outbreakCategory ?? 'UNKNOWN'} />
                            <RiskGauge score={score} />
                            {data?.confidence != null && (
                                <Text style={styles.confidence}>
                                    🧠 AI Confidence: {Math.round(data.confidence * 100)}%
                                </Text>
                            )}
                        </>
                    )}
                </GlowCard>

                {/* Demo Hint */}
                <Text style={styles.demoHint}>↕ Pull down or tap "Cycle Demo" to change risk scenario</Text>

                {/* AI Reasons */}
                {data?.outbreakReasons && (
                    <GlowCard style={styles.section}>
                        <Text style={styles.sectionTitle}>🧠 Why This Risk Level?</Text>
                        {(JSON.parse(data.outbreakReasons) as string[]).map((r: string, i: number) => (
                            <View key={i} style={styles.reason}>
                                <Text style={styles.reasonDot}>•</Text>
                                <Text style={styles.reasonText}>{r}</Text>
                            </View>
                        ))}
                    </GlowCard>
                )}

                {/* SHAP Key Signals */}
                {data?.shapReasons && (
                    <GlowCard style={styles.section}>
                        <Text style={styles.sectionTitle}>📊 Key Signals</Text>
                        {(JSON.parse(data.shapReasons) as { feature: string; impact: number }[]).map((s, i) => (
                            <View key={i} style={styles.shapRow}>
                                <Text style={styles.shapFeature}>{s.feature.replace(/_/g, ' ')}</Text>
                                <View style={styles.shapBarTrack}>
                                    <View style={[styles.shapBarFill, {
                                        width: `${Math.round(s.impact * 100)}%`,
                                        backgroundColor: color,
                                    }]} />
                                </View>
                                <Text style={[styles.shapImpact, { color }]}>{Math.round(s.impact * 100)}%</Text>
                            </View>
                        ))}
                    </GlowCard>
                )}

                {/* Safety Tips */}
                {data?.tips && (
                    <GlowCard style={styles.section}>
                        <Text style={styles.sectionTitle}>🛡️ Your Safety Checklist</Text>
                        {(data.tips as string[]).map((tip, i) => (
                            <View key={i} style={styles.tipRow}>
                                <View style={[styles.tipDot, { backgroundColor: color }]} />
                                <Text style={styles.reasonText}>{tip}</Text>
                            </View>
                        ))}
                    </GlowCard>
                )}

                {/* Latest Alert */}
                {latestAlert && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>🔔 Latest Advisory</Text>
                        <AlertCard alert={latestAlert} />
                    </View>
                )}

                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    scroll: { flex: 1 },
    content: { padding: spacing.lg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
    greeting: { fontSize: 20, fontWeight: '700', color: colors.text },
    ward: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    cycleBtn: {
        backgroundColor: colors.surfaceAlt, borderRadius: radius.md,
        paddingHorizontal: 12, paddingVertical: 8,
        borderWidth: 1, borderColor: colors.border,
    },
    cycleBtnText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
    riskCard: { marginBottom: spacing.md },
    scoreLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
    scoreValue: { fontSize: 64, fontWeight: '800', lineHeight: 72, letterSpacing: -2 },
    category: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.md },
    gaugeWrap: { marginTop: 4 },
    gaugeTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' },
    gaugeFill: { height: '100%', borderRadius: 4, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8 },
    gaugeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    gaugeMin: { fontSize: 10, color: colors.textDim },
    gaugeMax: { fontSize: 10, color: colors.textDim },
    gaugeScore: { fontSize: 11, fontWeight: '700' },
    confidence: { fontSize: 11, color: colors.textDim, marginTop: 8 },
    demoHint: { fontSize: 11, color: colors.textDim, textAlign: 'center', marginBottom: spacing.md, marginTop: -4 },
    section: { marginBottom: spacing.md },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
    reason: { flexDirection: 'row', gap: 8, marginBottom: 4 },
    reasonDot: { color: colors.accent, fontSize: 14, lineHeight: 20 },
    reasonText: { flex: 1, fontSize: 13, color: colors.textMuted, lineHeight: 20 },
    tipRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
    tipDot: { width: 8, height: 8, borderRadius: 4 },
    shapRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    shapFeature: { fontSize: 11, color: colors.textMuted, width: 120 },
    shapBarTrack: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
    shapBarFill: { height: '100%', borderRadius: 3 },
    shapImpact: { fontSize: 11, fontWeight: '700', width: 32, textAlign: 'right' },
    loadingState: { alignItems: 'center', paddingVertical: 24 },
    loadingText: { color: colors.textDim, fontSize: 14 },
});

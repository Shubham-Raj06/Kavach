import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl,
    TouchableOpacity, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, Map, ChevronRight, AlertCircle, Droplets, Bug, Thermometer, Activity } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import RiskRadar from '../components/RiskRadar';
import InsightBox from '../components/InsightBox';
import DiseaseWeatherCard from '../components/DiseaseWeatherCard';

const DEMO_SCENARIOS = [
    {
        label: 'LOW RISK',
        score: 18,
        level: 'LOW',
        gradient: ['#E0F2F1', '#F5FFF9'],
        ward: 'Ward 12 — Seelampur',
        tagline: 'Your area is safe today. Stay vigilant.',
        insights: [
            { text: 'Chlorine levels optimal at 0.5ppm', positive: true },
            { text: 'Zero vector-borne complaints in 48hrs', positive: true },
            { text: 'Water supply quality is stable', positive: true },
        ],
        tips: [
            { text: 'Standard hygiene practices are sufficient', icon: Shield },
            { text: 'Keep water containers covered', icon: Droplets },
        ],
        tipColor: '#2ECC71',
        tipBg: '#EAFAF1',
    },
    {
        label: 'MODERATE RISK',
        score: 52,
        level: 'MODERATE',
        gradient: ['#FFF8E1', '#FFFDE7'],
        ward: 'Ward 12 — Seelampur',
        tagline: 'Caution advised. Check the tips below.',
        insights: [
            { text: 'Water complaints up 18% in Block C', positive: false },
            { text: 'Mild fever spike in adjacent Ward 11', positive: false },
            { text: 'No dengue cases confirmed yet', positive: true },
        ],
        tips: [
            { text: 'Boil drinking water before use', icon: Droplets },
            { text: 'Use mosquito repellents outdoors', icon: Bug },
            { text: 'Avoid raw street food today', icon: Thermometer },
        ],
        tipColor: '#F39C12',
        tipBg: '#FEF9E7',
    },
    {
        label: 'HIGH RISK',
        score: 87,
        level: 'HIGH',
        gradient: ['#FFEBEE', '#FFCDD2'],
        ward: 'Ward 12 — Seelampur',
        tagline: 'Health alert active. Follow all precautions.',
        insights: [
            { text: 'Dengue outbreak: 14 confirmed cases', positive: false },
            { text: 'Waterlogging in lanes 3, 4, 7 post-rain', positive: false },
            { text: 'High mosquito breeding index detected', positive: false },
        ],
        tips: [
            { text: 'Use mosquito nets — mandatory tonight', icon: Bug },
            { text: 'Remove stagnant water immediately', icon: Droplets },
            { text: 'Visit doctor if fever lasts 2+ days', icon: Thermometer },
            { text: 'Avoid outdoor exposure at dusk/dawn', icon: Shield },
        ],
        tipColor: '#E74C3C',
        tipBg: '#FDEDEC',
    },
];

const CitizenHome = () => {
    const navigation = useNavigation();
    const [demoIdx, setDemoIdx] = useState(1); // Start at MODERATE
    const [refreshing, setRefreshing] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const data = DEMO_SCENARIOS[demoIdx];

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        );
        if (data.level === 'HIGH') loop.start();
        else loop.stop();
        return () => loop.stop();
    }, [data.level]);

    const cycleDemo = () => setDemoIdx(i => (i + 1) % DEMO_SCENARIOS.length);

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => { cycleDemo(); setRefreshing(false); }, 900);
    };

    const handleMapPress = () => {
        navigation.navigate('Map');
    };

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#009688" />}
        >
            {/* Disease Weather Card - Top Hero Section */}
            <DiseaseWeatherCard
                score={data.score}
                location={{
                    name: data.ward.split('—')[1]?.trim() || 'Delhi',
                    ward: data.ward,
                    riskScore: data.score,
                    condition: data.label,
                    high: Math.round(data.score * 1.2),
                    low: Math.round(data.score * 0.6),
                    aqi: 271,
                    aqiStatus: 'Poor',
                    forecast: [
                        { time: 'Now', temp: data.score, score: data.score, condition: '☀️' },
                        { time: '2PM', temp: data.score + 2, score: data.score + 3, condition: '☀️' },
                        { time: '3PM', temp: data.score + 3, score: data.score + 5, condition: '⛅' },
                        { time: '4PM', temp: data.score + 1, score: data.score - 1, condition: '⛅' },
                        { time: '5PM', temp: data.score - 1, score: data.score - 3, condition: '☀️' },
                        { time: '6PM', temp: data.score - 3, score: data.score - 5, condition: '☀️' },
                    ],
                }}
                onMapPress={handleMapPress}
            />

            {/* AI Insights */}
            <View style={styles.sectionRow}>
                <Activity size={18} color="#666" />
                <Text style={styles.sectionTitle}>AI Safety Analysis</Text>
                <View style={styles.betaBadge}><Text style={styles.betaText}>BETA</Text></View>
            </View>
            <InsightBox riskLevel={data.level} insights={data.insights} />

            {/* Safety Checklist */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>📋 Safety Checklist</Text>
                {data.tips.map((tip, i) => {
                    const Icon = tip.icon;
                    return (
                        <View key={i} style={styles.tipRow}>
                            <View style={[styles.tipIcon, { backgroundColor: data.tipBg }]}>
                                <Icon size={16} color={data.tipColor} />
                            </View>
                            <Text style={styles.tipText}>{tip.text}</Text>
                        </View>
                    );
                })}
            </View>

            {/* Map CTA */}
            <TouchableOpacity style={styles.mapCard} onPress={() => navigation.navigate('Map')}>
                <LinearGradient colors={['#1A1A2E', '#16213E']} style={styles.mapGradient}>
                    <Map size={26} color="#4FC3F7" />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.mapTitle}>Live Hotspot Map</Text>
                        <Text style={styles.mapSub}>Tap to see outbreak zones near you</Text>
                    </View>
                    <ChevronRight size={22} color="#666" />
                </LinearGradient>
            </TouchableOpacity>

            {/* Community Pulse Teaser */}
            <TouchableOpacity style={styles.communityTeaser} onPress={() => navigation.navigate('Community')}>
                <Text style={styles.teaserTitle}>💬 Ward-12 Community Pulse</Text>
                <Text style={styles.teaserSub}>12 reports nearby in last 2 hours →</Text>
            </TouchableOpacity>

            <View style={{ height: 110 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: { paddingTop: 55, paddingBottom: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, display: 'none' },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 4 },
    greeting: { fontSize: 13, fontWeight: '600', color: '#777' },
    wardName: { fontSize: 20, fontWeight: 'bold', color: '#222' },
    cycleBtnWrap: { padding: 8 },
    tagline: { textAlign: 'center', color: '#444', fontSize: 14, marginTop: 8, paddingHorizontal: 24 },
    demoHint: { textAlign: 'center', color: '#AAA', fontSize: 10, marginTop: 6 },
    sectionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 24, marginBottom: 10, gap: 8 },
    sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#e2e8f0', flex: 1 },
    betaBadge: { backgroundColor: '#6C5CE7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    betaText: { fontSize: 9, color: '#FFF', fontWeight: 'bold' },
    card: { backgroundColor: '#1e293b', marginHorizontal: 16, marginTop: 8, padding: 20, borderRadius: 20, elevation: 3, borderWidth: 1, borderColor: '#334155' },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#e2e8f0', marginBottom: 14 },
    tipRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    tipIcon: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
    tipText: { fontSize: 14, color: '#cbd5e1', flex: 1 },
    mapCard: { marginHorizontal: 16, marginTop: 16, borderRadius: 18, overflow: 'hidden' },
    mapGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18, gap: 14 },
    mapTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
    mapSub: { color: '#cbd5e1', fontSize: 12, marginTop: 2 },
    communityTeaser: { marginHorizontal: 16, marginTop: 14, backgroundColor: '#1e293b', padding: 18, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#10b981', elevation: 2, borderWidth: 1, borderColor: '#334155' },
    teaserTitle: { fontWeight: 'bold', color: '#e2e8f0', fontSize: 15 },
    teaserSub: { color: '#10b981', marginTop: 4, fontSize: 13 },
});

export default CitizenHome;

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, risk, getRiskLevel, radius } from '../constants/theme';

type Props = {
    score: number;
    size?: 'sm' | 'md' | 'lg';
};

export default function RiskBadge({ score, size = 'md' }: Props) {
    const level = getRiskLevel(score);
    const { color, label } = risk[level];
    const sz = size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : styles.md;
    const txtSz = size === 'sm' ? styles.textSm : size === 'lg' ? styles.textLg : styles.textMd;

    return (
        <View style={[styles.badge, sz, { backgroundColor: `${color}20`, borderColor: `${color}50` }]}>
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text style={[styles.text, txtSz, { color }]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        borderRadius: radius.full, borderWidth: 1,
    },
    dot: { width: 6, height: 6, borderRadius: 3 },
    text: { fontWeight: '700', letterSpacing: 0.5 },
    sm: { paddingHorizontal: 8, paddingVertical: 3 },
    md: { paddingHorizontal: 10, paddingVertical: 4 },
    lg: { paddingHorizontal: 14, paddingVertical: 6 },
    textSm: { fontSize: 10 },
    textMd: { fontSize: 11 },
    textLg: { fontSize: 13 },
});

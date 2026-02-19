import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const COLORS = { LOW: '#30D158', MEDIUM: '#FFD60A', HIGH: '#FF9F0A', CRITICAL: '#FF453A' };
const BG = { LOW: '#0D2B1A', MEDIUM: '#2B230A', HIGH: '#2B1A0A', CRITICAL: '#2B0A0A' };

export default function RiskBadge({ level, score, size = 'md' }) {
    const small = size === 'sm';
    return (
        <View style={[styles.badge, { backgroundColor: BG[level] || BG.LOW, paddingHorizontal: small ? 8 : 14, paddingVertical: small ? 3 : 6 }]}>
            <Text style={[styles.text, { color: COLORS[level] || COLORS.LOW, fontSize: small ? 10 : 13 }]}>
                {level}{score !== undefined ? ` · ${score}` : ''}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: { borderRadius: 20, alignSelf: 'flex-start' },
    text: { fontWeight: '700', letterSpacing: 0.5 },
});

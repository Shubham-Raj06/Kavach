import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, risk, getRiskLevel, radius, spacing } from '../constants/theme';
import { formatTimeAgo, truncate } from '../utils/formatters';

type Alert = {
    id: string;
    severity: string;
    outbreakCategory: string;
    message: string;
    recommendedAction?: string;
    createdAt: string;
};

type Props = { alert: Alert };

const SEV_COLOR: Record<string, string> = {
    CRITICAL: colors.red,
    HIGH: colors.orange,
    MEDIUM: colors.yellow,
    LOW: colors.green,
};

export default function AlertCard({ alert }: Props) {
    const color = SEV_COLOR[alert.severity] ?? colors.textMuted;
    return (
        <View style={[styles.card, { borderLeftColor: color }]}>
            <View style={styles.header}>
                <View style={[styles.badge, { backgroundColor: `${color}20`, borderColor: `${color}50` }]}>
                    <Text style={[styles.badgeText, { color }]}>{alert.severity}</Text>
                </View>
                <Text style={styles.time}>{formatTimeAgo(alert.createdAt)}</Text>
            </View>
            <Text style={styles.message}>{alert.message}</Text>
            {alert.recommendedAction ? (
                <Text style={styles.action}>→ {truncate(alert.recommendedAction, 100)}</Text>
            ) : null}
            <Text style={styles.category}>{alert.outbreakCategory.replace(/_/g, ' ')}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surfaceAlt,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        borderLeftWidth: 3,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    badge: {
        paddingHorizontal: 8, paddingVertical: 2,
        borderRadius: radius.full, borderWidth: 1,
    },
    badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    time: { fontSize: 11, color: colors.textDim },
    message: { fontSize: 13, color: colors.text, fontWeight: '500', marginBottom: 4 },
    action: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
    category: { fontSize: 10, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 0.5 },
});

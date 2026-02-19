import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SEVERITY_CONFIG = {
    INFO: { color: '#00D4FF', icon: 'information-circle', bg: '#061A2B' },
    WARNING: { color: '#FFD60A', icon: 'warning', bg: '#2B2100' },
    HIGH: { color: '#FF9F0A', icon: 'alert-circle', bg: '#2B1800' },
    CRITICAL: { color: '#FF453A', icon: 'skull', bg: '#2B0800' },
};

export default function AlertCard({ alert }) {
    const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.INFO;
    const time = new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = new Date(alert.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });

    return (
        <View style={[styles.card, { backgroundColor: cfg.bg, borderLeftColor: cfg.color }]}>
            <View style={styles.header}>
                <Ionicons name={cfg.icon} size={18} color={cfg.color} />
                <Text style={[styles.severity, { color: cfg.color }]}>{alert.severity}</Text>
                {alert.ward && <Text style={styles.ward}>Ward {alert.ward}</Text>}
                <Text style={styles.time}>{date} · {time}</Text>
            </View>
            <Text style={styles.message}>{alert.message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 3 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    severity: { fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    ward: { color: '#888', fontSize: 11, marginLeft: 4 },
    time: { color: '#555', fontSize: 11, marginLeft: 'auto' },
    message: { color: '#CCC', fontSize: 14, lineHeight: 20 },
});

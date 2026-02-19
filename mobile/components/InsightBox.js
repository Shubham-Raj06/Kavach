import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react-native';

const InsightBox = ({ riskLevel = 'LOW', insights = [] }) => {
    const isHigh = riskLevel === 'HIGH';

    return (
        <View style={[styles.container, isHigh ? styles.highRisk : styles.lowRisk]}>
            <View style={styles.header}>
                <Info size={20} color={isHigh ? '#C0392B' : '#27AE60'} />
                <Text style={[styles.title, { color: isHigh ? '#C0392B' : '#27AE60' }]}>
                    AI Analysis
                </Text>
            </View>

            <View style={styles.content}>
                {insights.map((insight, index) => (
                    <View key={index} style={styles.item}>
                        {insight.positive ?
                            <CheckCircle size={16} color="#27AE60" /> :
                            <AlertTriangle size={16} color="#E67E22" />
                        }
                        <Text style={styles.itemText}>{insight.text}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        marginHorizontal: 16,
        borderWidth: 1,
    },
    lowRisk: {
        backgroundColor: '#F0FDF4',
        borderColor: '#88E0A8',
    },
    highRisk: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FECACA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    content: {
        gap: 8,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    itemText: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
});

export default InsightBox;

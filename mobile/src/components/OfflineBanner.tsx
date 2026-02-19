import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

export default function OfflineBanner() {
    return (
        <View style={styles.banner}>
            <Text style={styles.text}>⚠️  No internet — showing cached data</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    banner: {
        backgroundColor: 'rgba(239,68,68,0.15)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(239,68,68,0.3)',
        paddingVertical: 6,
        alignItems: 'center',
    },
    text: { color: colors.red, fontSize: 12, fontWeight: '600' },
});

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function SymptomChip({ label, selected, onPress }) {
    return (
        <TouchableOpacity
            style={[styles.chip, selected && styles.selected]}
            onPress={() => onPress(label)}
            activeOpacity={0.7}
        >
            <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#2A2A3A',
        backgroundColor: '#13131A',
        margin: 4,
    },
    selected: { borderColor: '#00D4FF', backgroundColor: '#00D4FF22' },
    label: { color: '#777', fontSize: 13, fontWeight: '500' },
    selectedLabel: { color: '#00D4FF', fontWeight: '600' },
});

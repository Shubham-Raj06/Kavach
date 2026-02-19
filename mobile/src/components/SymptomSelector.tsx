import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

const SYMPTOMS = [
    { id: 'FEVER', label: 'Fever', icon: '🌡️' },
    { id: 'DIARRHEA', label: 'Diarrhea', icon: '💧' },
    { id: 'VOMITING', label: 'Vomiting', icon: '🤢' },
    { id: 'COUGH', label: 'Cough', icon: '😷' },
    { id: 'RESPIRATORY_DISTRESS', label: 'Breathing Issues', icon: '🫁' },
    { id: 'SKIN_RASH', label: 'Skin Rash', icon: '🔴' },
    { id: 'JAUNDICE', label: 'Jaundice', icon: '🟡' },
    { id: 'HEADACHE', label: 'Headache', icon: '🧠' },
];

type Props = {
    selected: string[];
    onToggle: (id: string) => void;
};

export default function SymptomSelector({ selected, onToggle }: Props) {
    return (
        <View style={styles.grid}>
            {SYMPTOMS.map((s) => {
                const active = selected.includes(s.id);
                return (
                    <TouchableOpacity
                        key={s.id}
                        onPress={() => onToggle(s.id)}
                        style={[
                            styles.chip,
                            active && { backgroundColor: `${colors.accent}20`, borderColor: `${colors.accent}60` },
                        ]}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.icon}>{s.icon}</Text>
                        <Text style={[styles.label, active && { color: colors.accent }]}>{s.label}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 12, paddingVertical: 8,
        backgroundColor: colors.surfaceAlt,
        borderRadius: radius.full,
        borderWidth: 1, borderColor: colors.border,
    },
    icon: { fontSize: 16 },
    label: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
});

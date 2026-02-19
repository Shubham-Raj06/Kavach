import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius } from '../constants/theme';

type Props = {
    children: React.ReactNode;
    glowColor?: string;
    style?: ViewStyle;
    padding?: number;
};

export default function GlowCard({ children, glowColor = colors.accentGlow, style, padding = 16 }: Props) {
    return (
        <View style={[
            styles.card,
            {
                padding,
                shadowColor: glowColor,
                borderColor: glowColor.replace('0.3', '0.25'),
            },
            style,
        ]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.border,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 8,
    },
});

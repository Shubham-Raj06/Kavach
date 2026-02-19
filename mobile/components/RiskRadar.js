import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const RiskRadar = ({ riskLevel = 'LOW', score = 10, lastUpdated = 'Just now' }) => {
    const pulse = useSharedValue(1);

    // Config based on risk level
    const getConfig = () => {
        switch (riskLevel) {
            case 'HIGH': return { colors: ['#FF4B4B', '#FF8F8F'], label: 'High Risk' };
            case 'MODERATE': return { colors: ['#FF9F43', '#FFC085'], label: 'Moderate Risk' };
            default: return { colors: ['#2ECC71', '#88E0A8'], label: 'Low Risk' };
        }
    };

    const config = getConfig();

    useEffect(() => {
        pulse.value = withRepeat(
            withTiming(1.2, { duration: 1500, easing: Easing.ease }),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }],
        opacity: 0.3
    }));

    return (
        <View style={styles.container}>
            {/* Pulsing Background */}
            <Animated.View style={[
                styles.pulseCircle,
                { backgroundColor: config.colors[0] },
                animatedStyle
            ]} />

            {/* Main Radar Circle */}
            <LinearGradient
                colors={config.colors}
                style={styles.radarCircle}
            >
                <Text style={styles.scoreText}>{score}</Text>
                <Text style={styles.riskLabel}>{config.label}</Text>
            </LinearGradient>

            <Text style={styles.updateText}>Updated: {lastUpdated}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
        height: 200,
    },
    pulseCircle: {
        position: 'absolute',
        width: 180,
        height: 180,
        borderRadius: 90,
    },
    radarCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    scoreText: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#FFF',
    },
    riskLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
        marginTop: 4,
        textTransform: 'uppercase',
    },
    updateText: {
        marginTop: 12,
        fontSize: 12,
        color: '#666',
    },
});

export default RiskRadar;

import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, KeyboardAvoidingView, Platform,
    ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../services/auth';
import { useUserStore } from '../store/userStore';
import { colors, radius, spacing } from '../constants/theme';

export default function LoginScreen() {
    const navigation = useNavigation<any>();
    const { setUser, setToken } = useUserStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [demoLoading, setDemoLoading] = useState<string | null>(null);

    const DEMO_ROLES = [
        { role: 'CITIZEN', label: '👤 Citizen', color: '#00D4FF' },
        { role: 'HOSPITAL', label: '🏥 Hospital', color: '#00FF88' },
        { role: 'GOV', label: '🏛️ Govt', color: '#FF6B35' },
    ];

    const handleDemoLogin = async (role: string) => {
        setDemoLoading(role);
        try {
            await new Promise(r => setTimeout(r, 500)); // simulate delay
            setToken('demo_token');
            setUser({
                id: `demo_${role.toLowerCase()}`,
                name: `Demo ${role}`,
                email: `${role.toLowerCase()}@demo.in`,
                role: role as any,
                wardId: role === 'GOV' ? null : '12',
                isActive: true
            });
        } finally {
            setDemoLoading(null);
        }
    };

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Missing fields', 'Please enter email and password.');
            return;
        }
        setLoading(true);
        try {
            const { token, user } = await authService.login(email.trim(), password);
            setToken(token);
            setUser(user);
        } catch (err: any) {
            // EMERGENCY BYPASS FOR DEMO/REVIEW
            if (email === 'rajshubham556@gmail.com' && password === '123456') {
                console.log('🔓 Using Emergency Bypass Login');
                setToken('demo_token_bypass');
                setUser({
                    id: 'bypass_user_id',
                    name: 'Shubham Raj',
                    email: 'rajshubham556@gmail.com',
                    role: 'CITIZEN',
                    wardId: '12',
                    isActive: true
                });
                return; // Skip error alert
            }

            const msg = err.response?.data?.error ?? 'Login failed. Check your credentials.';
            Alert.alert('Login Failed', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.logo}>⚡ Kavach</Text>
                    <Text style={styles.tagline}>AI Disease Outbreak Intelligence</Text>
                </View>

                {/* DEMO BYPASS */}
                <View style={styles.demoBox}>
                    <Text style={styles.demoTitle}>⚡ Quick Demo</Text>
                    <Text style={styles.demoHint}>Explore all roles instantly — no signup needed</Text>
                    <View style={styles.demoRow}>
                        {DEMO_ROLES.map(({ role, label, color }) => (
                            <TouchableOpacity
                                key={role}
                                style={[styles.demoBtn, { borderColor: color }]}
                                onPress={() => handleDemoLogin(role)}
                                disabled={!!demoLoading || loading}
                                activeOpacity={0.7}
                            >
                                {demoLoading === role
                                    ? <ActivityIndicator size="small" color={color} />
                                    : <Text style={[styles.demoBtnText, { color }]}>{label}</Text>
                                }
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.logo}>⚡ Kavach</Text>
                    <Text style={styles.tagline}>AI Disease Outbreak Intelligence</Text>
                </View>

                {/* Card */}
                <View style={styles.card}>
                    <Text style={styles.title}>Sign In</Text>

                    <View style={styles.field}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="you@example.com"
                            placeholderTextColor={colors.textDim}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="••••••••"
                            placeholderTextColor={colors.textDim}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.btn, loading && styles.btnDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
    
    // Demo Box
    demoBox: {
        backgroundColor: '#0F0F17',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#1C1C2E',
        marginBottom: 24,
    },
    demoTitle: {
        color: colors.text,
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 3,
    },
    demoHint: {
        color: colors.textDim,
        fontSize: 11,
        marginBottom: 14,
        lineHeight: 16,
    },
    demoRow: {
        flexDirection: 'row',
        gap: 8,
    },
    demoBtn: {
        flex: 1,
        borderWidth: 1.5,
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: '#07070D',
        minHeight: 38,
        justifyContent: 'center',
    },
    demoBtnText: {
        fontWeight: '700',
        fontSize: 11,
    },
    
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.btnText}>Sign In</Text>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('Register')}
                        style={styles.link}
                    >
                        <Text style={styles.linkText}>Don't have an account? <Text style={{ color: colors.accent }}>Register</Text></Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.hint}>
                    Demo: register with any email, set wardId to a ward from the system.
                </Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    inner: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
    header: { alignItems: 'center', marginBottom: spacing.xxl },
    logo: { fontSize: 36, fontWeight: '800', color: colors.text, letterSpacing: -1 },
    tagline: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        borderWidth: 1, borderColor: colors.border,
        padding: spacing.xl,
    },
    title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
    field: { marginBottom: spacing.md },
    label: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: {
        backgroundColor: colors.surfaceAlt,
        borderRadius: radius.md,
        borderWidth: 1, borderColor: colors.border,
        color: colors.text, fontSize: 15,
        paddingHorizontal: 14, paddingVertical: 12,
    },
    btn: {
        backgroundColor: colors.accent,
        borderRadius: radius.md,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: spacing.sm,
        shadowColor: colors.accentGlow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1, shadowRadius: 16,
    },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    link: { marginTop: spacing.md, alignItems: 'center' },
    linkText: { color: colors.textMuted, fontSize: 13 },
    hint: { textAlign: 'center', color: colors.textDim, fontSize: 11, marginTop: spacing.lg },
});

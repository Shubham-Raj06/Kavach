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

export default function RegisterScreen() {
    const navigation = useNavigation<any>();
    const { setUser, setToken } = useUserStore();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [wardId, setWardId] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name.trim() || !email.trim() || !password.trim()) {
            Alert.alert('Missing fields', 'Name, email and password are required.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Weak password', 'Password must be at least 6 characters.');
            return;
        }
        setLoading(true);
        try {
            const { token, user } = await authService.register({
                name: name.trim(),
                email: email.trim(),
                password,
                wardId: wardId.trim() || undefined,
            });
            setToken(token);
            setUser(user);
        } catch (err: any) {
            // api.js throws Error(msg), so err.message is the real error
            // Fallback to err.response if not handled by api.js
            const msg = err.message || err.response?.data?.error || 'Registration failed.';
            Alert.alert('Error', msg);
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
                <View style={styles.header}>
                    <Text style={styles.logo}>⚡ Kavach</Text>
                    <Text style={styles.tagline}>Create your citizen account</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.title}>Register</Text>

                    {[
                        { label: 'Full Name', value: name, set: setName, placeholder: 'Rahul Sharma', type: 'default' },
                        { label: 'Email', value: email, set: setEmail, placeholder: 'you@example.com', type: 'email-address' },
                        { label: 'Password', value: password, set: setPassword, placeholder: '••••••••', type: 'default', secure: true },
                        { label: 'Ward Number (1-272)', value: wardId, set: setWardId, placeholder: 'e.g. 12', type: 'numeric' },
                    ].map((f) => (
                        <View key={f.label} style={styles.field}>
                            <Text style={styles.label}>{f.label}</Text>
                            <TextInput
                                style={styles.input}
                                value={f.value}
                                onChangeText={f.set}
                                placeholder={f.placeholder}
                                placeholderTextColor={colors.textDim}
                                keyboardType={f.type as any}
                                autoCapitalize={f.type === 'email-address' ? 'none' : 'words'}
                                secureTextEntry={f.secure}
                            />
                        </View>
                    ))}

                    <View style={styles.roleNote}>
                        <Text style={styles.roleText}>🔒 Role: CITIZEN (fixed for public registration)</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.btn, loading && styles.btnDisabled]}
                        onPress={handleRegister}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.btnText}>Create Account</Text>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.link}>
                        <Text style={styles.linkText}>Already have an account? <Text style={{ color: colors.accent }}>Sign In</Text></Text>
                    </TouchableOpacity>
                </View>
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
        backgroundColor: colors.surface, borderRadius: radius.xl,
        borderWidth: 1, borderColor: colors.border, padding: spacing.xl,
    },
    title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
    field: { marginBottom: spacing.md },
    label: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: {
        backgroundColor: colors.surfaceAlt, borderRadius: radius.md,
        borderWidth: 1, borderColor: colors.border,
        color: colors.text, fontSize: 15,
        paddingHorizontal: 14, paddingVertical: 12,
    },
    roleNote: {
        backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: radius.md,
        borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)',
        padding: 10, marginBottom: spacing.md,
    },
    roleText: { color: colors.accent, fontSize: 12, fontWeight: '500' },
    btn: {
        backgroundColor: colors.accent, borderRadius: radius.md,
        paddingVertical: 14, alignItems: 'center', marginTop: spacing.sm,
        shadowColor: colors.accentGlow, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1, shadowRadius: 16,
    },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    link: { marginTop: spacing.md, alignItems: 'center' },
    linkText: { color: colors.textMuted, fontSize: 13 },
});

import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAuthStore from '../store/authStore';

const DEMO_ROLES = [
    { role: 'CITIZEN', label: '👤 Citizen', color: '#00D4FF' },
    { role: 'HOSPITAL', label: '🏥 Hospital', color: '#00FF88' },
    { role: 'GOV', label: '🏛️ Govt', color: '#FF6B35' },
];

export default function LoginScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [demoLoading, setDemoLoading] = useState(null);
    const { login, isLoading } = useAuthStore();

    const handleLogin = async () => {
        setError('');
        const em = email.trim().toLowerCase();
        if (!em || !password) { setError('Email and password are required.'); return; }
        if (!/\S+@\S+\.\S+/.test(em)) { setError('Enter a valid email address.'); return; }
        try {
            await login(em, password);
        } catch (e) {
            setError(e.message);
        }
    };

    const handleDemo = async (role) => {
        setError('');
        setDemoLoading(role);
        try {
            await useAuthStore.getState().demoLogin(role);
        } finally {
            setDemoLoading(null);
        }
    };

    return (
        <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
                contentContainerStyle={[s.inner, { paddingTop: insets.top + 20 }]}
                keyboardShouldPersistTaps="handled"
            >
                {/* Logo */}
                <View style={s.hero}>
                    <Text style={s.heroIcon}>🛡️</Text>
                    <Text style={s.heroTitle}>Kavach</Text>
                    <Text style={s.heroSub}>Hyperlocal Disease Monitoring</Text>
                </View>

                {/* Demo bypass */}
                <View style={s.demoBox}>
                    <Text style={s.demoHeading}>⚡ Quick Demo</Text>
                    <Text style={s.demoHint}>Explore all roles instantly — no signup needed</Text>
                    <View style={s.demoRow}>
                        {DEMO_ROLES.map(({ role, label, color }) => (
                            <TouchableOpacity
                                key={role}
                                style={[s.demoBtn, { borderColor: color }]}
                                onPress={() => handleDemo(role)}
                                disabled={!!demoLoading || isLoading}
                                activeOpacity={0.7}
                            >
                                {demoLoading === role
                                    ? <ActivityIndicator size="small" color={color} />
                                    : <Text style={[s.demoBtnTxt, { color }]}>{label}</Text>
                                }
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Login form */}
                <View style={s.card}>
                    <Text style={s.cardTitle}>Sign In</Text>

                    {!!error && (
                        <View style={s.errBox}>
                            <Text style={s.errTxt}>⚠️  {error}</Text>
                        </View>
                    )}

                    <Text style={s.label}>EMAIL</Text>
                    <TextInput
                        style={s.input}
                        placeholder="you@example.com"
                        placeholderTextColor="#3A3A4A"
                        value={email}
                        onChangeText={v => { setEmail(v); setError(''); }}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        textContentType="emailAddress"
                        returnKeyType="next"
                    />

                    <Text style={s.label}>PASSWORD</Text>
                    <TextInput
                        style={s.input}
                        placeholder="••••••••"
                        placeholderTextColor="#3A3A4A"
                        value={password}
                        onChangeText={v => { setPassword(v); setError(''); }}
                        secureTextEntry
                        textContentType="password"
                        returnKeyType="done"
                        onSubmitEditing={handleLogin}
                    />

                    <TouchableOpacity
                        style={[s.btn, isLoading && s.btnDisabled]}
                        onPress={handleLogin}
                        disabled={isLoading}
                        activeOpacity={0.85}
                    >
                        {isLoading
                            ? <ActivityIndicator color="#000" />
                            : <Text style={s.btnTxt}>Sign In →</Text>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity style={s.switchLink} onPress={() => navigation.navigate('Register')}>
                        <Text style={s.switchTxt}>
                            No account?{'  '}<Text style={s.switchAction}>Create one</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#07070D' },
    inner: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingBottom: 32 },
    hero: { alignItems: 'center', marginBottom: 28 },
    heroIcon: { fontSize: 60 },
    heroTitle: { color: '#FFF', fontSize: 34, fontWeight: '800', letterSpacing: 2, marginTop: 8 },
    heroSub: { color: '#444', fontSize: 12, marginTop: 4, letterSpacing: 0.5 },
    demoBox: { backgroundColor: '#0F0F17', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1C1C2E', marginBottom: 12 },
    demoHeading: { color: '#FFF', fontSize: 14, fontWeight: '700', marginBottom: 3 },
    demoHint: { color: '#444', fontSize: 11, marginBottom: 14, lineHeight: 16 },
    demoRow: { flexDirection: 'row', gap: 8 },
    demoBtn: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingVertical: 10, alignItems: 'center', backgroundColor: '#07070D', minHeight: 38, justifyContent: 'center' },
    demoBtnTxt: { fontWeight: '700', fontSize: 11 },
    card: { backgroundColor: '#0F0F17', borderRadius: 20, padding: 22, borderWidth: 1, borderColor: '#1C1C2E' },
    cardTitle: { color: '#FFF', fontSize: 20, fontWeight: '700', marginBottom: 18 },
    errBox: { backgroundColor: '#FF224415', borderWidth: 1, borderColor: '#FF224440', borderRadius: 10, padding: 12, marginBottom: 16 },
    errTxt: { color: '#FF6B6B', fontSize: 13, lineHeight: 18 },
    label: { color: '#555', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
    input: { backgroundColor: '#07070D', borderWidth: 1, borderColor: '#1E1E2E', borderRadius: 12, padding: 14, color: '#FFF', fontSize: 15, marginBottom: 14 },
    btn: { backgroundColor: '#00D4FF', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 4, minHeight: 50, justifyContent: 'center' },
    btnDisabled: { opacity: 0.6 },
    btnTxt: { color: '#000', fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },
    switchLink: { alignItems: 'center', marginTop: 18 },
    switchTxt: { color: '#444', fontSize: 13 },
    switchAction: { color: '#00D4FF', fontWeight: '600' },
});

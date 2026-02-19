import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAuthStore from '../store/authStore';

// New backend roles: CITIZEN / HOSPITAL / GOV (uppercase)
const ROLES = [
    { value: 'CITIZEN', label: '👤 Citizen', desc: 'Report symptoms & view local alerts' },
    { value: 'HOSPITAL', label: '🏥 Hospital', desc: 'Log admissions, monitor ward risk' },
    { value: 'GOV', label: '🏛️ Govt', desc: 'City dashboard & broadcast alerts' },
];

function validate(form) {
    if (!form.name.trim()) return 'Full name is required.';
    if (!/\S+@\S+\.\S+/.test(form.email)) return 'Enter a valid email address.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (!form.wardId && form.role !== 'GOV') return 'Ward ID is required.';
    return null;
}

export default function RegisterScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [form, setForm] = useState({ name: '', email: '', password: '', wardId: '', role: 'CITIZEN' });
    const [error, setError] = useState('');
    const { register, isLoading } = useAuthStore();

    const set = (key, val) => { setForm(f => ({ ...f, [key]: val })); setError(''); };

    const handleRegister = async () => {
        setError('');
        const err = validate(form);
        if (err) { setError(err); return; }

        try {
            await register({
                name: form.name.trim(),
                email: form.email.trim().toLowerCase(),
                password: form.password,
                // Backend expects wardId as string (or omit for GOV)
                wardId: form.role !== 'GOV' ? form.wardId.trim() : undefined,
                role: form.role,
            });
        } catch (e) {
            setError(e.message);
        }
    };

    return (
        <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
                contentContainerStyle={[s.inner, { paddingTop: insets.top + 20 }]}
                keyboardShouldPersistTaps="handled"
            >
                <View style={s.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                        <Text style={s.backTxt}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={s.title}>Create Account</Text>
                    <Text style={s.sub}>Join Kavach and protect your community</Text>
                </View>

                <View style={s.card}>
                    {!!error && (
                        <View style={s.errBox}>
                            <Text style={s.errTxt}>⚠️  {error}</Text>
                        </View>
                    )}

                    {/* Name */}
                    <Text style={s.label}>FULL NAME</Text>
                    <TextInput style={s.input} placeholder="Your full name" placeholderTextColor="#3A3A4A"
                        value={form.name} onChangeText={v => set('name', v)} autoCapitalize="words" returnKeyType="next" />

                    {/* Email */}
                    <Text style={s.label}>EMAIL</Text>
                    <TextInput style={s.input} placeholder="you@example.com" placeholderTextColor="#3A3A4A"
                        value={form.email} onChangeText={v => set('email', v)}
                        keyboardType="email-address" autoCapitalize="none" returnKeyType="next" />

                    {/* Password */}
                    <Text style={s.label}>PASSWORD (MIN 6 CHARS)</Text>
                    <TextInput style={s.input} placeholder="••••••••" placeholderTextColor="#3A3A4A"
                        value={form.password} onChangeText={v => set('password', v)}
                        secureTextEntry returnKeyType="next" />

                    {/* Ward — hidden for GOV */}
                    {form.role !== 'GOV' && (
                        <>
                            <Text style={s.label}>WARD ID</Text>
                            <TextInput style={s.input} placeholder="e.g. ward-42 or 42" placeholderTextColor="#3A3A4A"
                                value={form.wardId} onChangeText={v => set('wardId', v)} returnKeyType="done" />
                        </>
                    )}

                    {/* Role picker */}
                    <Text style={s.label}>SELECT ROLE</Text>
                    {ROLES.map(r => (
                        <TouchableOpacity key={r.value}
                            style={[s.roleCard, form.role === r.value && s.roleCardActive]}
                            onPress={() => set('role', r.value)}
                            activeOpacity={0.75}
                        >
                            <View style={s.roleLeft}>
                                <Text style={s.roleLabel}>{r.label}</Text>
                                <Text style={s.roleDesc}>{r.desc}</Text>
                            </View>
                            <View style={[s.radio, form.role === r.value && s.radioActive]}>
                                {form.role === r.value && <View style={s.radioDot} />}
                            </View>
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity style={[s.btn, isLoading && s.btnDisabled]}
                        onPress={handleRegister} disabled={isLoading} activeOpacity={0.85}>
                        {isLoading ? <ActivityIndicator color="#000" /> : <Text style={s.btnTxt}>Create Account →</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity style={s.switchLink} onPress={() => navigation.navigate('Login')}>
                        <Text style={s.switchTxt}>Already have an account?{'  '}<Text style={s.switchAction}>Sign in</Text></Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#07070D' },
    inner: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 32 },
    header: { marginBottom: 24 },
    backBtn: { marginBottom: 16 },
    backTxt: { color: '#00D4FF', fontSize: 14, fontWeight: '600' },
    title: { color: '#FFF', fontSize: 30, fontWeight: '800' },
    sub: { color: '#444', fontSize: 13, marginTop: 6 },
    card: { backgroundColor: '#0F0F17', borderRadius: 20, padding: 22, borderWidth: 1, borderColor: '#1C1C2E' },
    errBox: { backgroundColor: '#FF224415', borderWidth: 1, borderColor: '#FF224440', borderRadius: 10, padding: 12, marginBottom: 16 },
    errTxt: { color: '#FF6B6B', fontSize: 13, lineHeight: 18 },
    label: { color: '#555', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
    input: { backgroundColor: '#07070D', borderWidth: 1, borderColor: '#1E1E2E', borderRadius: 12, padding: 14, color: '#FFF', fontSize: 14, marginBottom: 14 },
    roleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#07070D', borderWidth: 1, borderColor: '#1E1E2E', borderRadius: 12, padding: 14, marginBottom: 8 },
    roleCardActive: { borderColor: '#00D4FF', backgroundColor: '#00D4FF0A' },
    roleLeft: { flex: 1 },
    roleLabel: { color: '#FFF', fontWeight: '600', fontSize: 14 },
    roleDesc: { color: '#555', fontSize: 11, marginTop: 2 },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
    radioActive: { borderColor: '#00D4FF' },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#00D4FF' },
    btn: { backgroundColor: '#00D4FF', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 16, minHeight: 50, justifyContent: 'center' },
    btnDisabled: { opacity: 0.6 },
    btnTxt: { color: '#000', fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },
    switchLink: { alignItems: 'center', marginTop: 20 },
    switchTxt: { color: '#444', fontSize: 13 },
    switchAction: { color: '#00D4FF', fontWeight: '600' },
});

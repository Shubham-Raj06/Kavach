import React, { useState, useRef } from 'react';
import {
    View, Text, ScrollView, StyleSheet,
    TouchableOpacity, ActivityIndicator, Alert,
    TextInput, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { reportApi } from '../services/api';
import { useUserStore } from '../store/userStore';
import { colors, radius, spacing } from '../constants/theme';
import GlowCard from '../components/GlowCard';
import SymptomSelector from '../components/SymptomSelector';

const SEVERITY_LABELS = ['', 'Mild', 'Moderate', 'Significant', 'Severe', 'Critical'];

// Save failed reports locally for retry
async function queueLocally(data: object) {
    try {
        const raw = await SecureStore.getItemAsync('kavach_report_queue');
        const queue = raw ? JSON.parse(raw) : [];
        queue.push({ ...data, queuedAt: Date.now() });
        await SecureStore.setItemAsync('kavach_report_queue', JSON.stringify(queue.slice(-20)));
    } catch { }
}

export default function ReportScreen() {
    const { user, setUser } = useUserStore();
    const [symptoms, setSymptoms] = useState<string[]>([]);
    const [severity, setSeverity] = useState(1);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [locating, setLocating] = useState(false);
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [wardInput, setWardInput] = useState(user?.wardId ?? '');
    const [savingWard, setSavingWard] = useState(false);
    const lastSubmit = useRef<number>(0);

    const effectiveWardId = user?.wardId ?? wardInput.trim();
    const wardMissing = !user?.wardId;

    const handleSaveWard = async () => {
        if (!wardInput.trim()) {
            Alert.alert('Required', 'Please enter your ward number.');
            return;
        }
        setSavingWard(true);
        try {
            const updated = { ...user!, wardId: wardInput.trim() };
            await SecureStore.setItemAsync('kavach_user', JSON.stringify(updated));
            setUser(updated);
        } catch {
            Alert.alert('Error', 'Could not save ward. Please try again.');
        } finally {
            setSavingWard(false);
        }
    };

    const toggleSymptom = (id: string) => {
        setSymptoms(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const handleTakePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera access is needed to capture photo evidence.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });
        if (!result.canceled && result.assets?.[0]?.uri) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const getLocation = async () => {
        setLocating(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Location access is needed to submit a report.');
                return;
            }
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        } catch {
            Alert.alert('Error', 'Could not get your location. Please try again.');
        } finally {
            setLocating(false);
        }
    };

    const handleSubmit = async () => {
        if (!symptoms.length) {
            Alert.alert('No symptoms selected', 'Please select at least one symptom.');
            return;
        }

        const wardId = effectiveWardId;
        if (!wardId) {
            Alert.alert('Ward Number Required', 'Please set your ward number above before submitting.');
            return;
        }

        const now = Date.now();
        if (now - lastSubmit.current < 10000) {
            Alert.alert('Please wait', 'You just submitted a report. Wait a few seconds before submitting again.');
            return;
        }

        // Auto-fetch location if not available
        let coords = location;
        if (!coords) {
            setLocating(true);
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                    coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
                    setLocation(coords);
                }
            } catch { }
            setLocating(false);
        }

        // Fallback coords for demo (Delhi)
        if (!coords) {
            coords = { latitude: 28.6692, longitude: 77.2958 };
        }

        setLoading(true);
        lastSubmit.current = Date.now();

        let successCount = 0;
        let failedOnline = false;

        for (const syndromeType of symptoms) {
            const payload = {
                wardId,
                latitude: coords.latitude,
                longitude: coords.longitude,
                syndromeType,
                severity,
                description: description.trim() || undefined,
            };
            try {
                await reportApi.submit(payload);
                successCount++;
            } catch (err: any) {
                failedOnline = true;
                // Queue locally for later retry
                await queueLocally(payload);

                const status = err.response?.status;
                const details = err.response?.data?.details;
                if (status === 400 && details) {
                    const fieldErrors = Object.entries(details)
                        .map(([k, v]) => `• ${k}: ${(v as string[]).join(', ')}`)
                        .join('\n');
                    Alert.alert('Validation Error', `Please fix the following:\n${fieldErrors}`);
                    setLoading(false);
                    return;
                }
                if (status === 401) {
                    Alert.alert('Session Expired', 'Please log out and log in again.');
                    setLoading(false);
                    return;
                }
            }
        }

        setLoading(false);

        if (successCount > 0) {
            Alert.alert(
                '✅ Report Submitted',
                `${successCount} symptom${successCount > 1 ? 's' : ''} reported successfully. Thank you for keeping Ward ${wardId} safe!`
            );
        } else if (failedOnline) {
            // All failed but saved locally
            Alert.alert(
                '📥 Saved Offline',
                'Could not reach the server right now. Your report has been saved locally and will sync automatically when the connection is restored.'
            );
        }

        // Reset form
        setSymptoms([]);
        setSeverity(1);
        setDescription('');
        setPhotoUri(null);
        setLocation(null);
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.title}>Report Symptoms</Text>
                <Text style={styles.subtitle}>Help protect your community by reporting health signals anonymously</Text>

                {/* Ward Setup (if not set) */}
                {wardMissing && (
                    <GlowCard glowColor={colors.red + '40'} style={{ ...styles.section, borderColor: colors.red + '44' }}>
                        <Text style={styles.sectionTitle}>
                            📍 Ward Number <Text style={styles.required}>Required</Text>
                        </Text>
                        <Text style={styles.wardHint}>Enter your ward number so we can tag this report to the right area.</Text>
                        <View style={styles.wardRow}>
                            <TextInput
                                style={styles.wardInput}
                                value={wardInput}
                                onChangeText={setWardInput}
                                placeholder="e.g. 12"
                                placeholderTextColor={colors.textDim}
                                keyboardType="number-pad"
                                maxLength={6}
                            />
                            <TouchableOpacity style={styles.wardSaveBtn} onPress={handleSaveWard} disabled={savingWard}>
                                {savingWard
                                    ? <ActivityIndicator color="#fff" size="small" />
                                    : <Text style={styles.wardSaveText}>Save</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </GlowCard>
                )}

                {/* Ward badge (if set) */}
                {!wardMissing && (
                    <View style={styles.wardBadge}>
                        <Text style={styles.wardBadgeText}>📍 Ward {user?.wardId}</Text>
                    </View>
                )}

                {/* Symptom selector */}
                <GlowCard style={styles.section}>
                    <Text style={styles.sectionTitle}>What are you experiencing?</Text>
                    <SymptomSelector selected={symptoms} onToggle={toggleSymptom} />
                </GlowCard>

                {/* Severity */}
                <GlowCard style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Severity: <Text style={{ color: colors.accent }}>{SEVERITY_LABELS[severity]}</Text>
                    </Text>
                    <View style={styles.severityRow}>
                        {[1, 2, 3, 4, 5].map(n => (
                            <TouchableOpacity
                                key={n}
                                onPress={() => setSeverity(n)}
                                style={[
                                    styles.severityBtn,
                                    severity === n && { backgroundColor: colors.accent, borderColor: colors.accent },
                                ]}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.severityNum, severity === n && { color: '#fff' }]}>{n}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </GlowCard>

                {/* Photo Evidence */}
                <GlowCard style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        📸 Photo Evidence <Text style={styles.optional}>(optional)</Text>
                    </Text>
                    {photoUri ? (
                        <View style={styles.previewWrap}>
                            <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
                            <TouchableOpacity style={styles.removePhoto} onPress={() => setPhotoUri(null)}>
                                <Text style={styles.removePhotoText}>✕ Remove</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.photoBtnFull} onPress={handleTakePhoto} activeOpacity={0.8}>
                            <Text style={styles.photoBtnIcon}>📷</Text>
                            <Text style={styles.photoBtnText}>Click Photo</Text>
                        </TouchableOpacity>
                    )}
                    <Text style={styles.photoHint}>Photo stored locally — not uploaded to server</Text>
                </GlowCard>

                {/* Description */}
                <GlowCard style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Additional notes <Text style={styles.optional}>(optional)</Text>
                    </Text>
                    <TextInput
                        style={styles.textArea}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Any other details..."
                        placeholderTextColor={colors.textDim}
                        multiline
                        numberOfLines={3}
                        maxLength={300}
                    />
                </GlowCard>

                {/* Location */}
                <GlowCard style={styles.section}>
                    <Text style={styles.sectionTitle}>Location</Text>
                    {location ? (
                        <Text style={styles.locText}>
                            📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)} — detected
                        </Text>
                    ) : (
                        <Text style={styles.locHint}>Location not detected (will auto-detect or use Delhi default)</Text>
                    )}
                    <TouchableOpacity
                        style={styles.locBtn}
                        onPress={getLocation}
                        disabled={locating}
                        activeOpacity={0.8}
                    >
                        {locating
                            ? <ActivityIndicator color={colors.accent} size="small" />
                            : <Text style={styles.locBtnText}>📡 Detect My Location</Text>
                        }
                    </TouchableOpacity>
                </GlowCard>

                {/* Submit */}
                <TouchableOpacity
                    style={[styles.submitBtn, (loading || !symptoms.length) && styles.submitDisabled]}
                    onPress={handleSubmit}
                    disabled={loading || !symptoms.length}
                    activeOpacity={0.8}
                >
                    {loading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.submitText}>Submit Report</Text>
                    }
                </TouchableOpacity>

                <Text style={styles.privacy}>🔒 Only ward-level data is stored. No personal information is shared.</Text>
                <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    scroll: { flex: 1 },
    content: { padding: spacing.lg },
    title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 4 },
    subtitle: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.lg },
    required: { color: colors.red, fontWeight: '700' },
    optional: { color: colors.textDim, fontWeight: '400', fontSize: 12 },
    section: { marginBottom: spacing.md },
    sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },

    // Ward setup
    wardHint: { fontSize: 12, color: colors.textDim, marginBottom: 10 },
    wardRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    wardInput: {
        flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.md,
        borderWidth: 1, borderColor: colors.red + '66',
        color: colors.text, fontSize: 16,
        paddingHorizontal: 14, paddingVertical: 11,
    },
    wardSaveBtn: {
        backgroundColor: colors.accent, borderRadius: radius.md,
        paddingHorizontal: 20, paddingVertical: 12,
    },
    wardSaveText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    // Ward badge
    wardBadge: {
        alignSelf: 'flex-start', marginBottom: 14,
        backgroundColor: colors.accentGlow, paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: radius.full, borderWidth: 1, borderColor: colors.accent + '44',
    },
    wardBadgeText: { color: colors.accent, fontSize: 12, fontWeight: '600' },

    // Severity
    severityRow: { flexDirection: 'row', gap: spacing.sm },
    severityBtn: {
        flex: 1, paddingVertical: 10, alignItems: 'center',
        backgroundColor: colors.surfaceAlt, borderRadius: radius.md,
        borderWidth: 1, borderColor: colors.border,
    },
    severityNum: { fontSize: 16, fontWeight: '700', color: colors.textMuted },

    // Photo
    photoBtnFull: {
        alignItems: 'center', paddingVertical: 22,
        borderRadius: radius.md, borderWidth: 1, borderColor: colors.accent,
        backgroundColor: colors.accentGlow, borderStyle: 'dashed',
    },
    photoBtnIcon: { fontSize: 28, marginBottom: 6 },
    photoBtnText: { fontSize: 14, fontWeight: '700', color: colors.accent },
    previewWrap: { position: 'relative' },
    preview: { width: '100%', height: 180, borderRadius: radius.md },
    removePhoto: {
        position: 'absolute', top: 8, right: 8,
        backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: radius.full,
        paddingHorizontal: 10, paddingVertical: 5,
    },
    removePhotoText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    photoHint: { fontSize: 11, color: colors.textDim, marginTop: 8 },

    // Description
    textArea: {
        backgroundColor: colors.surfaceAlt, borderRadius: radius.md,
        borderWidth: 1, borderColor: colors.border,
        color: colors.text, fontSize: 14,
        paddingHorizontal: 14, paddingVertical: 10,
        minHeight: 80, textAlignVertical: 'top',
    },

    // Location
    locText: { fontSize: 13, color: colors.green, marginBottom: spacing.sm },
    locHint: { fontSize: 12, color: colors.textDim, marginBottom: spacing.sm },
    locBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.surfaceAlt, borderRadius: radius.md,
        borderWidth: 1, borderColor: colors.border, paddingVertical: 10,
    },
    locBtnText: { color: colors.accent, fontSize: 13, fontWeight: '600' },

    // Submit
    submitBtn: {
        backgroundColor: colors.accent, borderRadius: radius.md,
        paddingVertical: 16, alignItems: 'center',
        shadowColor: colors.accentGlow, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1, shadowRadius: 20, marginBottom: spacing.md,
    },
    submitDisabled: { opacity: 0.5 },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    privacy: { textAlign: 'center', color: colors.textDim, fontSize: 11 },
});

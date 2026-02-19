import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Camera, MapPin, CheckCircle, AlertTriangle, Droplet, Bug, Thermometer, Upload, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import useAuthStore from '../store/authStore';

const STEPS = ['Type', 'Details', 'Evidence', 'Location'];

const ReportScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuthStore();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);

    // Form Data
    const [type, setType] = useState(null); // 'HEALTH' | 'WATER' | 'VECTOR' | 'OTHER'
    const [severity, setSeverity] = useState(3);
    const [symptoms, setSymptoms] = useState([]);
    const [description, setDescription] = useState('');
    const [photo, setPhoto] = useState(null);
    const [location, setLocation] = useState(null); // Mock for now

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Camera access is required to capture proof.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.5,
            aspect: [4, 3],
        });

        if (!result.canceled) {
            setPhoto(result.assets[0].uri);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.5,
        });

        if (!result.canceled) {
            setPhoto(result.assets[0].uri);
        }
    };

    const submitReport = () => {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            Alert.alert(
                "Report Received",
                "Your contribution helps predict outbreaks in Seelampur Ward-12.",
                [{ text: "Done", onPress: () => navigation.navigate('Home') }]
            );
        }, 1500);
    };

    const nextStep = () => {
        if (currentStep < STEPS.length - 1) setCurrentStep(c => c + 1);
        else submitReport();
    };

    const prevStep = () => {
        if (currentStep > 0) setCurrentStep(c => c - 1);
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Type
                return (
                    <View style={styles.grid}>
                        <TouchableOpacity style={[styles.typeCard, type === 'HEALTH' && styles.selectedCard]} onPress={() => setType('HEALTH')}>
                            <Thermometer size={32} color={type === 'HEALTH' ? '#FFF' : '#E74C3C'} />
                            <Text style={[styles.typeText, type === 'HEALTH' && styles.selectedText]}>Health Issue</Text>
                            <Text style={styles.subText}>Fever, Diarrhea, etc.</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.typeCard, type === 'WATER' && styles.selectedCard]} onPress={() => setType('WATER')}>
                            <Droplet size={32} color={type === 'WATER' ? '#FFF' : '#3498DB'} />
                            <Text style={[styles.typeText, type === 'WATER' && styles.selectedText]}>Water Issue</Text>
                            <Text style={styles.subText}>Dirty, Smelly, No Supply</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.typeCard, type === 'VECTOR' && styles.selectedCard]} onPress={() => setType('VECTOR')}>
                            <Bug size={32} color={type === 'VECTOR' ? '#FFF' : '#F39C12'} />
                            <Text style={[styles.typeText, type === 'VECTOR' && styles.selectedText]}>Mosquitoes</Text>
                            <Text style={styles.subText}>Breeding, Swarms</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.typeCard, type === 'OTHER' && styles.selectedCard]} onPress={() => setType('OTHER')}>
                            <AlertTriangle size={32} color={type === 'OTHER' ? '#FFF' : '#95A5A6'} />
                            <Text style={[styles.typeText, type === 'OTHER' && styles.selectedText]}>Other</Text>
                            <Text style={styles.subText}>Garbage, Sewage</Text>
                        </TouchableOpacity>
                    </View>
                );
            case 1: // Details
                return (
                    <View>
                        <Text style={styles.label}>Severity Level (1-5)</Text>
                        <View style={styles.severityRow}>
                            {[1, 2, 3, 4, 5].map(lvl => (
                                <TouchableOpacity
                                    key={lvl}
                                    style={[styles.severityBtn, severity === lvl && styles.selectedSeverity]}
                                    onPress={() => setSeverity(lvl)}
                                >
                                    <Text style={[styles.severityText, severity === lvl && { color: '#FFF' }]}>{lvl}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={styles.helperText}>
                            {severity === 5 ? 'Critical / Emergency' : severity === 1 ? 'Mild / Noticeable' : 'Moderate Concern'}
                        </Text>

                        <Text style={[styles.label, { marginTop: 24 }]}>Description</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Describe the issue... (e.g., Water is yellow since morning)"
                            multiline
                            numberOfLines={4}
                            value={description}
                            onChangeText={setDescription}
                        />
                    </View>
                );
            case 2: // Evidence
                return (
                    <View style={{ alignItems: 'center' }}>
                        {photo ? (
                            <View style={styles.imagePreview}>
                                <Image source={{ uri: photo }} style={{ width: '100%', height: '100%' }} />
                                <TouchableOpacity style={styles.removePhoto} onPress={() => setPhoto(null)}>
                                    <X size={20} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <Camera size={48} color="#CCC" />
                                <Text style={{ color: '#999', marginTop: 10 }}>No photo added yet</Text>
                            </View>
                        )}

                        <View style={styles.photoActions}>
                            <TouchableOpacity style={styles.actionBtn} onPress={takePhoto}>
                                <Camera size={20} color="#FFF" />
                                <Text style={styles.actionText}>Take Photo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#34495E' }]} onPress={pickImage}>
                                <Upload size={20} color="#FFF" />
                                <Text style={styles.actionText}>Gallery</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.privacyNote}>Photos help confirm the issue location and severity.</Text>
                    </View>
                );
            case 3: // Location
                return (
                    <View style={{ alignItems: 'center', padding: 20 }}>
                        <View style={styles.mapPlaceholder}>
                            <MapPin size={40} color="#E74C3C" />
                            <Text style={styles.locText}>Ward 12, Seelampur</Text>
                            <Text style={styles.coords}>Lat: 28.6692, Long: 77.2714</Text>
                        </View>
                        <Text style={styles.confirmText}>Confirm your location is accurate?</Text>
                    </View>
                );
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#009688', '#00796B']} style={styles.header}>
                <Text style={styles.headerTitle}>New Report</Text>
                <Text style={styles.stepIndicator}>Step {currentStep + 1} of 4</Text>
            </LinearGradient>

            <View style={styles.progressContainer}>
                {STEPS.map((s, i) => (
                    <View key={i} style={[styles.progressBar, i <= currentStep ? { backgroundColor: '#009688' } : { backgroundColor: '#EEE' }]} />
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.stepTitle}>{STEPS[currentStep]}</Text>
                {renderStepContent()}
            </ScrollView>

            <View style={styles.footer}>
                {currentStep > 0 && (
                    <TouchableOpacity style={styles.backBtn} onPress={prevStep}>
                        <Text style={styles.backText}>Back</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[styles.nextBtn, !type && currentStep === 0 && { opacity: 0.5 }]}
                    onPress={nextStep}
                    disabled={!type && currentStep === 0}
                >
                    {loading ? <ActivityIndicator color="#FFF" /> : (
                        <Text style={styles.nextText}>{currentStep === 3 ? 'Submit Report' : 'Next'}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { padding: 24, paddingTop: 60, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
    stepIndicator: { color: '#E0F2F1', marginTop: 4 },

    progressContainer: { flexDirection: 'row', paddingHorizontal: 24, marginTop: -10, gap: 8 },
    progressBar: { flex: 1, height: 4, borderRadius: 2 },

    content: { padding: 24 },
    stepTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 20 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' },
    typeCard: { width: '47%', backgroundColor: '#FFF', padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 2, borderColor: 'transparent', shadowColor: '#000', shadowOpacity: 0.1, elevation: 4 },
    selectedCard: { borderColor: '#009688', backgroundColor: '#E0F2F1' },
    typeText: { marginTop: 12, fontWeight: 'bold', color: '#333' },
    selectedText: { color: '#009688' },
    subText: { fontSize: 10, color: '#888', textAlign: 'center', marginTop: 4 },

    label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
    severityRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    severityBtn: { flex: 1, height: 50, borderRadius: 12, backgroundColor: '#EEE', justifyContent: 'center', alignItems: 'center' },
    selectedSeverity: { backgroundColor: '#E74C3C' },
    severityText: { fontSize: 18, fontWeight: 'bold', color: '#666' },
    helperText: { textAlign: 'center', marginTop: 12, color: '#888', fontStyle: 'italic' },
    input: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, textAlignVertical: 'top', borderWidth: 1, borderColor: '#DDD', fontSize: 16 },

    photoPlaceholder: { width: '100%', height: 200, backgroundColor: '#EEE', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#CCC' },
    imagePreview: { width: '100%', height: 200, borderRadius: 16, overflow: 'hidden' },
    removePhoto: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 20 },
    photoActions: { flexDirection: 'row', gap: 16, marginTop: 24 },
    actionBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#009688', padding: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 8 },
    actionText: { color: '#FFF', fontWeight: 'bold' },
    privacyNote: { marginTop: 20, color: '#888', fontSize: 12, textAlign: 'center' },

    mapPlaceholder: { width: '100%', height: 200, backgroundColor: '#E0F2F1', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    locText: { fontSize: 18, fontWeight: 'bold', color: '#009688', marginTop: 12 },
    coords: { color: '#666', marginTop: 4 },
    confirmText: { fontSize: 16, color: '#444' },

    footer: { padding: 24, flexDirection: 'row', gap: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EEE' },
    backBtn: { flex: 1, padding: 16, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: '#F5F5F5' },
    backText: { color: '#666', fontWeight: 'bold' },
    nextBtn: { flex: 2, padding: 16, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: '#009688' },
    nextText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});

export default ReportScreen;

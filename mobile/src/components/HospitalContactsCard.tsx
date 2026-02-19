import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator,
} from 'react-native';
import { useUserStore } from '../store/userStore';
import { apiClient } from '../services/api';

type Hospital = {
    wardId: string;
    hospitalName: string;
    distanceKm: number;
    phone?: string;
    icuBeds?: number;
    capacity?: number;
};

const DEMO_HOSPITALS: Hospital[] = [
    { wardId: '12', hospitalName: 'Safdarjung Hospital', distanceKm: 1.2, phone: '011-26730000', icuBeds: 80, capacity: 1531 },
    { wardId: '12', hospitalName: 'AIIMS Trauma Centre', distanceKm: 2.8, phone: '011-26593308', icuBeds: 40, capacity: 200 },
    { wardId: '12', hospitalName: 'Fortis Vasant Kunj', distanceKm: 3.5, phone: '011-42776222', icuBeds: 25, capacity: 200 },
];

export default function HospitalContactsCard() {
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [loading, setLoading] = useState(false);
    const { user } = useUserStore();
    const wardId = user?.wardId ?? '12';

    useEffect(() => {
        fetchHospitals();
    }, [wardId]);

    async function fetchHospitals() {
        setLoading(true);
        try {
            const res = await apiClient.get(`/wards/${wardId}/hospitals`);
            setHospitals(res.data.length ? res.data : DEMO_HOSPITALS);
        } catch {
            setHospitals(DEMO_HOSPITALS);
        } finally {
            setLoading(false);
        }
    }

    const callHospital = (phone: string) => {
        Linking.openURL(`tel:${phone}`).catch(() => { });
    };

    return (
        <View style={styles.card}>
            <Text style={styles.title}>🏥 Nearest Hospitals</Text>
            {loading
                ? <ActivityIndicator color="#6366f1" />
                : hospitals.map((h, i) => (
                    <View key={i} style={styles.row}>
                        <View style={styles.info}>
                            <Text style={styles.name}>{h.hospitalName}</Text>
                            <Text style={styles.meta}>
                                {h.distanceKm} km · {h.capacity ?? '—'} beds · {h.icuBeds ?? '—'} ICU
                            </Text>
                        </View>
                        {h.phone ? (
                            <TouchableOpacity
                                style={styles.callBtn}
                                onPress={() => callHospital(h.phone!)}
                                accessibilityLabel={`Call ${h.hospitalName}`}
                            >
                                <Text style={styles.callText}>📞 Call</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                ))
            }
        </View>
    );
}

const styles = StyleSheet.create({
    card: { backgroundColor: '#13131a', borderRadius: 16, padding: 16, marginVertical: 8 },
    title: { color: '#e2e8f0', fontSize: 15, fontWeight: '700', marginBottom: 12 },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    info: { flex: 1 },
    name: { color: '#f0f0f0', fontSize: 13, fontWeight: '600' },
    meta: { color: '#888', fontSize: 12, marginTop: 2 },
    callBtn: { backgroundColor: '#1e1033', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
    callText: { color: '#a78bfa', fontSize: 12, fontWeight: '600' },
});

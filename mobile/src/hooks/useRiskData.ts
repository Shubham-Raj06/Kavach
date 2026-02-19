// DEMO MODE: Returns rich dummy data for showcase. Wire to riskApi.myWard() for production.
import { useQuery } from '@tanstack/react-query';
import { getRiskLevel } from '../constants/theme';

const DEMO_SCENARIOS = [
    {
        riskScore: 87,
        outbreakCategory: 'VECTOR_BORNE',
        confidence: 0.94,
        outbreakReasons: JSON.stringify([
            'Dengue cases up 3x in Ward-12 this week',
            'Waterlogging in 5 lanes post heavy rainfall',
            'Mosquito breeding index at 74%, highest in 6 months',
        ]),
        shapReasons: JSON.stringify([
            { feature: 'water_stagnation', impact: 0.42 },
            { feature: 'fever_reports', impact: 0.35 },
            { feature: 'rainfall_mm', impact: 0.28 },
            { feature: 'humidity_pct', impact: 0.19 },
        ]),
        tips: [
            'Use mosquito nets — mandatory tonight',
            'Drain all stagnant water immediately',
            'Seek medical help if fever lasts over 2 days',
        ],
        _demo: true,
    },
    {
        riskScore: 52,
        outbreakCategory: 'WATERBORNE',
        confidence: 0.81,
        outbreakReasons: JSON.stringify([
            'Water complaints up 18% in Block C vs last week',
            'Mild fever spike detected in adjacent Ward-11',
            'Chlorine levels slightly irregular at 0.3ppm',
        ]),
        shapReasons: JSON.stringify([
            { feature: 'water_quality_complaints', impact: 0.38 },
            { feature: 'chlorine_levels', impact: 0.29 },
            { feature: 'diarrhea_reports', impact: 0.21 },
            { feature: 'hospital_visits', impact: 0.15 },
        ]),
        tips: [
            'Boil drinking water before consumption',
            'Avoid raw street food today',
            'Report dirty water to DJB at 1916',
        ],
        _demo: true,
    },
    {
        riskScore: 18,
        outbreakCategory: 'STABLE',
        confidence: 0.96,
        outbreakReasons: JSON.stringify([
            'Chlorine levels optimal at 0.5ppm — drinking water safe',
            'Zero vector-borne complaints in the last 48 hours',
            'Hospital OPD footfall 23% below monthly average',
        ]),
        shapReasons: JSON.stringify([
            { feature: 'hospital_footfall', impact: 0.18 },
            { feature: 'symptom_reports', impact: 0.12 },
            { feature: 'water_quality', impact: 0.09 },
            { feature: 'rainfall_mm', impact: 0.05 },
        ]),
        tips: [
            'Standard hygiene practices are sufficient',
            'Keep water containers covered',
            'Stay hydrated in warm weather',
        ],
        _demo: true,
    },
];

let demoIndex = 1; // Start at MEDIUM risk for best first impression

export function useRiskData() {
    return useQuery({
        queryKey: ['risk', 'demo', demoIndex],
        queryFn: async () => {
            // Simulate network delay for realism
            await new Promise(r => setTimeout(r, 400));
            return DEMO_SCENARIOS[demoIndex];
        },
        staleTime: Infinity,
        retry: false,
    });
}

export function cycleDemoRisk() {
    demoIndex = (demoIndex + 1) % DEMO_SCENARIOS.length;
}

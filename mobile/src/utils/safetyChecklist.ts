/**
 * safetyChecklist.ts
 * Returns a safety checklist based on outbreak category.
 * Used on HomeScreen to show "What to do today".
 */

export type ChecklistItem = {
    icon: string;
    text: string;
};

const CHECKLISTS: Record<string, ChecklistItem[]> = {
    WATERBORNE: [
        { icon: '🫙', text: 'Boil drinking water for 5+ minutes' },
        { icon: '🧴', text: 'Use ORS sachets for any diarrhea' },
        { icon: '🙅', text: 'Avoid street food and open water' },
        { icon: '🧼', text: 'Wash hands with soap before eating' },
        { icon: '🚰', text: 'Store water in clean covered container' },
    ],
    VECTOR_BORNE: [
        { icon: '🪣', text: 'Empty all stagnant water containers' },
        { icon: '🦟', text: 'Apply mosquito repellent every 4 hours' },
        { icon: '🛏️', text: 'Sleep under mosquito net tonight' },
        { icon: '👕', text: 'Wear full sleeves during dawn/dusk' },
        { icon: '🌿', text: 'Clear overgrown areas near your home' },
    ],
    AIRBORNE: [
        { icon: '😷', text: 'Wear an N95 mask in public spaces' },
        { icon: '🪟', text: 'Increase home ventilation and airflow' },
        { icon: '👥', text: 'Avoid crowded enclosed spaces' },
        { icon: '🤧', text: 'Cover cough with elbow, not hand' },
        { icon: '🧴', text: 'Use alcohol hand sanitiser frequently' },
    ],
    FOODBORNE: [
        { icon: '🧼', text: 'Wash hands before every meal' },
        { icon: '🥗', text: 'Avoid raw or uncooked vegetables' },
        { icon: '🍱', text: 'Store cooked food covered and refrigerated' },
        { icon: '🔥', text: 'Reheat leftovers thoroughly before eating' },
        { icon: '🚫', text: 'Avoid eating at unhygienic stalls' },
    ],
    HOSPITAL_ACQUIRED: [
        { icon: '🏥', text: 'Avoid unnecessary hospital visits if healthy' },
        { icon: '🧤', text: 'Wear gloves when visiting patients' },
        { icon: '🧴', text: 'Sanitise hands on entry and exit' },
        { icon: '😷', text: 'Wear mask inside health facilities' },
        { icon: '📞', text: 'Consult doctor via phone when possible' },
    ],
    UNKNOWN: [
        { icon: '🧼', text: 'Wash hands frequently with soap' },
        { icon: '💧', text: 'Stay well hydrated with boiled water' },
        { icon: '📋', text: 'Report symptoms early via this app' },
        { icon: '🚑', text: 'Seek medical help if fever > 2 days' },
        { icon: '🏠', text: 'Avoid crowded areas until resolved' },
    ],
};

export const getChecklist = (category: string): ChecklistItem[] =>
    CHECKLISTS[category] ?? CHECKLISTS.UNKNOWN;

export const getRiskAction = (riskScore: number): string => {
    if (riskScore >= 75) return 'CRITICAL — Seek medical help immediately if unwell';
    if (riskScore >= 50) return 'HIGH — Follow all safety steps. Avoid crowded areas';
    if (riskScore >= 25) return 'MEDIUM — Be cautious. Monitor symptoms in your household';
    return 'LOW — Normal precautions. Keep surroundings clean';
};

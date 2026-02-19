// DEMO MODE: Rich dummy alerts for showcase
import { useQuery } from '@tanstack/react-query';

const DEMO_ALERTS = [
    {
        id: 'a1',
        severity: 'CRITICAL',
        outbreakCategory: 'VECTOR_BORNE',
        message: 'Dengue advisory — Ward 12. Cases have risen 3× this week. Use repellents and drain stagnant water immediately.',
        recommendedAction: 'Use mosquito nets tonight. Remove stagnant water. Seek help if fever > 2 days.',
        issuedBy: 'Delhi Health Dept',
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
    {
        id: 'a2',
        severity: 'HIGH',
        outbreakCategory: 'WATERBORNE',
        message: 'Water supply disruption in Blocks B–D until 4 PM. Store adequate water in advance.',
        recommendedAction: 'Store at least 20L per household before noon.',
        issuedBy: 'Delhi Jal Board',
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'a3',
        severity: 'HIGH',
        outbreakCategory: 'HEALTH_ADVISORY',
        message: 'GTB Hospital OPD at 140% capacity. Expect 2–3 hr wait. Visit only if urgent.',
        recommendedAction: 'Use Safdarjung or Lok Nayak Hospital for non-critical cases.',
        issuedBy: 'GTB Hospital Admin',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'a4',
        severity: 'MEDIUM',
        outbreakCategory: 'WATERBORNE',
        message: 'Cholera surveillance active. Precautionary alert based on water sample irregularity.',
        recommendedAction: 'Boil tap water before drinking. Avoid raw street food.',
        issuedBy: 'MCD Ward-12',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
];

export function useAlerts() {
    return useQuery({
        queryKey: ['alerts', 'demo'],
        queryFn: async () => {
            await new Promise(r => setTimeout(r, 300));
            return DEMO_ALERTS;
        },
        staleTime: Infinity,
        retry: false,
    });
}

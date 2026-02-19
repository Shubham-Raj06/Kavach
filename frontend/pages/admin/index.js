import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import { getToken, clearToken, getUser } from '../../lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ─── Theme tokens (mirrors globals.css) ───────────────────────────────────────
const T = {
    bg: '#080f0a',
    surface: '#0d1810',
    surface2: '#111f14',
    border: '#1a2e1d',
    accent: '#84cc16',
    accentDim: 'rgba(132,204,22,0.12)',
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#4ade80',
    text: '#ecfdf5',
    muted: '#6b8f72',
    mutedBright: '#a3c4a8',
    font: "'Ubuntu', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
};

// ─── Demo mode detection ───────────────────────────────────────────────────────
const isDemoMode = () =>
    typeof window !== 'undefined' &&
    !localStorage.getItem('kavach_access_token') &&
    !!sessionStorage.getItem('kavach_demo_role');

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_STATS = {
    users: { total: 124, active: 118, suspended: 6, byRole: { GOV: 12, HOSPITAL: 34, CITIZEN: 76, SUPER_ADMIN: 2 } },
    hospitals: { total: 8 },
    wards: { total: 8 },
    audit: { eventsToday: 43 },
    services: { database: 'HEALTHY', mlService: 'HEALTHY', alertEngine: 'HEALTHY' },
};
const MOCK_USERS = {
    users: [
        { id: '1', name: 'BMC Health Officer', email: 'gov@kavach.health', role: 'GOV', isActive: true, createdAt: new Date().toISOString() },
        { id: '2', name: 'KEM Hospital Admin', email: 'hospital@kavach.health', role: 'HOSPITAL', isActive: true, createdAt: new Date().toISOString() },
        { id: '3', name: 'Demo Citizen', email: 'citizen@kavach.health', role: 'CITIZEN', isActive: true, createdAt: new Date().toISOString() },
        { id: '4', name: 'Super Admin', email: 'admin@kavach.health', role: 'SUPER_ADMIN', isActive: true, createdAt: new Date().toISOString() },
    ],
    total: 4, pages: 1, page: 1,
};
const MOCK_HOSPITALS = {
    hospitals: [
        { id: '1', name: 'KEM Hospital', city: 'Mumbai', ward: { name: 'Ward 1 – Dharavi' }, capacity: 800, icuBeds: 120, isActive: true },
        { id: '2', name: 'Sion Hospital', city: 'Mumbai', ward: { name: 'Ward 2 – Kurla' }, capacity: 600, icuBeds: 80, isActive: true },
        { id: '3', name: 'Cooper Hospital', city: 'Mumbai', ward: { name: 'Ward 7 – Andheri' }, capacity: 500, icuBeds: 60, isActive: true },
    ],
    total: 3, pages: 1, page: 1,
};
const MOCK_WARDS = {
    wards: [
        { id: '1', name: 'Ward 1 – Dharavi', city: 'Mumbai', district: 'Mumbai', state: 'Maharashtra', population: 85000 },
        { id: '2', name: 'Ward 2 – Kurla', city: 'Mumbai', district: 'Mumbai', state: 'Maharashtra', population: 72000 },
        { id: '3', name: 'Ward 7 – Andheri', city: 'Mumbai', district: 'Mumbai', state: 'Maharashtra', population: 145000 },
    ],
    total: 3, pages: 1, page: 1,
};
const MOCK_AUDIT = {
    logs: [
        { id: '1', user: { email: 'admin@kavach.health', role: 'SUPER_ADMIN' }, action: 'USER_CREATE', resource: 'gov@kavach.health', ipAddress: '127.0.0.1', timestamp: new Date().toISOString() },
        { id: '2', user: { email: 'admin@kavach.health', role: 'SUPER_ADMIN' }, action: 'HOSPITAL_CREATE', resource: 'KEM Hospital', ipAddress: '127.0.0.1', timestamp: new Date().toISOString() },
        { id: '3', user: { email: 'admin@kavach.health', role: 'SUPER_ADMIN' }, action: 'ROLE_CHANGE', resource: 'hospital@kavach.health', ipAddress: '127.0.0.1', timestamp: new Date().toISOString() },
    ],
    total: 3, pages: 1, page: 1,
};

// ─── API helper ────────────────────────────────────────────────────────────────
const api = (path, opts = {}) =>
    axios({ url: `${API}${path}`, headers: { Authorization: `Bearer ${getToken()}` }, ...opts })
        .then(r => r.data)
        .catch(err => { throw err.response?.data || err; });

// ─── Design primitives ────────────────────────────────────────────────────────

function Card({ children, style = {} }) {
    return (
        <div style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 18,
            padding: '20px 22px',
            ...style,
        }}>
            {children}
        </div>
    );
}

function StatCard({ icon, label, value, color = T.accent }) {
    return (
        <Card style={{ boxShadow: `0 0 24px ${color}18` }}>
            <div style={{ fontSize: 26, marginBottom: 10 }}>{icon}</div>
            <div style={{
                fontFamily: T.font, fontSize: 34, fontWeight: 700,
                color, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
            }}>{value}</div>
            <div style={{ fontSize: 16, color: T.muted, marginTop: 6, fontWeight: 500 }}>{label}</div>
        </Card>
    );
}

// Role badge config
const ROLE_COLORS = {
    GOV: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', border: 'rgba(59,130,246,0.35)' },
    HOSPITAL: { bg: 'rgba(168,85,247,0.15)', text: '#c084fc', border: 'rgba(168,85,247,0.35)' },
    CITIZEN: { bg: 'rgba(132,204,22,0.12)', text: '#84cc16', border: 'rgba(132,204,22,0.3)' },
    SUPER_ADMIN: { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: 'rgba(245,158,11,0.35)' },
    green: { bg: 'rgba(74,222,128,0.12)', text: '#4ade80', border: 'rgba(74,222,128,0.3)' },
    red: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444', border: 'rgba(239,68,68,0.3)' },
    amber: { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: 'rgba(245,158,11,0.35)' },
};

function Badge({ children, role }) {
    const c = ROLE_COLORS[role] || ROLE_COLORS.GOV;
    return (
        <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            background: c.bg, color: c.text, border: `1px solid ${c.border}`,
            whiteSpace: 'nowrap', fontFamily: T.font,
        }}>{children}</span>
    );
}

function RoleBadge({ role }) {
    const labels = { GOV: 'Gov', HOSPITAL: 'Hospital', CITIZEN: 'Citizen', SUPER_ADMIN: 'Super Admin' };
    return <Badge role={role}>{labels[role] || role}</Badge>;
}

function StatusBadge({ active }) {
    const c = active ? ROLE_COLORS.green : ROLE_COLORS.red;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            background: c.bg, color: c.text, border: `1px solid ${c.border}`,
        }}>
            <span style={{
                width: 5, height: 5, borderRadius: '50%', background: c.text,
                boxShadow: `0 0 6px ${c.text}`,
            }} />
            {active ? 'Active' : 'Suspended'}
        </span>
    );
}

function Pagination({ page, pages, onPage }) {
    if (pages <= 1) return null;
    return (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', paddingTop: 14 }}>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => onPage(p)} style={{
                    width: 30, height: 30, borderRadius: 8, fontSize: 13, fontWeight: 600,
                    background: p === page ? T.accentDim : 'transparent',
                    border: `1px solid ${p === page ? T.accent : T.border}`,
                    color: p === page ? T.accent : T.muted,
                    cursor: 'pointer', fontFamily: T.font,
                }}>{p}</button>
            ))}
        </div>
    );
}

function SectionTitle({ children }) {
    return (
        <div style={{
            fontSize: 22, fontWeight: 700, color: T.text,
            fontFamily: T.font, letterSpacing: '-0.01em', marginBottom: 20,
        }}>{children}</div>
    );
}

function TableWrapper({ children }) {
    return (
        <div style={{ overflowX: 'auto', borderRadius: 14, border: `1px solid ${T.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, fontFamily: T.font }}>
                {children}
            </table>
        </div>
    );
}

const TH = ({ children }) => (
    <th style={{
        padding: '14px 18px', textAlign: 'left', fontSize: 13, fontWeight: 600,
        color: T.muted, letterSpacing: '0.03em',
        background: T.surface2,
        borderBottom: `1px solid ${T.border}`,
    }}>{children}</th>
);

const TD = ({ children }) => (
    <td style={{
        padding: '14px 18px', borderBottom: `1px solid rgba(26,46,29,0.6)`,
        color: T.mutedBright, verticalAlign: 'middle', fontSize: 14,
    }}>{children}</td>
);

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
            <div style={{
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 20, padding: 32, width: '100%', maxWidth: 500,
                position: 'relative', boxShadow: `0 0 60px rgba(132,204,22,0.08)`,
            }}>
                <div style={{
                    fontSize: 20, fontWeight: 700, marginBottom: 24,
                    color: T.text, fontFamily: T.font,
                }}>{title}</div>
                {children}
                <button onClick={onClose} style={{
                    position: 'absolute', top: 18, right: 18,
                    background: 'none', border: 'none', color: T.muted,
                    fontSize: 20, cursor: 'pointer', lineHeight: 1,
                }}>✕</button>
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, color: T.muted, display: 'block', marginBottom: 6, fontFamily: T.font, fontWeight: 500 }}>{label}</label>
            {children}
        </div>
    );
}

const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 10, fontSize: 15,
    background: T.surface2, border: `1px solid ${T.border}`,
    color: T.text, outline: 'none', boxSizing: 'border-box',
    fontFamily: T.font, transition: 'border-color 0.15s',
};

const selectStyle = { ...inputStyle };

function PrimaryBtn({ children, onClick, disabled, danger }) {
    return (
        <button onClick={onClick} disabled={disabled} style={{
            padding: '11px 22px', borderRadius: 10, fontSize: 15, fontWeight: 600,
            background: disabled
                ? 'rgba(255,255,255,0.04)'
                : danger
                    ? 'rgba(239,68,68,0.12)'
                    : T.accentDim,
            border: `1px solid ${disabled ? 'transparent' : danger ? 'rgba(239,68,68,0.35)' : 'rgba(132,204,22,0.4)'}`,
            color: disabled ? T.muted : danger ? T.critical : T.accent,
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontFamily: T.font, transition: 'all 0.15s',
        }}>{children}</button>
    );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = [
    { id: 'stats', label: '📊  System Overview' },
    { id: 'users', label: '👥  Users' },
    { id: 'hospitals', label: '🏥  Hospitals' },
    { id: 'wards', label: '📍  Wards' },
    { id: 'audit', label: '📋  Audit Logs' },
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
    const router = useRouter();
    const [tab, setTab] = useState('stats');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState({ users: [], total: 0, pages: 1, page: 1 });
    const [hospitals, setHospitals] = useState({ hospitals: [], total: 0, pages: 1, page: 1 });
    const [wards, setWards] = useState({ wards: [], total: 0, pages: 1, page: 1 });
    const [audit, setAudit] = useState({ logs: [], total: 0, pages: 1, page: 1 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [modal, setModal] = useState(null);
    const [searchUser, setSearchUser] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterAction, setFilterAction] = useState('');
    const [form, setForm] = useState({});
    const [formErr, setFormErr] = useState('');

    const currentUser = getUser();

    const load = useCallback(async (section, params = {}) => {
        if (isDemoMode()) {
            if (section === 'stats') setStats(MOCK_STATS);
            if (section === 'users') setUsers(MOCK_USERS);
            if (section === 'hospitals') setHospitals(MOCK_HOSPITALS);
            if (section === 'wards') setWards(MOCK_WARDS);
            if (section === 'audit') setAudit(MOCK_AUDIT);
            return;
        }
        setLoading(true); setError('');
        try {
            if (section === 'stats') {
                setStats(await api('/api/admin/stats'));
            } else if (section === 'users') {
                const q = new URLSearchParams({ page: params.page || 1, limit: 15, ...(params.role && { role: params.role }), ...(params.search && { search: params.search }) });
                setUsers(await api(`/api/admin/users?${q}`));
            } else if (section === 'hospitals') {
                const q = new URLSearchParams({ page: params.page || 1, limit: 15 });
                setHospitals(await api(`/api/admin/hospitals?${q}`));
            } else if (section === 'wards') {
                const q = new URLSearchParams({ page: params.page || 1, limit: 15 });
                setWards(await api(`/api/admin/wards?${q}`));
            } else if (section === 'audit') {
                const q = new URLSearchParams({ page: params.page || 1, limit: 20, ...(params.action && { action: params.action }), ...(params.role && { role: params.role }) });
                setAudit(await api(`/api/admin/audit-logs?${q}`));
            }
        } catch (e) {
            setError(e.error || 'Request failed');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (tab === 'stats') load('stats');
        else if (tab === 'users') load('users', { role: filterRole, search: searchUser });
        else if (tab === 'hospitals') load('hospitals');
        else if (tab === 'wards') load('wards');
        else if (tab === 'audit') load('audit', { action: filterAction, role: filterRole });
    }, [tab, load]);

    const handleLogout = () => { clearToken(); router.replace('/login'); };

    const handleUserAction = async (action, userId) => {
        try {
            if (action === 'suspend') await api(`/api/admin/users/${userId}/suspend`, { method: 'PATCH' });
            if (action === 'activate') await api(`/api/admin/users/${userId}/activate`, { method: 'PATCH' });
            load('users', { role: filterRole, search: searchUser });
        } catch (e) { setError(e.error || 'Action failed'); }
    };

    const handleFormSubmit = async () => {
        setFormErr('');
        try {
            if (modal === 'createUser') await api('/api/admin/users', { method: 'POST', data: form });
            else if (modal === 'createHospital') await api('/api/admin/hospitals', { method: 'POST', data: { ...form, capacity: +form.capacity, icuBeds: +form.icuBeds } });
            else if (modal === 'createWard') await api('/api/admin/wards', { method: 'POST', data: { ...form, latitude: +form.latitude, longitude: +form.longitude, population: +form.population } });
            setModal(null); setForm({});
            if (modal === 'createUser') load('users');
            if (modal === 'createHospital') load('hospitals');
            if (modal === 'createWard') load('wards');
        } catch (e) { setFormErr(e.error || JSON.stringify(e.details || 'Failed')); }
    };

    const demoMode = isDemoMode();

    return (
        <>
            <Head><title>Admin Control Room — Kavach</title></Head>

            <div style={{
                minHeight: '100vh',
                background: `radial-gradient(ellipse 120% 80% at 50% -10%, rgba(132,204,22,0.08) 0%, transparent 60%), ${T.bg}`,
                fontFamily: T.font,
                color: T.text,
                display: 'flex', flexDirection: 'column',
            }}>

                {/* ── Navbar ─────────────────────────────────────────────────── */}
                <nav style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 28px', height: 56,
                    background: 'rgba(8,15,10,0.92)',
                    borderBottom: `1px solid ${T.border}`,
                    backdropFilter: 'blur(14px)',
                    position: 'sticky', top: 0, zIndex: 50,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.01em' }}>Kavach</span>
                        <Badge role="SUPER_ADMIN">Super Admin</Badge>
                        {demoMode && (
                            <span style={{
                                fontSize: 11, padding: '3px 10px', borderRadius: 20,
                                background: 'rgba(132,204,22,0.12)', color: T.accent,
                                border: `1px solid rgba(132,204,22,0.3)`, fontWeight: 700,
                            }}>Demo mode</span>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span style={{ fontSize: 15, color: T.muted }}>{currentUser?.email}</span>
                        <button onClick={handleLogout} style={{
                            padding: '7px 18px', borderRadius: 9, fontSize: 14, fontWeight: 600,
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                            color: T.critical, cursor: 'pointer', fontFamily: T.font,
                        }}>Logout</button>
                    </div>
                </nav>

                {/* ── Body ───────────────────────────────────────────────────── */}
                <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

                    {/* Sidebar */}
                    <aside style={{
                        width: 220, flexShrink: 0,
                        background: 'rgba(13,24,16,0.7)',
                        borderRight: `1px solid ${T.border}`,
                        padding: '20px 12px',
                        display: 'flex', flexDirection: 'column', gap: 4,
                    }}>
                        {TABS.map(t => (
                            <button key={t.id} onClick={() => setTab(t.id)} style={{
                                padding: '12px 16px', borderRadius: 10, fontSize: 15, fontWeight: 500,
                                textAlign: 'left', cursor: 'pointer',
                                border: 'none',
                                background: tab === t.id ? T.accentDim : 'transparent',
                                color: tab === t.id ? T.accent : T.muted,
                                borderLeft: `2px solid ${tab === t.id ? T.accent : 'transparent'}`,
                                transition: 'all 0.15s', fontFamily: T.font,
                                letterSpacing: '-0.01em',
                            }}>{t.label}</button>
                        ))}
                    </aside>

                    {/* Main content */}
                    <main style={{ flex: 1, overflowY: 'auto', padding: '28px 30px' }}>
                        {error && (
                            <div style={{
                                padding: '12px 16px', borderRadius: 10, marginBottom: 20,
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                                color: T.critical, fontSize: 14,
                            }}>{error}</div>
                        )}

                        {/* ── STATS ─────────────────────────────────────────── */}
                        {tab === 'stats' && (
                            <div>
                                <SectionTitle>System Overview</SectionTitle>
                                {loading && <div style={{ color: T.muted, fontSize: 14 }}>Loading…</div>}
                                {stats && (
                                    <>
                                        {/* KPI grid */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
                                            <StatCard icon="👥" label="Total Users" value={stats.users.total} color="#60a5fa" />
                                            <StatCard icon="✅" label="Active Users" value={stats.users.active} color={T.accent} />
                                            <StatCard icon="🏥" label="Hospitals" value={stats.hospitals.total} color="#c084fc" />
                                            <StatCard icon="📍" label="Wards" value={stats.wards.total} color={T.high} />
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
                                            <StatCard icon="📋" label="Audit events today" value={stats.audit.eventsToday} color={T.medium} />
                                            <StatCard icon="🚫" label="Suspended accounts" value={stats.users.suspended} color={T.critical} />

                                            {/* Users by role */}
                                            <Card>
                                                <div style={{ fontSize: 15, color: T.muted, marginBottom: 16, fontWeight: 600 }}>Users by role</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                    {Object.entries(stats.users.byRole || {}).map(([role, count]) => (
                                                        <div key={role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <RoleBadge role={role} />
                                                            <span style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{count}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Card>
                                        </div>

                                        {/* Service health */}
                                        <Card>
                                            <div style={{ fontSize: 15, color: T.muted, marginBottom: 16, fontWeight: 600 }}>Service health</div>
                                            <div style={{ display: 'flex', gap: 28 }}>
                                                {Object.entries(stats.services || {}).map(([svc, status]) => (
                                                    <div key={svc} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <div style={{
                                                            width: 8, height: 8, borderRadius: '50%',
                                                            background: status === 'HEALTHY' ? T.accent : status === 'DEGRADED' ? T.medium : T.critical,
                                                            boxShadow: `0 0 8px ${status === 'HEALTHY' ? T.accent : T.critical}`,
                                                        }} />
                                                        <span style={{ fontSize: 15, color: T.muted, fontWeight: 500 }}>
                                                            {svc.replace(/([A-Z])/g, ' $1').trim()}
                                                        </span>
                                                        <span style={{
                                                            fontSize: 14, fontWeight: 700,
                                                            color: status === 'HEALTHY' ? T.accent : T.critical,
                                                        }}>{status}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                    </>
                                )}
                            </div>
                        )}

                        {/* ── USERS ─────────────────────────────────────────── */}
                        {tab === 'users' && (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                    <SectionTitle>User management</SectionTitle>
                                    <PrimaryBtn onClick={() => { setModal('createUser'); setForm({}); }}>+ Create user</PrimaryBtn>
                                </div>
                                {/* Filters */}
                                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                                    <input
                                        placeholder="Search email or name…"
                                        value={searchUser}
                                        onChange={e => setSearchUser(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && load('users', { role: filterRole, search: searchUser })}
                                        style={{ ...inputStyle, width: 240 }}
                                    />
                                    <select value={filterRole} onChange={e => { setFilterRole(e.target.value); load('users', { role: e.target.value, search: searchUser }); }} style={{ ...selectStyle, width: 160 }}>
                                        <option value="">All roles</option>
                                        {['GOV', 'HOSPITAL', 'CITIZEN', 'SUPER_ADMIN'].map(r => <option key={r}>{r}</option>)}
                                    </select>
                                    <PrimaryBtn onClick={() => load('users', { role: filterRole, search: searchUser })}>Search</PrimaryBtn>
                                </div>
                                {loading ? <div style={{ color: T.muted, fontSize: 14 }}>Loading…</div> : (
                                    <>
                                        <TableWrapper>
                                            <thead>
                                                <tr><TH>Name</TH><TH>Email</TH><TH>Role</TH><TH>Status</TH><TH>Created</TH><TH>Actions</TH></tr>
                                            </thead>
                                            <tbody>
                                                {users.users.map(u => (
                                                    <tr key={u.id}>
                                                        <TD>{u.name || '—'}</TD>
                                                        <TD><span style={{ fontFamily: T.mono, fontSize: 13 }}>{u.email}</span></TD>
                                                        <TD><RoleBadge role={u.role} /></TD>
                                                        <TD><StatusBadge active={u.isActive} /></TD>
                                                        <TD>{new Date(u.createdAt).toLocaleDateString('en-IN')}</TD>
                                                        <TD>
                                                            <div style={{ display: 'flex', gap: 8 }}>
                                                                {u.isActive
                                                                    ? <button onClick={() => handleUserAction('suspend', u.id)} style={{ ...actionBtn, color: T.critical, borderColor: 'rgba(239,68,68,0.3)' }}>Suspend</button>
                                                                    : <button onClick={() => handleUserAction('activate', u.id)} style={{ ...actionBtn, color: T.accent, borderColor: 'rgba(132,204,22,0.3)' }}>Activate</button>
                                                                }
                                                            </div>
                                                        </TD>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </TableWrapper>
                                        <Pagination page={users.page} pages={users.pages} onPage={p => load('users', { page: p, role: filterRole, search: searchUser })} />
                                    </>
                                )}
                            </div>
                        )}

                        {/* ── HOSPITALS ─────────────────────────────────────── */}
                        {tab === 'hospitals' && (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                    <SectionTitle>Hospital management</SectionTitle>
                                    <PrimaryBtn onClick={() => { setModal('createHospital'); setForm({}); }}>+ Add hospital</PrimaryBtn>
                                </div>
                                {loading ? <div style={{ color: T.muted, fontSize: 14 }}>Loading…</div> : (
                                    <>
                                        <TableWrapper>
                                            <thead><tr><TH>Name</TH><TH>City</TH><TH>Ward</TH><TH>Capacity</TH><TH>ICU beds</TH><TH>Status</TH></tr></thead>
                                            <tbody>
                                                {hospitals.hospitals.map(h => (
                                                    <tr key={h.id}>
                                                        <TD>{h.name}</TD>
                                                        <TD>{h.city}</TD>
                                                        <TD>{h.ward?.name || '—'}</TD>
                                                        <TD>{h.capacity}</TD>
                                                        <TD>{h.icuBeds}</TD>
                                                        <TD><StatusBadge active={h.isActive} /></TD>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </TableWrapper>
                                        <Pagination page={hospitals.page} pages={hospitals.pages} onPage={p => load('hospitals', { page: p })} />
                                    </>
                                )}
                            </div>
                        )}

                        {/* ── WARDS ─────────────────────────────────────────── */}
                        {tab === 'wards' && (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                    <SectionTitle>Ward management</SectionTitle>
                                    <PrimaryBtn onClick={() => { setModal('createWard'); setForm({}); }}>+ Add ward</PrimaryBtn>
                                </div>
                                {loading ? <div style={{ color: T.muted, fontSize: 14 }}>Loading…</div> : (
                                    <>
                                        <TableWrapper>
                                            <thead><tr><TH>Name</TH><TH>City</TH><TH>District</TH><TH>State</TH><TH>Population</TH></tr></thead>
                                            <tbody>
                                                {wards.wards.map(w => (
                                                    <tr key={w.id}>
                                                        <TD>{w.name}</TD>
                                                        <TD>{w.city}</TD>
                                                        <TD>{w.district}</TD>
                                                        <TD>{w.state}</TD>
                                                        <TD>{w.population?.toLocaleString() || '—'}</TD>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </TableWrapper>
                                        <Pagination page={wards.page} pages={wards.pages} onPage={p => load('wards', { page: p })} />
                                    </>
                                )}
                            </div>
                        )}

                        {/* ── AUDIT LOGS ────────────────────────────────────── */}
                        {tab === 'audit' && (
                            <div>
                                <SectionTitle>Audit logs</SectionTitle>
                                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                                    <input placeholder="Filter by action…" value={filterAction} onChange={e => setFilterAction(e.target.value)} onKeyDown={e => e.key === 'Enter' && load('audit', { action: filterAction, role: filterRole })} style={{ ...inputStyle, width: 200 }} />
                                    <select value={filterRole} onChange={e => { setFilterRole(e.target.value); load('audit', { action: filterAction, role: e.target.value }); }} style={{ ...selectStyle, width: 160 }}>
                                        <option value="">All roles</option>
                                        {['GOV', 'HOSPITAL', 'CITIZEN', 'SUPER_ADMIN'].map(r => <option key={r}>{r}</option>)}
                                    </select>
                                    <PrimaryBtn onClick={() => load('audit', { action: filterAction, role: filterRole })}>Apply</PrimaryBtn>
                                </div>
                                {loading ? <div style={{ color: T.muted, fontSize: 14 }}>Loading…</div> : (
                                    <>
                                        <TableWrapper>
                                            <thead><tr><TH>Time</TH><TH>User</TH><TH>Role</TH><TH>Action</TH><TH>Resource</TH><TH>IP</TH></tr></thead>
                                            <tbody>
                                                {audit.logs.map(l => (
                                                    <tr key={l.id}>
                                                        <TD><span style={{ fontFamily: T.mono, fontSize: 12 }}>{new Date(l.timestamp).toLocaleString('en-IN')}</span></TD>
                                                        <TD>{l.user?.email || '—'}</TD>
                                                        <TD>{l.user ? <RoleBadge role={l.user.role} /> : '—'}</TD>
                                                        <TD><span style={{ fontFamily: T.mono, fontSize: 13, color: T.accent, fontWeight: 600 }}>{l.action}</span></TD>
                                                        <TD><span style={{ fontSize: 13, color: T.muted }}>{l.resource || '—'}</span></TD>
                                                        <TD><span style={{ fontFamily: T.mono, fontSize: 12, color: T.muted }}>{l.ipAddress || '—'}</span></TD>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </TableWrapper>
                                        <Pagination page={audit.page} pages={audit.pages} onPage={p => load('audit', { page: p, action: filterAction, role: filterRole })} />
                                    </>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* ── MODALS ──────────────────────────────────────────────────── */}
            {modal === 'createUser' && (
                <Modal title="Create user" onClose={() => { setModal(null); setFormErr(''); }}>
                    <Field label="Email *"><input style={inputStyle} placeholder="user@org.in" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></Field>
                    <Field label="Full name"><input style={inputStyle} placeholder="Name" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
                    <Field label="Role *">
                        <select style={selectStyle} value={form.role || ''} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                            <option value="">Select role</option>
                            {['GOV', 'HOSPITAL', 'CITIZEN', 'SUPER_ADMIN'].map(r => <option key={r}>{r}</option>)}
                        </select>
                    </Field>
                    <Field label="Password *"><input type="password" style={inputStyle} placeholder="Min 8 chars" value={form.password || ''} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></Field>
                    <Field label="District (Gov only)"><input style={inputStyle} placeholder="e.g. Delhi" value={form.district || ''} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} /></Field>
                    {formErr && <div style={{ color: T.critical, fontSize: 13, marginBottom: 14 }}>{formErr}</div>}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <PrimaryBtn onClick={() => { setModal(null); setFormErr(''); }}>Cancel</PrimaryBtn>
                        <PrimaryBtn onClick={handleFormSubmit}>Create user</PrimaryBtn>
                    </div>
                </Modal>
            )}

            {modal === 'createHospital' && (
                <Modal title="Add hospital" onClose={() => { setModal(null); setFormErr(''); }}>
                    <Field label="Name *"><input style={inputStyle} placeholder="Hospital name" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
                    <Field label="City *"><input style={inputStyle} placeholder="City" value={form.city || ''} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></Field>
                    <Field label="Ward ID *"><input style={inputStyle} placeholder="Prisma ObjectId" value={form.wardId || ''} onChange={e => setForm(f => ({ ...f, wardId: e.target.value }))} /></Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <Field label="Total capacity"><input type="number" style={inputStyle} value={form.capacity || ''} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} /></Field>
                        <Field label="ICU beds"><input type="number" style={inputStyle} value={form.icuBeds || ''} onChange={e => setForm(f => ({ ...f, icuBeds: e.target.value }))} /></Field>
                    </div>
                    {formErr && <div style={{ color: T.critical, fontSize: 13, marginBottom: 14 }}>{formErr}</div>}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <PrimaryBtn onClick={() => { setModal(null); setFormErr(''); }}>Cancel</PrimaryBtn>
                        <PrimaryBtn onClick={handleFormSubmit}>Add hospital</PrimaryBtn>
                    </div>
                </Modal>
            )}

            {modal === 'createWard' && (
                <Modal title="Add ward" onClose={() => { setModal(null); setFormErr(''); }}>
                    <Field label="Name *"><input style={inputStyle} placeholder="Ward name" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
                    <Field label="City *"><input style={inputStyle} value={form.city || ''} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></Field>
                    <Field label="State *"><input style={inputStyle} value={form.state || ''} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} /></Field>
                    <Field label="District"><input style={inputStyle} value={form.district || ''} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} /></Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <Field label="Latitude"><input type="number" style={inputStyle} value={form.latitude || ''} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} /></Field>
                        <Field label="Longitude"><input type="number" style={inputStyle} value={form.longitude || ''} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} /></Field>
                    </div>
                    <Field label="Population"><input type="number" style={inputStyle} value={form.population || ''} onChange={e => setForm(f => ({ ...f, population: e.target.value }))} /></Field>
                    {formErr && <div style={{ color: T.critical, fontSize: 13, marginBottom: 14 }}>{formErr}</div>}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <PrimaryBtn onClick={() => { setModal(null); setFormErr(''); }}>Cancel</PrimaryBtn>
                        <PrimaryBtn onClick={handleFormSubmit}>Add ward</PrimaryBtn>
                    </div>
                </Modal>
            )}

            <style>{`
                * { box-sizing: border-box; }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 2px; }
                input:focus, select:focus { border-color: rgba(132,204,22,0.5) !important; }
                select option { background: ${T.surface2}; color: ${T.text}; }
            `}</style>
        </>
    );
}

// Shared action button style
const actionBtn = {
    padding: '6px 14px', borderRadius: 7, fontSize: 14, fontWeight: 600,
    background: 'transparent', border: '1px solid',
    cursor: 'pointer', fontFamily: "'Ubuntu', sans-serif",
    transition: 'all 0.15s',
};

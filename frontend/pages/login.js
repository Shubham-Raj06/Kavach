import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Shield, Eye, EyeOff, Zap } from 'lucide-react';
import { login } from '../lib/api';

const ROLE_ROUTES = {
    GOV: '/gov', HOSPITAL: '/hospital', CITIZEN: '/community', SUPER_ADMIN: '/admin',
    gov: '/gov', hospital: '/hospital', citizen: '/community', admin: '/admin',
};

const DEMO_CREDS = {
    gov: { email: 'gov@kavach.health', password: 'Gov@123', role: 'gov' },
    hospital: { email: 'hospital@kavach.health', password: 'Hospital@123', role: 'hospital' },
    citizen: { email: 'citizen@kavach.health', password: 'Citizen@123', role: 'citizen' },
    admin: { email: 'admin@kavach.health', password: 'Admin@123', role: 'admin' },
};

const QUICK_BUTTONS = [
    { role: 'gov', label: '🗺️ GOV', accent: 'rgba(132,204,22,0.15)', border: 'rgba(132,204,22,0.30)', text: '#84cc16' },
    { role: 'hospital', label: '🏥 HOSPITAL', accent: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.25)', text: '#4ade80' },
    { role: 'citizen', label: '👥 CITIZEN', accent: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.25)', text: '#fbbf24' },
    { role: 'admin', label: '⚙️ ADMIN', accent: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', text: '#f87171' },
];

// Decorative animated hexagon vector (matches reference image style)
function HexDecor({ size = 60, x, y, opacity = 0.2, rotate = 0, delay = 0 }) {
    return (
        <div style={{
            position: 'absolute', left: x, top: y,
            width: size, height: size,
            opacity,
            animation: `float-orb 6s ease-in-out ${delay}s infinite`,
            zIndex: 0,
        }}>
            <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"
                style={{ transform: `rotate(${rotate}deg)`, width: '100%', height: '100%' }}>
                <polygon points="30,2 56,17 56,43 30,58 4,43 4,17"
                    stroke="rgba(132,204,22,0.6)" strokeWidth="1.5"
                    fill="rgba(132,204,22,0.06)" />
                <polygon points="30,10 48,20 48,40 30,50 12,40 12,20"
                    stroke="rgba(74,222,128,0.3)" strokeWidth="1"
                    fill="rgba(74,222,128,0.03)" />
            </svg>
        </div>
    );
}

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await login(email, password);
            if (typeof window !== 'undefined') {
                localStorage.setItem('kavach_access_token', data.token);
                localStorage.setItem('kavach_user', JSON.stringify(data.user));
            }
            const role = data.user?.role || 'GOV';
            const returnTo = new URLSearchParams(window.location.search).get('returnTo');
            router.push(returnTo || ROLE_ROUTES[role] || '/dashboard');
        } catch {
            const matchedRole = Object.keys(DEMO_CREDS).find(r => DEMO_CREDS[r].email === email);
            if (matchedRole) {
                router.push(ROLE_ROUTES[matchedRole]);
            } else {
                setError('Invalid credentials. Use a demo button below to log in.');
            }
        } finally {
            setLoading(false);
        }
    };

    const quickLogin = (role) => {
        const demoRoleMap = { gov: 'GOV', hospital: 'HOSPITAL', citizen: 'CITIZEN', admin: 'SUPER_ADMIN' };
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('kavach_demo_role', demoRoleMap[role] || 'CITIZEN');
        }
        router.push(ROLE_ROUTES[role]);
    };

    const fillDemo = (role) => {
        setEmail(DEMO_CREDS[role].email);
        setPassword(DEMO_CREDS[role].password);
        setError('');
    };

    return (
        <>
            <Head>
                <title>Kavach — Sign In</title>
                <meta name="description" content="Kavach AI Disease Outbreak Monitor — Sign in" />
            </Head>

            <div style={{
                minHeight: '100vh',
                background: '#080f0a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20,
                position: 'relative',
                overflow: 'hidden',
                fontFamily: "'DM Sans', 'Inter', sans-serif",
            }}>
                {/* Ambient light blobs */}
                <div style={{
                    position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0,
                }}>
                    <div style={{
                        position: 'absolute', top: '-15%', left: '30%',
                        width: 500, height: 500,
                        background: 'radial-gradient(circle, rgba(132,204,22,0.10) 0%, transparent 70%)',
                        borderRadius: '50%',
                    }} />
                    <div style={{
                        position: 'absolute', bottom: '-10%', right: '20%',
                        width: 400, height: 400,
                        background: 'radial-gradient(circle, rgba(74,222,128,0.07) 0%, transparent 70%)',
                        borderRadius: '50%',
                    }} />
                    <div style={{
                        position: 'absolute', top: '40%', left: '-5%',
                        width: 300, height: 300,
                        background: 'radial-gradient(circle, rgba(132,204,22,0.05) 0%, transparent 70%)',
                        borderRadius: '50%',
                    }} />
                </div>

                {/* Floating hex decorations */}
                <HexDecor size={70} x="5%" y="8%" opacity={0.25} rotate={20} delay={0} />
                <HexDecor size={45} x="88%" y="5%" opacity={0.18} rotate={-15} delay={1.5} />
                <HexDecor size={55} x="80%" y="70%" opacity={0.20} rotate={30} delay={2.8} />
                <HexDecor size={35} x="3%" y="75%" opacity={0.15} rotate={-10} delay={0.8} />
                <HexDecor size={28} x="50%" y="92%" opacity={0.12} rotate={45} delay={3.5} />

                {/* Card */}
                <div style={{
                    width: '100%', maxWidth: 420,
                    position: 'relative', zIndex: 1,
                }}>
                    {/* Logo header */}
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center', justifyContent: 'center',
                            width: 58, height: 58, borderRadius: 16,
                            background: 'linear-gradient(135deg, #84cc16 0%, #4ade80 100%)',
                            boxShadow: '0 0 32px rgba(132,204,22,0.55), 0 0 64px rgba(132,204,22,0.18)',
                            marginBottom: 16,
                        }}>
                            <Shield size={28} color="#080f0a" strokeWidth={2.5} />
                        </div>
                        <h1 style={{
                            fontFamily: "'Ubuntu', sans-serif",
                            fontSize: 40, fontWeight: 700,
                            color: '#ecfdf5', margin: 0,
                            letterSpacing: '-0.02em',
                            lineHeight: 1.1,
                        }}>Kavach</h1>
                        <p style={{ fontSize: 15, color: '#6b8f72', margin: '6px 0 0', lineHeight: 1.5 }}>
                            AI Disease Outbreak Monitor
                        </p>
                    </div>

                    {/* Glass card */}
                    <div style={{
                        background: 'rgba(13,24,16,0.85)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(132,204,22,0.15)',
                        borderRadius: 20,
                        padding: '28px 28px',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(132,204,22,0.05)',
                    }}>
                        <h2 style={{
                            fontFamily: "'Ubuntu', sans-serif",
                            fontSize: 22, fontWeight: 700,
                            color: '#ecfdf5', margin: '0 0 22px',
                            letterSpacing: '-0.01em',
                        }}>Sign in</h2>

                        {/* Error */}
                        {error && (
                            <div style={{
                                background: 'rgba(239,68,68,0.10)',
                                border: '1px solid rgba(239,68,68,0.30)',
                                color: '#f87171', fontSize: 12,
                                padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                            }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {/* Email */}
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#a3c4a8', marginBottom: 7 }}>
                                    Email address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@kavach.health"
                                    required
                                    style={{
                                        width: '100%',
                                        background: 'rgba(8,15,10,0.8)',
                                        border: '1px solid rgba(26,46,29,0.9)',
                                        borderRadius: 10, padding: '12px 14px',
                                        fontSize: 15, color: '#ecfdf5',
                                        outline: 'none',
                                        transition: 'border-color 0.15s',
                                        fontFamily: "'Ubuntu', sans-serif",
                                        boxSizing: 'border-box',
                                    }}
                                    onFocus={e => e.target.style.borderColor = 'rgba(132,204,22,0.50)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(26,46,29,0.9)'}
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#a3c4a8', marginBottom: 7 }}>
                                    Password
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPw ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        style={{
                                            width: '100%',
                                            background: 'rgba(8,15,10,0.8)',
                                            border: '1px solid rgba(26,46,29,0.9)',
                                            borderRadius: 10, padding: '12px 44px 12px 14px',
                                            fontSize: 15, color: '#ecfdf5',
                                            outline: 'none',
                                            transition: 'border-color 0.15s',
                                            fontFamily: "'Ubuntu', sans-serif",
                                            boxSizing: 'border-box',
                                        }}
                                        onFocus={e => e.target.style.borderColor = 'rgba(132,204,22,0.50)'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(26,46,29,0.9)'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw(!showPw)}
                                        style={{
                                            position: 'absolute', right: 12, top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none', border: 'none',
                                            color: '#6b8f72', cursor: 'pointer',
                                            lineHeight: 0,
                                        }}
                                    >
                                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    background: loading ? 'rgba(132,204,22,0.4)' : 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
                                    color: '#080f0a',
                                    fontFamily: "'Ubuntu', sans-serif",
                                    fontWeight: 700, fontSize: 15,
                                    padding: '14px 0',
                                    borderRadius: 10, border: 'none',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 0 20px rgba(132,204,22,0.35)',
                                    transition: 'all 0.2s',
                                    letterSpacing: '0.01em',
                                    marginTop: 6,
                                }}
                            >
                                {loading ? (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                        <span style={{ width: 14, height: 14, border: '2px solid rgba(8,15,10,0.3)', borderTopColor: '#080f0a', borderRadius: '50%', display: 'inline-block', animation: 'spin-slow 0.8s linear infinite' }} />
                                        Signing in…
                                    </span>
                                ) : 'Sign In'}
                            </button>
                        </form>

                        {/* Demo creds section */}
                        <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid rgba(26,46,29,0.8)' }}>
                            <p style={{ fontSize: 12, color: '#6b8f72', textAlign: 'center', marginBottom: 10, fontWeight: 500 }}>
                                Try a demo account
                            </p>

                            {/* Credential table */}
                            <div style={{
                                background: 'rgba(8,15,10,0.6)',
                                border: '1px solid rgba(26,46,29,0.7)',
                                borderRadius: 10, padding: '10px 12px',
                                marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 7,
                            }}>
                                {[
                                    { role: 'Admin', email: 'admin@kavach.health', pass: 'Admin@123' },
                                    { role: 'Gov', email: 'gov@kavach.health', pass: 'Gov@123' },
                                    { role: 'Hospital', email: 'hospital@kavach.health', pass: 'Hospital@123' },
                                    { role: 'Citizen', email: 'citizen@kavach.health', pass: 'Citizen@123' },
                                ].map(cred => (
                                    <div key={cred.role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10 }}>
                                        <span style={{ color: '#a3c4a8', fontWeight: 600 }}>{cred.role}</span>
                                        <div style={{ textAlign: 'right' }}>
                                            <code style={{ color: '#84cc16' }}>{cred.email}</code>
                                            <span style={{ color: '#3d5a42', margin: '0 4px' }}>/</span>
                                            <code style={{ color: '#4ade80' }}>{cred.pass}</code>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Quick-login buttons */}
                            <div style={{ display: 'flex', gap: 6 }}>
                                {QUICK_BUTTONS.map(({ role, label, accent, border, text }) => (
                                    <button
                                        key={role}
                                        onClick={() => quickLogin(role)}
                                        style={{
                                            flex: 1, fontSize: 9, fontWeight: 800,
                                            paddingTop: 8, paddingBottom: 8,
                                            borderRadius: 8, border: `1px solid ${border}`,
                                            background: accent, color: text,
                                            cursor: 'pointer',
                                            transition: 'all 0.15s',
                                            fontFamily: "'DM Sans', sans-serif",
                                            letterSpacing: '0.04em',
                                        }}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sign up link */}
                        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(26,46,29,0.5)', textAlign: 'center' }}>
                            <p style={{ fontSize: 12, color: '#6b8f72', margin: 0 }}>
                                New here?{' '}
                                <Link href="/signup" style={{ color: '#84cc16', fontWeight: 700, textDecoration: 'none' }}>
                                    Create a citizen account
                                </Link>
                            </p>
                        </div>
                    </div>

                    <p style={{ textAlign: 'center', fontSize: 11, color: '#3d5a42', marginTop: 16 }}>
                        Kavach · AI-Powered Disease Surveillance · v2.0
                    </p>
                </div>

                <style>{`
                    @keyframes float-orb {
                        0%, 100% { transform: translateY(0px) scale(1); }
                        50%       { transform: translateY(-14px) scale(1.04); }
                    }
                    @keyframes spin-slow {
                        from { transform: rotate(0deg); }
                        to   { transform: rotate(360deg); }
                    }
                    input::placeholder { color: #3d5a42; }
                `}</style>
            </div>
        </>
    );
}

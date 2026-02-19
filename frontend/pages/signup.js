import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Shield, Eye, EyeOff, User, Mail, Lock, MapPin } from 'lucide-react';
import { register } from '../lib/api';

const ROLE_ROUTES = {
    GOV: '/gov',
    HOSPITAL: '/hospital',
    CITIZEN: '/community',
    SUPER_ADMIN: '/admin',
};

export default function SignupPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        name: '', email: '', password: '', confirm: '',
        wardId: '',
    });
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    const validate = () => {
        if (!form.name.trim()) return 'Full name is required.';
        if (!form.email.trim()) return 'Email is required.';
        if (form.password.length < 8) return 'Password must be at least 8 characters.';
        if (!/[A-Z]/.test(form.password)) return 'Password must contain at least one uppercase letter.';
        if (!/[0-9]/.test(form.password)) return 'Password must contain at least one number.';
        if (form.password !== form.confirm) return 'Passwords do not match.';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        const err = validate();
        if (err) { setError(err); return; }

        setLoading(true);
        try {
            const payload = {
                name: form.name,
                email: form.email,
                password: form.password,
                role: 'CITIZEN',
                ...(form.wardId && { wardId: form.wardId }),
            };
            const data = await register(payload);
            // Store token + user just like login does
            if (typeof window !== 'undefined') {
                localStorage.setItem('kavach_access_token', data.token);
                localStorage.setItem('kavach_user', JSON.stringify(data.user));
            }
            setSuccess('Account created! Redirecting…');
            setTimeout(() => router.push(ROLE_ROUTES[data.user?.role] || '/community'), 1000);
        } catch (err) {
            const msg = err?.response?.data?.error || err?.error || err?.message || 'Registration failed.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Kavach — Create Account</title>
                <meta name="description" content="Create a Kavach account to report and track disease outbreaks in your area." />
            </Head>

            <div style={{ minHeight: '100vh', background: '#080f0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative', overflow: 'hidden', fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
                {/* Ambient blobs */}
                <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
                    <div style={{ position: 'absolute', top: '-10%', right: '20%', width: 450, height: 450, background: 'radial-gradient(circle, rgba(132,204,22,0.09) 0%, transparent 70%)', borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', bottom: '-10%', left: '15%', width: 350, height: 350, background: 'radial-gradient(circle, rgba(74,222,128,0.06) 0%, transparent 70%)', borderRadius: '50%' }} />
                </div>

                <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
                    {/* Logo */}
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #84cc16 0%, #4ade80 100%)', boxShadow: '0 0 28px rgba(132,204,22,0.50)', marginBottom: 12 }}>
                            <Shield size={26} color="#080f0a" strokeWidth={2.5} />
                        </div>
                        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#ecfdf5', margin: 0, letterSpacing: '-0.03em' }}>Create Account</h1>
                        <p style={{ fontSize: 13, color: '#6b8f72', margin: '4px 0 0' }}>Join Kavach AI Disease Surveillance</p>
                    </div>

                    {/* Card */}
                    <div style={{ background: 'rgba(13,24,16,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(132,204,22,0.15)', borderRadius: 20, padding: '26px 28px', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}>
                        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#ecfdf5', margin: '0 0 6px' }}>Citizen Sign Up</h2>
                        <p style={{ fontSize: 11, color: '#6b8f72', marginBottom: 20 }}>
                            Citizen accounts are self-registered. GOV and Hospital accounts are provisioned by administrators.
                        </p>

                        {error && (
                            <div style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)', color: '#f87171', fontSize: 12, padding: '10px 14px', borderRadius: 10, marginBottom: 14 }}>
                                {error}
                            </div>
                        )}
                        {success && (
                            <div style={{ background: 'rgba(132,204,22,0.10)', border: '1px solid rgba(132,204,22,0.30)', color: '#84cc16', fontSize: 12, padding: '10px 14px', borderRadius: 10, marginBottom: 14 }}>
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {/* Full Name */}
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#a3c4a8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Full Name</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#3d5a42' }} />
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={set('name')}
                                        placeholder="Your full name"
                                        required
                                        style={{ width: '100%', background: 'rgba(8,15,10,0.8)', border: '1px solid rgba(26,46,29,0.9)', borderRadius: 10, padding: '11px 14px 11px 36px', fontSize: 13, color: '#ecfdf5', outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }}
                                        onFocus={e => e.target.style.borderColor = 'rgba(132,204,22,0.50)'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(26,46,29,0.9)'}
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#a3c4a8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#3d5a42' }} />
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={set('email')}
                                        placeholder="you@example.com"
                                        required
                                        style={{ width: '100%', background: 'rgba(8,15,10,0.8)', border: '1px solid rgba(26,46,29,0.9)', borderRadius: 10, padding: '11px 14px 11px 36px', fontSize: 13, color: '#ecfdf5', outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }}
                                        onFocus={e => e.target.style.borderColor = 'rgba(132,204,22,0.50)'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(26,46,29,0.9)'}
                                    />
                                </div>
                            </div>

                            {/* Ward ID (optional) */}
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#a3c4a8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Ward ID <span style={{ color: '#3d5a42', fontWeight: 400 }}>(optional)</span>
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <MapPin size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#3d5a42' }} />
                                    <input
                                        type="text"
                                        value={form.wardId}
                                        onChange={set('wardId')}
                                        placeholder="Your municipal ward ID"
                                        style={{ width: '100%', background: 'rgba(8,15,10,0.8)', border: '1px solid rgba(26,46,29,0.9)', borderRadius: 10, padding: '11px 14px 11px 36px', fontSize: 13, color: '#ecfdf5', outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }}
                                        onFocus={e => e.target.style.borderColor = 'rgba(132,204,22,0.50)'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(26,46,29,0.9)'}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#a3c4a8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#3d5a42' }} />
                                    <input
                                        type={showPw ? 'text' : 'password'}
                                        value={form.password}
                                        onChange={set('password')}
                                        placeholder="Min 8 chars, 1 uppercase, 1 number"
                                        required
                                        style={{ width: '100%', background: 'rgba(8,15,10,0.8)', border: '1px solid rgba(26,46,29,0.9)', borderRadius: 10, padding: '11px 40px 11px 36px', fontSize: 13, color: '#ecfdf5', outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }}
                                        onFocus={e => e.target.style.borderColor = 'rgba(132,204,22,0.50)'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(26,46,29,0.9)'}
                                    />
                                    <button type="button" onClick={() => setShowPw(!showPw)}
                                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b8f72', cursor: 'pointer', lineHeight: 0 }}>
                                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                                {/* Password strength indicators */}
                                {form.password && (
                                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                                        {[
                                            { ok: form.password.length >= 8, label: '8+ chars' },
                                            { ok: /[A-Z]/.test(form.password), label: 'Uppercase' },
                                            { ok: /[0-9]/.test(form.password), label: 'Number' },
                                        ].map(({ ok, label }) => (
                                            <span key={label} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, border: ok ? '1px solid rgba(132,204,22,0.40)' : '1px solid rgba(26,46,29,0.8)', background: ok ? 'rgba(132,204,22,0.10)' : 'transparent', color: ok ? '#84cc16' : '#3d5a42', transition: 'all 0.15s' }}>
                                                {ok ? '✓' : '○'} {label}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#a3c4a8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Confirm Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#3d5a42' }} />
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        value={form.confirm}
                                        onChange={set('confirm')}
                                        placeholder="Repeat your password"
                                        required
                                        style={{ width: '100%', background: 'rgba(8,15,10,0.8)', border: `1px solid ${form.confirm && form.confirm !== form.password ? 'rgba(239,68,68,0.40)' : 'rgba(26,46,29,0.9)'}`, borderRadius: 10, padding: '11px 40px 11px 36px', fontSize: 13, color: '#ecfdf5', outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }}
                                        onFocus={e => e.target.style.borderColor = 'rgba(132,204,22,0.50)'}
                                        onBlur={e => e.target.style.borderColor = form.confirm && form.confirm !== form.password ? 'rgba(239,68,68,0.40)' : 'rgba(26,46,29,0.9)'}
                                    />
                                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b8f72', cursor: 'pointer', lineHeight: 0 }}>
                                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                                {form.confirm && form.confirm !== form.password && (
                                    <p style={{ color: '#f87171', fontSize: 10, marginTop: 5 }}>Passwords do not match</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{ width: '100%', background: loading ? 'rgba(132,204,22,0.4)' : 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)', color: '#080f0a', fontWeight: 800, fontSize: 14, padding: '13px 0', borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 0 20px rgba(132,204,22,0.35)', fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}
                            >
                                {loading ? (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                        <span style={{ width: 14, height: 14, border: '2px solid rgba(8,15,10,0.3)', borderTopColor: '#080f0a', borderRadius: '50%', display: 'inline-block', animation: 'spin-slow 0.8s linear infinite' }} />
                                        Creating account…
                                    </span>
                                ) : 'Create Account'}
                            </button>
                        </form>

                        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(26,46,29,0.5)', textAlign: 'center' }}>
                            <p style={{ fontSize: 12, color: '#6b8f72', margin: 0 }}>
                                Already have an account?{' '}
                                <Link href="/login" style={{ color: '#84cc16', fontWeight: 700, textDecoration: 'none' }}>
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>

                    <p style={{ textAlign: 'center', fontSize: 11, color: '#3d5a42', marginTop: 16 }}>
                        Kavach · AI-Powered Disease Surveillance · v2.0
                    </p>
                </div>
                <style>{`
                    @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    input::placeholder { color: #3d5a42; }
                `}</style>
            </div>
        </>
    );
}

import { AlertTriangle, Bell, Activity, LogOut, Shield } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getUser, clearToken } from '../lib/auth';
import { useEffect, useState } from 'react';

const SEVERITY_COLOR = {
    CRITICAL: 'text-red-400',
    HIGH: 'text-orange-400',
    MEDIUM: 'text-yellow-400',
    LOW: 'text-kavach-low',
};

export default function Navbar({ alerts = [] }) {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [showUserMenu, setShowUserMenu] = useState(false);

    useEffect(() => {
        const updateAuth = () => {
            const u = getUser();
            const demoRole = sessionStorage.getItem('kavach_demo_role');
            if (u) setUser(u);
            else if (demoRole) setUser({ name: 'Demo User', role: demoRole });
            else setUser(null);
        };
        updateAuth();
    }, [router.asPath]);

    const handleLogout = () => {
        clearToken();
        setUser(null);
        router.push('/');
    };

    const criticalCount = alerts.filter(a => ['CRITICAL', 'HIGH'].includes(a.severity)).length;
    const userInitial = user?.name?.charAt(0) || user?.role?.charAt(0) || '?';

    return (
        <header
            style={{
                height: 56,
                background: 'rgba(8,15,10,0.85)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                borderBottom: '1px solid rgba(132,204,22,0.12)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 24px',
                gap: 16,
                flexShrink: 0,
                zIndex: 50,
                position: 'sticky',
                top: 0,
            }}
        >
            {/* Logo */}
            <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                <span style={{
                    fontFamily: "'Ubuntu', sans-serif",
                    fontWeight: 700,
                    fontSize: 26,
                    letterSpacing: '-0.01em',
                    color: '#ecfdf5',
                    marginRight: 10,
                }}>
                    Kavach
                </span>
            </Link>

            {/* Nav links */}
            <nav style={{ display: 'flex', gap: 2, fontSize: 16 }}>
                {[
                    { name: 'Dashboard', path: '/dashboard' },
                    { name: 'Alerts', path: '/alerts' },
                ].map(item => {
                    const isActive = router.pathname === item.path;
                    return (
                        <Link
                            key={item.name}
                            href={item.path}
                            style={{
                                padding: '6px 14px',
                                borderRadius: 8,
                                fontWeight: isActive ? 600 : 400,
                                color: isActive ? '#84cc16' : 'rgba(172,220,180,0.55)',
                                background: isActive ? 'rgba(132,204,22,0.10)' : 'transparent',
                                textDecoration: 'none',
                                transition: 'all 0.15s',
                                border: isActive ? '1px solid rgba(132,204,22,0.20)' : '1px solid transparent',
                            }}
                        >
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Critical badge */}
                {criticalCount > 0 && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: 'rgba(239,68,68,0.10)',
                        border: '1px solid rgba(239,68,68,0.30)',
                        color: '#f87171',
                        fontSize: 16, fontWeight: 600,
                        padding: '4px 10px', borderRadius: 999,
                    }}>
                        <AlertTriangle size={11} />
                        <span>{criticalCount} active alert{criticalCount > 1 ? 's' : ''}</span>
                    </div>
                )}

                {/* Bell */}
                <button style={{
                    position: 'relative', padding: 8, borderRadius: 8,
                    background: 'rgba(132,204,22,0.06)',
                    border: '1px solid rgba(132,204,22,0.12)',
                    color: 'rgba(172,220,180,0.6)',
                    cursor: 'pointer', lineHeight: 0,
                    transition: 'all 0.15s',
                }}>
                    <Bell size={16} />
                    {criticalCount > 0 && (
                        <span style={{
                            position: 'absolute', top: 5, right: 5,
                            width: 7, height: 7,
                            background: '#ef4444',
                            borderRadius: '50%',
                            boxShadow: '0 0 6px rgba(239,68,68,0.8)',
                        }} />
                    )}
                </button>

                {/* User menu */}
                {user ? (
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                background: 'rgba(132,204,22,0.08)',
                                border: '1px solid rgba(132,204,22,0.20)',
                                borderRadius: 8, padding: '5px 10px',
                                cursor: 'pointer',
                            }}
                        >
                            <div style={{
                                width: 24, height: 24, borderRadius: 6,
                                background: 'linear-gradient(135deg, #84cc16, #4ade80)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 16, fontWeight: 800, color: '#080f0a',
                            }}>
                                {userInitial.toUpperCase()}
                            </div>
                            <span style={{ fontSize: 16, color: '#a3c4a8', fontWeight: 500 }}>
                                {user.name || user.role}
                            </span>
                        </button>

                        {showUserMenu && (
                            <div style={{
                                position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                                width: 180,
                                background: '#0d1810',
                                border: '1px solid rgba(132,204,22,0.15)',
                                borderRadius: 12,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(132,204,22,0.08)',
                                padding: '6px 0',
                                zIndex: 50,
                            }}>
                                <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(132,204,22,0.08)' }}>
                                    <p style={{ fontSize: 16, fontWeight: 600, color: '#ecfdf5', margin: 0 }}>
                                        {user.name}
                                    </p>
                                    <p style={{ fontSize: 16, color: '#6b8f72', margin: 0 }}>
                                        {user.role}
                                    </p>
                                </div>
                                <Link
                                    href={
                                        user.role === 'SUPER_ADMIN' ? '/admin' :
                                            user.role === 'GOV' ? '/gov' :
                                                user.role === 'HOSPITAL' ? '/hospital' : '/community'
                                    }
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        padding: '9px 14px', fontSize: 16,
                                        color: '#a3c4a8', textDecoration: 'none',
                                        transition: 'color 0.15s',
                                    }}
                                >
                                    <Activity size={13} />
                                    <span>My Console</span>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                                        padding: '9px 14px', fontSize: 16,
                                        color: '#f87171', background: 'none',
                                        border: 'none', cursor: 'pointer',
                                        transition: 'background 0.15s',
                                    }}
                                >
                                    <LogOut size={13} />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <Link
                        href="/login"
                        style={{
                            padding: '7px 16px',
                            background: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
                            color: '#080f0a',
                            fontSize: 16, fontWeight: 700,
                            borderRadius: 8,
                            textDecoration: 'none',
                            boxShadow: '0 0 14px rgba(132,204,22,0.35)',
                            transition: 'box-shadow 0.2s',
                        }}
                    >
                        Sign In
                    </Link>
                )}
            </div>
        </header >
    );
}

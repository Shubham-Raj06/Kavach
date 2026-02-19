import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SEVERITY_STYLE = {
    CRITICAL: { bg: '#450a0a', border: '#ef4444', text: '#fca5a5', icon: '🚨' },
    HIGH: { bg: '#43190a', border: '#f97316', text: '#fdba74', icon: '⚠️' },
    MEDIUM: { bg: '#422006', border: '#f59e0b', text: '#fcd34d', icon: '🟡' },
    LOW: { bg: '#052e16', border: '#22c55e', text: '#86efac', icon: 'ℹ️' },
};

/**
 * LiveAlertFeed — Phase 4: Real-time Socket.io alert feed for dashboard.
 * Subscribes to 'dashboard' room and renders incoming alerts.
 */
export default function LiveAlertFeed({ maxAlerts = 20 }) {
    const [alerts, setAlerts] = useState([]);
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
        const s = io(API_URL, {
            auth: { token: typeof window !== 'undefined' ? localStorage.getItem('token') : '' },
            transports: ['websocket'],
        });

        s.on('connect', () => {
            setConnected(true);
            s.emit('join:dashboard');
        });

        s.on('disconnect', () => setConnected(false));

        s.on('alert:new', (alert) => {
            setAlerts(prev => [
                { ...alert, receivedAt: new Date() },
                ...prev.slice(0, maxAlerts - 1),
            ]);
        });

        s.on('risk:update', (data) => {
            if (data.riskScore >= 70) {
                setAlerts(prev => [
                    {
                        wardId: data.wardId,
                        severity: data.riskScore >= 80 ? 'CRITICAL' : 'HIGH',
                        message: `Risk update: Ward ${data.wardId} scored ${data.riskScore}`,
                        riskScore: data.riskScore,
                        receivedAt: new Date(),
                    },
                    ...prev.slice(0, maxAlerts - 1),
                ]);
            }
        });

        setSocket(s);
        return () => s.disconnect();
    }, []);

    return (
        <div style={s.container}>
            <div style={s.header}>
                <span style={s.title}>📡 Live Alert Feed</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? '#22c55e' : '#ef4444' }} />
                    <span style={{ color: connected ? '#22c55e' : '#ef4444', fontSize: 11 }}>
                        {connected ? 'LIVE' : 'OFFLINE'}
                    </span>
                </div>
            </div>

            <div style={s.feed}>
                {alerts.length === 0 ? (
                    <div style={s.empty}>Waiting for alerts…</div>
                ) : (
                    alerts.map((alert, i) => {
                        const style = SEVERITY_STYLE[alert.severity] ?? SEVERITY_STYLE.LOW;
                        return (
                            <div key={i} style={{ ...s.alertRow, background: style.bg, borderLeft: `3px solid ${style.border}` }}>
                                <div style={s.alertTop}>
                                    <span style={{ color: style.text, fontWeight: 700, fontSize: 12 }}>
                                        {style.icon} Ward {alert.wardId} — {alert.severity}
                                    </span>
                                    <span style={s.time}>
                                        {new Date(alert.receivedAt || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div style={s.alertMsg}>{alert.message}</div>
                                {alert.riskScore && (
                                    <div style={{ color: style.text, fontSize: 11, marginTop: 4 }}>
                                        Risk Score: <b>{alert.riskScore}</b>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

const s = {
    container: { background: '#0f172a', borderRadius: 16, padding: 20, height: '100%', display: 'flex', flexDirection: 'column' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    title: { color: '#e2e8f0', fontSize: 14, fontWeight: 700 },
    feed: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 },
    empty: { color: '#475569', fontSize: 13, textAlign: 'center', padding: '24px 0' },
    alertRow: { borderRadius: 8, padding: '10px 12px' },
    alertTop: { display: 'flex', justifyContent: 'space-between', marginBottom: 4 },
    alertMsg: { color: '#94a3b8', fontSize: 12, lineHeight: '18px' },
    time: { color: '#475569', fontSize: 11 },
};

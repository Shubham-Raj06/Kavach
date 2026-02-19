import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Unauthorized() {
    const router = useRouter();
    return (
        <>
            <Head>
                <title>Unauthorized — Kavach</title>
            </Head>
            <div style={{
                minHeight: '100vh',
                background: '#06090f',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Inter', sans-serif",
                color: '#f1f5f9',
                textAlign: 'center',
                padding: 24,
            }}>
                <div style={{
                    fontSize: 64,
                    fontWeight: 900,
                    color: 'rgba(239,68,68,0.3)',
                    lineHeight: 1,
                    letterSpacing: '-4px',
                    marginBottom: 12,
                }}>403</div>
                <div style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#ef4444',
                    marginBottom: 8,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                }}>Access Denied</div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', maxWidth: 360, marginBottom: 32 }}>
                    You don't have permission to view this page.
                    Contact your administrator if you believe this is a mistake.
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={() => router.back()}
                        style={{
                            padding: '9px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.7)',
                            cursor: 'pointer',
                        }}>← Go Back</button>
                    <button
                        onClick={() => router.replace('/login')}
                        style={{
                            padding: '9px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                            background: 'rgba(239,68,68,0.15)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            color: '#ef4444',
                            cursor: 'pointer',
                        }}>Log In as Different User</button>
                </div>
            </div>
        </>
    );
}

import { useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useCommandStore from '../../store/commandStore';

// Radial pulse CSS injected once at module level
const PULSE_STYLE = `
@keyframes emergencyPulse {
  0%   { box-shadow: 0 0 0 0 rgba(239,68,68,0.7), 0 0 24px rgba(239,68,68,0.4); }
  70%  { box-shadow: 0 0 0 14px rgba(239,68,68,0), 0 0 32px rgba(239,68,68,0.2); }
  100% { box-shadow: 0 0 0 0 rgba(239,68,68,0), 0 0 24px rgba(239,68,68,0.4); }
}
@keyframes emergencyRing {
  0%   { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(2.2); opacity: 0; }
}
.emergency-btn-active {
  animation: emergencyPulse 1.6s ease-in-out infinite;
}
`;

export default function EmergencyToggle() {
    const { commandMode, toggleCommandMode, soundEnabled, toggleSound } = useCommandStore();
    const styleInjected = useRef(false);

    // Inject CSS once
    if (!styleInjected.current && typeof document !== 'undefined') {
        const tag = document.createElement('style');
        tag.textContent = PULSE_STYLE;
        document.head.appendChild(tag);
        styleInjected.current = true;
    }

    const handleToggle = useCallback(() => {
        toggleCommandMode();
    }, [toggleCommandMode]);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Sound toggle */}
            <motion.button
                onClick={toggleSound}
                whileTap={{ scale: 0.9 }}
                title={soundEnabled ? 'Mute alert sound' : 'Enable alert sound'}
                style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.5)',
                    display: 'flex', alignItems: 'center', gap: 4,
                }}
            >
                {soundEnabled ? '🔊' : '🔇'}
            </motion.button>

            {/* Main emergency toggle */}
            <motion.button
                onClick={handleToggle}
                whileTap={{ scale: 0.93 }}
                className={commandMode ? 'emergency-btn-active' : ''}
                animate={{
                    background: commandMode
                        ? 'linear-gradient(135deg, #7f1d1d, #991b1b)'
                        : 'rgba(239,68,68,0.08)',
                    borderColor: commandMode ? '#ef4444' : 'rgba(239,68,68,0.3)',
                    color: commandMode ? '#fca5a5' : '#ef4444',
                }}
                transition={{ duration: 0.4 }}
                style={{
                    position: 'relative',
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '5px 14px',
                    borderRadius: 9,
                    border: '1px solid',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    overflow: 'hidden',
                    WebkitFontSmoothing: 'antialiased',
                }}
            >
                {/* Animated ring overlay */}
                <AnimatePresence>
                    {commandMode && (
                        <motion.span
                            key="ring"
                            initial={{ scale: 1, opacity: 0.6 }}
                            animate={{ scale: 2.4, opacity: 0 }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                borderRadius: 9,
                                border: '1px solid rgba(239,68,68,0.6)',
                                pointerEvents: 'none',
                            }}
                        />
                    )}
                </AnimatePresence>

                {/* Indicator dot */}
                <motion.span
                    animate={{
                        backgroundColor: commandMode ? '#ef4444' : 'rgba(239,68,68,0.4)',
                        boxShadow: commandMode ? '0 0 8px rgba(239,68,68,0.9)' : 'none',
                    }}
                    transition={{ duration: 0.3 }}
                    style={{
                        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                    }}
                />

                <span>{commandMode ? 'EMERGENCY ACTIVE' : 'ACTIVATE EMERGENCY'}</span>
            </motion.button>
        </div>
    );
}

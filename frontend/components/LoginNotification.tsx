import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';

interface LoginNotificationProps {
    isVisible: boolean;
    userName?: string;
    authMethod?: 'wallet' | 'google';
    onDismiss: () => void;
}

export function LoginNotification({
    isVisible,
    userName = 'User',
    authMethod = 'wallet',
    onDismiss
}: LoginNotificationProps) {
    const [autoClose, setAutoClose] = useState(true);

    useEffect(() => {
        if (isVisible && autoClose) {
            const timer = setTimeout(onDismiss, 4000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, autoClose, onDismiss]);

    const authMethodLabel = authMethod === 'google' ? '🔐 Google Account' : '💰 Wallet';

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className="fixed top-24 left-1/2 -translate-x-1/2 z-[10000] pointer-events-auto"
                >
                    {/* Glow background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-cyber-blue/30 via-cyber-blue/20 to-cyber-blue/30 blur-2xl rounded-lg" />

                    {/* Main notification card */}
                    <div className="relative bg-surface/95 backdrop-blur-xl border border-cyber-blue/50 rounded-lg shadow-2xl shadow-cyber-blue/20 overflow-hidden">
                        {/* Top accent line */}
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyber-blue to-transparent" />

                        {/* Content */}
                        <div className="px-6 py-5 flex items-center gap-4">
                            {/* Check icon with animation */}
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
                                className="flex-shrink-0"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-cyber-blue/30 blur-lg rounded-full" />
                                    <CheckCircle className="w-8 h-8 text-cyber-blue relative z-10" strokeWidth={3} />
                                </div>
                            </motion.div>

                            {/* Text content */}
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.15 }}
                                className="flex-1 min-w-0"
                            >
                                <div className="text-sm font-display font-bold text-white uppercase tracking-wide">
                                    Logged In Successfully
                                </div>
                                <div className="text-xs text-white/70 mt-1">
                                    <span className="font-mono">{userName}</span>
                                    {' • '}
                                    <span className="text-cyber-blue">{authMethodLabel}</span>
                                </div>
                            </motion.div>

                            {/* Close button */}
                            <motion.button
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    setAutoClose(false);
                                    onDismiss();
                                }}
                                className="flex-shrink-0 p-1.5 hover:bg-cyber-blue/20 rounded transition-colors"
                            >
                                <X className="w-4 h-4 text-white/60 hover:text-white" strokeWidth={3} />
                            </motion.button>
                        </div>

                        {/* Right accent */}
                        <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-cyber-blue via-transparent to-transparent opacity-50" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

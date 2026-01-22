import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Github, Send, MessageCircle, X, Users, Handshake } from 'lucide-react';

const FacebookIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ContactFormData {
    name: string;
    message: string;
}

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
    const [formData, setFormData] = useState<ContactFormData>({ name: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const socialLinks = [
        { name: 'Telegram', icon: MessageCircle, url: 'https://t.me/dsuc', color: 'hover:text-blue-400 hover:border-blue-400/50' },
        { name: 'Facebook', icon: FacebookIcon, url: 'https://facebook.com/superteamdut.club', color: 'hover:text-blue-500 hover:border-blue-500/50' },
        { name: 'GitHub', icon: Github, url: 'https://github.com/DSUC-Project', color: 'hover:text-white hover:border-white/50' },
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('[ContactModal] Form submitted', { name: formData.name, messageLength: formData.message.length });

        if (!formData.name.trim() || !formData.message.trim()) {
            console.warn('[ContactModal] Validation failed - missing fields');
            setSubmitStatus('error');
            setTimeout(() => setSubmitStatus('idle'), 3000);
            return;
        }

        setIsLoading(true);
        const base = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:3001';
        console.log('[ContactModal] API endpoint:', base);

        try {
            console.log('[ContactModal] Sending POST request to /api/contact...');
            const response = await fetch(`${base}/api/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            console.log('[ContactModal] Response received:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
            });

            if (response.ok) {
                const data = await response.json();
                console.log('[ContactModal] ✓ Success response:', data);
                setSubmitStatus('success');
                setFormData({ name: '', message: '' });
                setTimeout(() => {
                    console.log('[ContactModal] Closing modal after success');
                    setSubmitStatus('idle');
                    onClose();
                }, 3500);
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('[ContactModal] ✗ Error response:', {
                    status: response.status,
                    error: errorData,
                });
                setSubmitStatus('error');
                setTimeout(() => setSubmitStatus('idle'), 3000);
            }
        } catch (error) {
            console.error('[ContactModal] ✗ Fetch error:', error);
            setSubmitStatus('error');
            setTimeout(() => setSubmitStatus('idle'), 3000);
        } finally {
            setIsLoading(false);
        }
    }; const handleClose = () => {
        setFormData({ name: '', message: '' });
        setSubmitStatus('idle');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={handleClose} />
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-surface border border-cyber-blue/50 p-6 w-full max-w-md cyber-clip-top shadow-[0_0_50px_rgba(41,121,255,0.15)]"
            >
                {/* Success Screen Overlay */}
                {submitStatus === 'success' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 bg-gradient-to-b from-green-900/30 to-green-900/10 backdrop-blur-sm rounded-none flex flex-col items-center justify-center z-50"
                    >
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                            className="text-5xl mb-4"
                        >
                            ✓
                        </motion.div>
                        <h4 className="text-xl font-display font-bold text-green-400 mb-2">Message Sent!</h4>
                        <p className="text-xs text-green-300/70 text-center px-4">We'll get back to you soon</p>
                    </motion.div>
                )}

                <button onClick={handleClose} className="absolute top-4 right-4 text-white/40 hover:text-white z-10">
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="text-center mb-5">
                    <h3 className="text-xl font-display font-bold text-white">Send us a message!</h3>
                    <p className="text-white/40 text-xs mt-1">We'd love to hear from you</p>
                </div>

                {/* Form (Main Feature) */}
                <form onSubmit={handleSubmit} className="space-y-3 mb-5">
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="What should we call you?"
                        className="w-full bg-black/30 border border-white/10 hover:border-cyber-blue/30 focus:border-cyber-blue px-3 py-2.5 text-white focus:outline-none text-sm transition-colors placeholder:text-white/30"
                        required
                        minLength={2}
                        maxLength={100}
                    />

                    <div className="relative">
                        <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            placeholder="Message"
                            className="w-full bg-black/30 border border-white/10 hover:border-cyber-blue/30 focus:border-cyber-blue px-3 py-2.5 text-white focus:outline-none text-sm transition-colors resize-none h-24 placeholder:text-white/30"
                            required
                            minLength={10}
                            maxLength={2000}
                        />
                        <span className="absolute bottom-2 right-3 text-[10px] text-white/20">{formData.message.length}/2000</span>
                    </div>

                    {/* Status */}
                    {submitStatus === 'success' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-2 bg-green-900/20 border border-green-500/30 text-green-400 text-xs text-center">
                            ✓ Message sent!
                        </motion.div>
                    )}
                    {submitStatus === 'error' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-2 bg-red-900/20 border border-red-500/30 text-red-400 text-xs text-center">
                            {formData.name && formData.message ? 'Failed to receive your message.' : 'Please fill in all fields.'}
                        </motion.div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-cyber-yellow text-black hover:bg-white font-bold py-2.5 flex items-center justify-center gap-2 transition-all uppercase tracking-wider text-xs disabled:opacity-50"
                    >
                        <Send size={14} />
                        {isLoading ? 'Sending...' : 'Send!'}
                    </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-white/30 text-[10px] uppercase tracking-wider">or connect via</span>
                    <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Social Links */}
                <div className="flex justify-center gap-2 mb-2">
                    {socialLinks.map((social) => {
                        const Icon = social.icon;
                        return (
                            <a
                                key={social.name}
                                href={social.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2 px-3 py-2 border border-white/10 bg-black/20 text-white/60 transition-all text-xs ${social.color}`}
                            >
                                <Icon size={16} />
                                <span className="font-medium">{social.name}</span>
                            </a>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-white/10 flex justify-center gap-4 text-[10px] text-white/30">
                    <div className="flex items-center gap-1">
                        <Handshake size={10} />
                        <span>Partnerships</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Users size={10} />
                        <span>Collaborations</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

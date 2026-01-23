import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Github, Send, MessageCircle, X, Users, Handshake, Linkedin } from 'lucide-react';
import { useStore } from '../store/useStore';

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
    const [errorMessage, setErrorMessage] = useState('');

    const { members } = useStore();
    const president = members.find(m => m.role === 'President');

    const socialLinks = [
        { name: 'Telegram', icon: MessageCircle, url: 'https://t.me/dsuc', color: 'hover:text-blue-400 hover:border-blue-400/50' },
        {
            name: 'X', icon: () => (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
            ), url: 'https://x.com/superteamdut', color: 'hover:text-white hover:border-white/50'
        },
        { name: 'Facebook', icon: FacebookIcon, url: 'https://facebook.com/superteamdut.club', color: 'hover:text-blue-500 hover:border-blue-500/50' },
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('[ContactModal] Form submitted', { name: formData.name, messageLength: formData.message.length });

        if (!formData.name.trim() || !formData.message.trim()) {
            console.warn('[ContactModal] Validation failed - missing fields');
            setErrorMessage('Please fill in your name and message');
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

                // Set specific error messages based on status code
                if (response.status === 429) {
                    setErrorMessage('Too many messages. Please wait an hour before sending another.');
                } else if (response.status === 400) {
                    setErrorMessage('Invalid message. Please check your input.');
                } else if (response.status === 500) {
                    setErrorMessage('Server error. Please try again later.');
                } else {
                    setErrorMessage('Failed to send your message. Please try again.');
                }

                setSubmitStatus('error');
                setTimeout(() => setSubmitStatus('idle'), 4000);
            }
        } catch (error) {
            console.error('[ContactModal] ✗ Fetch error:', error);
            setErrorMessage('Network error. Please check your connection and try again.');
            setSubmitStatus('error');
            setTimeout(() => setSubmitStatus('idle'), 4000);
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
                className="relative bg-surface border border-cyber-blue/50 w-full max-w-4xl cyber-clip-top shadow-[0_0_50px_rgba(41,121,255,0.15)] max-h-[90vh] overflow-y-auto flex flex-col md:flex-row overflow-hidden"
            >
                {/* President Profile - Left Panel */}
                {president && (
                    <div className="w-full md:w-80 relative bg-black/40 border-b md:border-b-0 md:border-r border-white/10 flex flex-col">
                        <div className="absolute inset-0 bg-gradient-to-b from-cyber-blue/5 to-transparent opacity-50" />

                        <div className="relative z-10 p-8 flex flex-col h-full justify-center">
                            <div className="w-full aspect-square mb-6 relative group cursor-pointer">
                                <div className="absolute inset-0 bg-cyber-blue/20 blur-xl opacity-20" />
                                <div className="relative h-full w-full rounded-xl overflow-hidden border border-white/10 group-hover:border-cyber-blue/50 transition-colors bg-surface-dark">
                                    <img
                                        src={president.avatar}
                                        alt={president.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>

                            <div className="text-center">
                                <h4 className="text-2xl font-display font-bold text-white mb-2 group-hover:text-cyber-blue transition-colors">
                                    {president.name}
                                </h4>
                                <div className="h-0.5 w-12 bg-cyber-blue/50 mx-auto mb-4" />

                                <div className="flex justify-center gap-4">
                                    {president.socials?.telegram && (
                                        <a
                                            href={president.socials.telegram}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all hover:scale-110"
                                        >
                                            <MessageCircle size={18} />
                                        </a>
                                    )}
                                    {president.socials?.twitter && (
                                        <a
                                            href={president.socials.twitter}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all hover:scale-110"
                                        >
                                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                            </svg>
                                        </a>
                                    )}
                                    {president.socials?.facebook && (
                                        <a
                                            href={president.socials.facebook}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all hover:scale-110"
                                        >
                                            <FacebookIcon />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Contact Form - Right Panel */}
                <div className="flex-1 p-8 relative">
                    {/* Success Screen Overlay */}
                    {submitStatus === 'success' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-50 backdrop-blur-md"
                        >
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                                className="text-6xl mb-6 text-green-400"
                            >
                                ✓
                            </motion.div>
                            <motion.h4
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-2xl font-display font-bold text-white mb-2"
                            >
                                Message Sent!
                            </motion.h4>
                            <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-sm text-white/60 text-center px-4"
                            >
                                We'll get back to you soon
                            </motion.p>
                        </motion.div>
                    )}

                    <button onClick={handleClose} className="absolute top-4 right-4 text-white/40 hover:text-white z-10 p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <h3 className="text-xl font-display font-bold text-white">Send us a message!</h3>
                        <p className="text-white/40 text-xs mt-1">We'd love to hear from you</p>
                    </div>

                    {/* Form (Main Feature) */}
                    <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                        <div className="space-y-1">
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="What should we call you?"
                                className="w-full bg-black/30 border border-white/10 hover:border-cyber-blue/30 focus:border-cyber-blue px-4 py-3 text-white focus:outline-none text-sm transition-all placeholder:text-white/20 rounded-lg"
                                required
                                minLength={2}
                                maxLength={100}
                            />
                        </div>

                        <div className="relative space-y-1">
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="How can we help?"
                                className="w-full bg-black/30 border border-white/10 hover:border-cyber-blue/30 focus:border-cyber-blue px-4 py-3 text-white focus:outline-none text-sm transition-all resize-none h-40 placeholder:text-white/20 rounded-lg"
                                required
                                minLength={10}
                                maxLength={2000}
                            />
                            <span className="absolute bottom-3 right-3 text-[10px] text-white/20">{formData.message.length}/2000</span>
                        </div>

                        {/* Status */}
                        {submitStatus === 'error' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-red-900/20 border border-red-500/30 text-red-400 text-xs text-center rounded">
                                {errorMessage}
                            </motion.div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-cyber-yellow text-black hover:bg-white font-bold py-3 flex items-center justify-center gap-2 transition-all uppercase tracking-wider text-xs disabled:opacity-50 rounded-lg active:scale-95"
                        >
                            <Send size={14} />
                            {isLoading ? 'Sending...' : 'Send Message'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-6 opacity-60">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-white/30 text-[10px] uppercase tracking-wider">or connect via</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Social Links */}
                    {/* Social Links */}
                    <div className="flex justify-center gap-4 mb-6">
                        {socialLinks.map((social) => {
                            const Icon = social.icon;
                            return (
                                <a
                                    key={social.name}
                                    href={social.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all hover:scale-110 ${social.color}`}
                                >
                                    <Icon size={18} />
                                </a>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t border-white/10 flex justify-center gap-6 text-[10px] text-white/30">
                        <div className="flex items-center gap-1.5 hover:text-white/50 transition-colors cursor-help">
                            <Handshake size={12} />
                            <span>Partnerships</span>
                        </div>
                        <div className="flex items-center gap-1.5 hover:text-white/50 transition-colors cursor-help">
                            <Users size={12} />
                            <span>Collaborations</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

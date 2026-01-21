import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Github, Send, MessageCircle, ExternalLink } from 'lucide-react';

const FacebookIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

interface ContactFormData {
    name: string;
    message: string;
}

export function Contact() {
    const [formData, setFormData] = useState<ContactFormData>({ name: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const socialLinks = [
        {
            name: 'Telegram',
            handle: '@dsuc_community',
            icon: MessageCircle,
            url: 'https://t.me/dsuc',
            color: 'text-blue-400',
        },
        {
            name: 'Facebook',
            handle: 'DSUC Official',
            icon: FacebookIcon,
            url: 'https://facebook.com/superteamdut.club',
            color: 'text-blue-500',
        },
        {
            name: 'GitHub',
            handle: 'DSUC-Project',
            icon: Github,
            url: 'https://github.com/DSUC-Project',
            color: 'text-white',
        },
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.message.trim()) {
            setSubmitStatus('error');
            setTimeout(() => setSubmitStatus('idle'), 3000);
            return;
        }

        setIsLoading(true);
        try {
            const base = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:3001';
            const response = await fetch(`${base}/api/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setSubmitStatus('success');
                setFormData({ name: '', message: '' });
                setTimeout(() => setSubmitStatus('idle'), 5000);
            } else {
                setSubmitStatus('error');
                setTimeout(() => setSubmitStatus('idle'), 3000);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            setSubmitStatus('error');
            setTimeout(() => setSubmitStatus('idle'), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)] flex items-center">
            <div className="w-full max-w-6xl mx-auto">
                {/* Compact Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    <h1 className="text-3xl font-display font-bold mb-1 text-white">Contact</h1>
                    <p className="text-white/50 font-mono text-xs">Get in touch for collaborations or questions</p>
                </motion.div>

                {/* Main Three Column Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* Left: Social Links */}
                    <motion.div
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="cyber-card p-4 bg-surface/50 border border-cyber-blue/20"
                    >
                        <h2 className="text-sm font-display font-bold text-white mb-3 flex items-center gap-2">
                            <span className="w-1 h-4 bg-cyber-blue" />
                            Connect
                        </h2>

                        <div className="space-y-2">
                            {socialLinks.map((social) => {
                                const Icon = social.icon;
                                return (
                                    <a
                                        key={social.name}
                                        href={social.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-2 border border-white/5 hover:bg-white/5 transition-all group text-xs"
                                    >
                                        <div className={`${social.color}`}>
                                            <Icon size={14} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white text-[11px]">{social.name}</p>
                                            <p className="text-[10px] text-white/40 truncate">{social.handle}</p>
                                        </div>
                                        <ExternalLink size={12} className="text-white/20 group-hover:text-cyber-yellow transition-colors flex-shrink-0" />
                                    </a>
                                );
                            })}
                        </div>

                        {/* Quick Info */}
                        <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                            <div>
                                <p className="text-[10px] text-cyber-blue font-bold uppercase">Response</p>
                                <p className="text-[10px] text-white/60">24-48 hours</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Middle: Message Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="cyber-card p-4 bg-surface/50 border border-cyber-blue/20 md:col-span-2"
                    >
                        <h2 className="text-sm font-display font-bold text-white mb-3 flex items-center gap-2">
                            <span className="w-1 h-4 bg-cyber-yellow" />
                            Send Message
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-2.5">
                            {/* Name and Message in two columns on desktop */}
                            <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                    <label className="text-[9px] font-mono text-white/40 uppercase tracking-wider block mb-1">Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Your name"
                                        className="w-full bg-black/30 border border-white/10 hover:border-cyber-blue/30 focus:border-cyber-blue px-2 py-1.5 text-white focus:outline-none font-mono text-xs transition-colors"
                                        required
                                        minLength={2}
                                        maxLength={100}
                                    />
                                </div>

                                <div>
                                    <label className="text-[9px] font-mono text-white/40 uppercase tracking-wider block mb-1">Count</label>
                                    <div className="text-xs text-white/60 font-mono pt-1">
                                        {formData.message.length}/2000
                                    </div>
                                </div>
                            </div>

                            {/* Message textarea spans full width */}
                            <div>
                                <label className="text-[9px] font-mono text-white/40 uppercase tracking-wider block mb-1">Message</label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder="What would you like to discuss?"
                                    className="w-full bg-black/30 border border-white/10 hover:border-cyber-blue/30 focus:border-cyber-blue px-2 py-1.5 text-white focus:outline-none font-mono text-xs transition-colors resize-none h-16"
                                    required
                                    minLength={10}
                                    maxLength={2000}
                                />
                            </div>

                            {/* Status Messages */}
                            {submitStatus === 'success' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-2 bg-green-900/20 border border-green-500/30 text-green-400 text-xs font-mono"
                                >
                                    ✅ Message sent! We'll be in touch.
                                </motion.div>
                            )}

                            {submitStatus === 'error' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-2 bg-red-900/20 border border-red-500/30 text-red-400 text-xs font-mono"
                                >
                                    ❌ {formData.name && formData.message ? 'Error sending. Try again.' : 'Fill in all fields.'}
                                </motion.div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-cyber-yellow text-black hover:bg-white font-display font-bold text-xs px-4 py-2 flex items-center justify-center gap-2 transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send size={12} />
                                {isLoading ? 'Sending...' : 'Send'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

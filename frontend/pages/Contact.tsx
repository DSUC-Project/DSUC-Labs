import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Github, Send, MessageCircle, ExternalLink, Clock, Users, Lightbulb, Handshake } from 'lucide-react';

const FacebookIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
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
        { name: 'Telegram', handle: '@dsuc_community', icon: MessageCircle, url: 'https://t.me/dsuc', color: 'hover:text-blue-400 hover:border-blue-400/50' },
        { name: 'Facebook', handle: 'DSUC Official', icon: FacebookIcon, url: 'https://facebook.com/superteamdut.club', color: 'hover:text-blue-500 hover:border-blue-500/50' },
        { name: 'GitHub', handle: 'DSUC-Project', icon: Github, url: 'https://github.com/DSUC-Project', color: 'hover:text-white hover:border-white/50' },
    ];

    const interests = [
        { icon: Handshake, label: 'Partnerships' },
        { icon: Users, label: 'Collaborations' },
        { icon: Lightbulb, label: 'Project Ideas' },
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
        } catch {
            setSubmitStatus('error');
            setTimeout(() => setSubmitStatus('idle'), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-280px)] flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-display font-bold text-white mb-2">Get In Touch</h1>
                    <p className="text-white/50 text-sm">We'd love to hear from you</p>
                </div>

                {/* Main Card */}
                <div className="cyber-card bg-surface/60 border border-cyber-blue/20 p-6 md:p-8">

                    {/* Social Links Row */}
                    <div className="flex justify-center gap-3 mb-6">
                        {socialLinks.map((social) => {
                            const Icon = social.icon;
                            return (
                                <a
                                    key={social.name}
                                    href={social.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-2 px-4 py-2 border border-white/10 bg-black/20 text-white/60 transition-all ${social.color}`}
                                    title={social.handle}
                                >
                                    <Icon size={18} />
                                    <span className="text-sm font-medium hidden sm:inline">{social.name}</span>
                                </a>
                            );
                        })}
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-white/30 text-xs uppercase tracking-wider">or send a message</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Your name"
                                className="w-full bg-black/30 border border-white/10 hover:border-cyber-blue/30 focus:border-cyber-blue px-4 py-3 text-white focus:outline-none text-sm transition-colors placeholder:text-white/30"
                                required
                                minLength={2}
                                maxLength={100}
                            />
                        </div>

                        <div className="relative">
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="What would you like to discuss?"
                                className="w-full bg-black/30 border border-white/10 hover:border-cyber-blue/30 focus:border-cyber-blue px-4 py-3 text-white focus:outline-none text-sm transition-colors resize-none h-28 placeholder:text-white/30"
                                required
                                minLength={10}
                                maxLength={2000}
                            />
                            <span className="absolute bottom-2 right-3 text-[10px] text-white/20">{formData.message.length}/2000</span>
                        </div>

                        {/* Status */}
                        {submitStatus === 'success' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-green-900/20 border border-green-500/30 text-green-400 text-sm text-center">
                                ✓ Message sent! We'll respond within 24-48 hours.
                            </motion.div>
                        )}
                        {submitStatus === 'error' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-red-900/20 border border-red-500/30 text-red-400 text-sm text-center">
                                {formData.name && formData.message ? 'Failed to send. Please try again.' : 'Please fill in all fields.'}
                            </motion.div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-cyber-yellow text-black hover:bg-white font-bold py-3 flex items-center justify-center gap-2 transition-all uppercase tracking-wider text-sm disabled:opacity-50"
                        >
                            <Send size={16} />
                            {isLoading ? 'Sending...' : 'Send Message'}
                        </button>
                    </form>

                    {/* Footer Info */}
                    <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap justify-center gap-6 text-xs text-white/40">
                        <div className="flex items-center gap-1.5">
                            <Clock size={12} />
                            <span>Response: 24-48h</span>
                        </div>
                        {interests.map((item) => (
                            <div key={item.label} className="flex items-center gap-1.5">
                                <item.icon size={12} />
                                <span>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

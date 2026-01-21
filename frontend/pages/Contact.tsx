import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Github, Send, MessageCircle, ExternalLink } from 'lucide-react';

// Facebook icon component (lucide doesn't have the exact one)
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

    // Social links configuration
    const socialLinks = [
        {
            name: 'Telegram',
            handle: '@dsuc_community',
            icon: MessageCircle,
            url: 'https://t.me/dsuc',
            color: 'text-blue-400',
            hoverBg: 'hover:bg-blue-500/10',
        },
        {
            name: 'Facebook',
            handle: 'DSUC Official',
            icon: FacebookIcon,
            url: 'https://facebook.com/superteamdut.club',
            color: 'text-blue-500',
            hoverBg: 'hover:bg-blue-600/10',
        },
        {
            name: 'GitHub',
            handle: 'DSUC-Project',
            icon: Github,
            url: 'https://github.com/DSUC-Project',
            color: 'text-white',
            hoverBg: 'hover:bg-white/10',
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
        <div className="max-w-6xl mx-auto pb-10">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
            >
                <h1 className="text-4xl font-display font-bold mb-2 text-white">Contact</h1>
                <p className="text-white/50 font-mono text-sm">
                    Get in touch for collaborations, partnerships, or questions.
                </p>
            </motion.div>

            {/* Main Content - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                {/* Left Side - Contact Info */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 space-y-6"
                >
                    {/* Quick Contact */}
                    <div className="cyber-card p-6 bg-surface/50 border border-cyber-blue/20">
                        <h2 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-cyber-blue" />
                            Quick Contact
                        </h2>

                        <div className="space-y-3">
                            {socialLinks.map((social) => {
                                const Icon = social.icon;
                                return (
                                    <a
                                        key={social.name}
                                        href={social.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex items-center gap-3 p-3 border border-white/5 ${social.hoverBg} transition-all group`}
                                    >
                                        <div className={`${social.color}`}>
                                            <Icon />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white">{social.name}</p>
                                            <p className="text-xs text-white/50 font-mono truncate">{social.handle}</p>
                                        </div>
                                        <ExternalLink size={14} className="text-white/30 group-hover:text-cyber-yellow transition-colors" />
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    {/* Info Cards */}
                    <div className="cyber-card p-6 bg-surface/50 border border-cyber-blue/20">
                        <h3 className="text-sm font-display font-bold text-cyber-blue mb-2">Response Time</h3>
                        <p className="text-xs text-white/60 font-mono leading-relaxed">
                            We typically respond within 24-48 hours. For urgent matters, use Telegram.
                        </p>
                    </div>

                    <div className="cyber-card p-6 bg-surface/50 border border-cyber-blue/20">
                        <h3 className="text-sm font-display font-bold text-cyber-blue mb-2">We're Open To</h3>
                        <ul className="text-xs text-white/60 font-mono space-y-1">
                            <li>• Collaboration & partnerships</li>
                            <li>• Project contributions</li>
                            <li>• Sponsorship inquiries</li>
                            <li>• General feedback</li>
                        </ul>
                    </div>
                </motion.div>

                {/* Right Side - Message Form */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-3"
                >
                    <div className="cyber-card p-6 bg-surface/50 border border-cyber-blue/20 h-full">
                        <h2 className="text-lg font-display font-bold text-white mb-1 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-cyber-yellow" />
                            Send a Message
                        </h2>
                        <p className="text-xs text-white/50 font-mono mb-6">
                            Fill out the form and we'll get back to you.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name Field */}
                            <div>
                                <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-1.5 block">
                                    Your Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter your name"
                                    className="w-full bg-black/30 border border-white/10 hover:border-cyber-blue/30 focus:border-cyber-blue px-3 py-2.5 text-white focus:outline-none font-mono text-sm transition-colors"
                                    required
                                    minLength={2}
                                    maxLength={100}
                                />
                            </div>

                            {/* Message Field */}
                            <div>
                                <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-1.5 block">
                                    Message
                                </label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder="What would you like to discuss?"
                                    className="w-full bg-black/30 border border-white/10 hover:border-cyber-blue/30 focus:border-cyber-blue px-3 py-2.5 text-white focus:outline-none font-mono text-sm transition-colors resize-none h-40"
                                    required
                                    minLength={10}
                                    maxLength={2000}
                                />
                                <p className="text-[10px] text-white/30 font-mono mt-1 text-right">
                                    {formData.message.length}/2000
                                </p>
                            </div>

                            {/* Status Messages */}
                            {submitStatus === 'success' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3 bg-green-900/20 border border-green-500/30 text-green-400 text-xs font-mono"
                                >
                                    ✅ Message sent! We'll be in touch soon.
                                </motion.div>
                            )}

                            {submitStatus === 'error' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3 bg-red-900/20 border border-red-500/30 text-red-400 text-xs font-mono"
                                >
                                    ❌ {formData.name && formData.message ? 'Error sending. Please try again.' : 'Please fill in all fields.'}
                                </motion.div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-cyber-yellow text-black hover:bg-white font-display font-bold text-xs px-6 py-3 flex items-center justify-center gap-2 transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send size={14} />
                                {isLoading ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

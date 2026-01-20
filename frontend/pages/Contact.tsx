import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Github, Send, MessageCircle, Facebook } from 'lucide-react';

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
            icon: MessageCircle,
            url: 'https://t.me/dsuc',
            color: 'from-blue-400 to-blue-600',
            hoverColor: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]'
        },
        {
            name: 'Facebook',
            icon: Facebook,
            url: 'https://facebook.com/dsuc',
            color: 'from-blue-600 to-blue-800',
            hoverColor: 'hover:shadow-[0_0_20px_rgba(37,99,235,0.5)]'
        },
        {
            name: 'GitHub',
            icon: Github,
            url: 'https://github.com/dsuc',
            color: 'from-gray-700 to-gray-900',
            hoverColor: 'hover:shadow-[0_0_20px_rgba(55,65,81,0.5)]'
        },
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
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
        <div className="max-w-4xl mx-auto space-y-12 pb-10">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <h1 className="text-5xl font-display font-bold mb-3 text-white">
                    Get in <span className="text-cyber-blue">Touch</span>
                </h1>
                <p className="text-white/60 font-mono text-sm max-w-2xl mx-auto">
                    Interested in collaboration, partnerships, or just want to say hello?
                    Reach out through any of our channels below.
                </p>
            </motion.div>

            {/* Social Links */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
                {socialLinks.map((social) => {
                    const Icon = social.icon;
                    return (
                        <a
                            key={social.name}
                            href={social.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`cyber-card p-8 bg-surface/50 border border-cyber-blue/20 group cursor-pointer transition-all duration-300 ${social.hoverColor}`}
                        >
                            <div className="flex flex-col items-center gap-4">
                                <div className={`p-4 rounded-lg bg-gradient-to-br ${social.color} group-hover:scale-110 transition-transform`}>
                                    <Icon className="w-8 h-8 text-white" />
                                </div>
                                <div className="text-center">
                                    <h3 className="font-display font-bold text-white mb-1">{social.name}</h3>
                                    <p className="text-xs text-white/60 font-mono">Connect with us</p>
                                </div>
                                <div className="flex items-center gap-1 text-cyber-yellow text-xs group-hover:translate-x-1 transition-transform">
                                    <span>Visit</span>
                                    <Mail size={12} />
                                </div>
                            </div>
                        </a>
                    );
                })}
            </motion.div>

            {/* Divider */}
            <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.2 }}
                className="h-[1px] bg-gradient-to-r from-transparent via-cyber-blue/50 to-transparent"
            />

            {/* Contact Form */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="cyber-card p-8 bg-surface/50 border border-cyber-blue/20"
            >
                <div className="mb-6">
                    <h2 className="text-2xl font-display font-bold text-white mb-2 flex items-center gap-2">
                        <span className="w-2 h-6 bg-cyber-blue block" />
                        Send us a Message
                    </h2>
                    <p className="text-white/60 text-sm font-mono">
                        Fill in your details and we'll get back to you as soon as possible.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name Field */}
                    <div className="space-y-2">
                        <label className="text-xs font-mono text-cyber-yellow uppercase tracking-wider flex items-center gap-2">
                            <span className="w-1 h-3 bg-cyber-yellow" />
                            Your Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Who are you?"
                            className="w-full bg-black/50 border border-white/10 hover:border-cyber-blue/30 focus:border-cyber-blue p-3 text-white focus:outline-none font-mono text-sm transition-colors"
                            required
                            minLength={2}
                            maxLength={100}
                        />
                    </div>

                    {/* Message Field */}
                    <div className="space-y-2">
                        <label className="text-xs font-mono text-cyber-yellow uppercase tracking-wider flex items-center gap-2">
                            <span className="w-1 h-3 bg-cyber-yellow" />
                            Message
                        </label>
                        <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            placeholder="Tell us what you're thinking..."
                            className="w-full bg-black/50 border border-white/10 hover:border-cyber-blue/30 focus:border-cyber-blue p-3 text-white focus:outline-none font-mono text-sm transition-colors resize-none h-32"
                            required
                            minLength={10}
                            maxLength={2000}
                        />
                        <p className="text-xs text-white/40 font-mono">
                            {formData.message.length}/2000
                        </p>
                    </div>

                    {/* Status Messages */}
                    {submitStatus === 'success' && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-green-900/20 border border-green-500/30 rounded text-green-400 text-sm font-mono"
                        >
                            ✅ Message sent successfully! We'll be in touch soon.
                        </motion.div>
                    )}

                    {submitStatus === 'error' && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-red-900/20 border border-red-500/30 rounded text-red-400 text-sm font-mono"
                        >
                            ❌ {formData.name && formData.message ? 'Error sending message. Please try again.' : 'Please fill in all fields.'}
                        </motion.div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-cyber-yellow text-black hover:bg-white font-display font-bold text-sm px-6 py-3 cyber-button flex items-center justify-center gap-2 transition-all uppercase tracking-widest shadow-[0_0_15px_rgba(255,214,0,0.3)] hover:shadow-[0_0_25px_rgba(255,214,0,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={16} />
                        {isLoading ? 'Sending...' : 'Send Message'}
                    </button>
                </form>
            </motion.div>

            {/* Info Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
                <div className="cyber-card p-6 bg-surface/50 border border-cyber-blue/20">
                    <h3 className="text-lg font-display font-bold text-cyber-blue mb-3">Response Time</h3>
                    <p className="text-sm text-white/70 font-mono">
                        We typically respond to all inquiries within 24-48 hours. For urgent matters, please use our Telegram channel.
                    </p>
                </div>

                <div className="cyber-card p-6 bg-surface/50 border border-cyber-blue/20">
                    <h3 className="text-lg font-display font-bold text-cyber-blue mb-3">What We're Looking For</h3>
                    <p className="text-sm text-white/70 font-mono">
                        We welcome collaboration ideas, partnership proposals, contributions, and constructive feedback.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

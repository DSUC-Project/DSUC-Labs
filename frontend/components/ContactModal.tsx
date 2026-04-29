import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageCircle, X, Users, Handshake } from 'lucide-react';
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
        { name: 'Telegram', icon: MessageCircle, url: 'https://t.me/dsuc', color: 'hover:bg-brutal-blue hover:text-white' },
        {
            name: 'X', icon: () => (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
            ), url: 'https://x.com/superteamdut', color: 'hover:bg-brutal-black hover:text-white'
        },
        { name: 'Facebook', icon: FacebookIcon, url: 'https://facebook.com/superteamdut.club', color: 'hover:bg-brutal-pink hover:text-brutal-black' },
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
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
                className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden border-4 border-brutal-black bg-white shadow-neo-xl md:flex-row"
            >
                {submitStatus === 'success' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-brutal-green/95 p-6 text-center"
                    >
                        <div className="mb-6 flex h-20 w-20 items-center justify-center border-4 border-brutal-black bg-white text-brutal-black shadow-neo">
                            <Send size={34} strokeWidth={3} />
                        </div>
                        <h4 className="font-display text-3xl font-black uppercase tracking-tight text-brutal-black">
                            Tin nhắn đã được gửi
                        </h4>
                        <p className="mt-3 max-w-md border-4 border-brutal-black bg-white px-4 py-3 text-sm font-bold text-brutal-black shadow-neo-sm">
                            DSUC đã nhận được liên hệ của bạn. Chúng tôi sẽ phản hồi sớm nhất có thể.
                        </p>
                    </motion.div>
                )}

                {president && (
                    <div className="relative flex w-full flex-col border-b-4 border-brutal-black bg-brutal-yellow md:w-[340px] md:border-b-0 md:border-r-4">
                        <div className="p-8">
                            <div className="mb-6 inline-flex items-center gap-2 border-4 border-brutal-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-brutal-black shadow-neo-sm">
                                <Handshake size={14} />
                                Liên hệ trực tiếp
                            </div>
                            <div className="border-4 border-brutal-black bg-white p-4 shadow-neo">
                                <div className="aspect-square overflow-hidden border-4 border-brutal-black bg-brutal-pink">
                                    <img
                                        src={president.avatar}
                                        alt={president.name}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            </div>
                            <div className="mt-6">
                                <h4 className="font-display text-3xl font-black uppercase tracking-tight text-brutal-black">
                                    {president.name}
                                </h4>
                                <p className="mt-3 inline-block border-2 border-brutal-black bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-brutal-black shadow-neo-sm">
                                    {president.role || 'President'}
                                </p>
                            </div>

                            <div className="mt-6 grid grid-cols-3 gap-3">
                                {president.socials?.telegram && (
                                    <a href={president.socials.telegram} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center border-4 border-brutal-black bg-white text-brutal-black shadow-neo-sm transition-all hover:-translate-y-1 hover:bg-brutal-blue hover:text-white">
                                        <MessageCircle size={18} />
                                    </a>
                                )}
                                {president.socials?.twitter && (
                                    <a href={president.socials.twitter} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center border-4 border-brutal-black bg-white text-brutal-black shadow-neo-sm transition-all hover:-translate-y-1 hover:bg-brutal-black hover:text-white">
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                        </svg>
                                    </a>
                                )}
                                {president.socials?.facebook && (
                                    <a href={president.socials.facebook} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center border-4 border-brutal-black bg-white text-brutal-black shadow-neo-sm transition-all hover:-translate-y-1 hover:bg-brutal-pink hover:text-brutal-black">
                                        <FacebookIcon />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="relative flex-1 overflow-y-auto p-8 brutal-scrollbar">
                    <button onClick={handleClose} className="absolute right-5 top-5 border-2 border-transparent p-2 text-brutal-black transition-colors hover:border-brutal-black hover:bg-brutal-yellow">
                        <X size={20} />
                    </button>

                    <div className="mb-8">
                        <div className="mb-3 inline-flex items-center gap-2 border-4 border-brutal-black bg-brutal-blue px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-neo-sm">
                            <Users size={14} />
                            DSUC Contact
                        </div>
                        <h3 className="font-display text-4xl font-black uppercase tracking-tight text-brutal-black">
                            Liên hệ với chúng tôi
                        </h3>
                        <p className="mt-4 border-l-4 border-brutal-pink pl-4 text-sm font-bold text-brutal-black">
                            Gửi tin nhắn để hỏi về sự kiện, partnership, collaboration hoặc bất kỳ điều gì bạn muốn trao đổi với DSUC.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="ml-1 text-xs font-black uppercase tracking-widest text-brutal-black">Tên của bạn</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Ví dụ: Danh"
                                className="w-full border-4 border-brutal-black bg-white px-4 py-3 text-sm font-bold text-brutal-black outline-none transition-colors focus:bg-brutal-yellow/20"
                                required
                                minLength={2}
                                maxLength={100}
                            />
                        </div>

                        <div className="relative space-y-2">
                            <label className="ml-1 text-xs font-black uppercase tracking-widest text-brutal-black">Nội dung</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="Bạn cần DSUC hỗ trợ gì?"
                                className="h-40 w-full resize-none border-4 border-brutal-black bg-white px-4 py-3 pr-16 text-sm font-bold text-brutal-black outline-none transition-colors focus:bg-brutal-yellow/20"
                                required
                                minLength={10}
                                maxLength={2000}
                            />
                            <span className="absolute bottom-4 right-4 border-2 border-brutal-black bg-white px-2 py-1 text-[10px] font-black uppercase tracking-widest text-gray-500 shadow-neo-sm">
                                {formData.message.length}/2000
                            </span>
                        </div>

                        {submitStatus === 'error' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-4 border-brutal-black bg-brutal-red px-4 py-3 text-center text-xs font-black uppercase tracking-widest text-white shadow-neo-sm">
                                {errorMessage}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex min-h-14 w-full items-center justify-center gap-3 border-4 border-brutal-black bg-brutal-yellow px-6 py-4 text-sm font-black uppercase tracking-widest text-brutal-black shadow-neo transition-all hover:-translate-y-1 hover:bg-brutal-blue hover:text-white hover:shadow-neo-lg disabled:opacity-50"
                        >
                            <Send size={16} />
                            {isLoading ? 'Đang gửi...' : 'Gửi tin nhắn'}
                        </button>
                    </form>

                    <div className="mt-8 border-t-4 border-brutal-black pt-6">
                        <div className="mb-4 text-[10px] font-black uppercase tracking-widest text-brutal-black">
                            Hoặc kết nối qua mạng xã hội
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {socialLinks.map((social) => {
                                const Icon = social.icon;
                                return (
                                    <a
                                        key={social.name}
                                        href={social.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex min-h-12 items-center gap-2 border-4 border-brutal-black bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-brutal-black shadow-neo-sm transition-all hover:-translate-y-1 ${social.color}`}
                                    >
                                        <Icon size={18} />
                                        {social.name}
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Github, Twitter, Send, Shield, Globe, Facebook, X, Mail } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Member } from '../types';

export function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { members } = useStore();
  const [showContactPopup, setShowContactPopup] = useState(false);

  const mockMembers: Member[] = [
    { id: 'mock-1', name: 'Zah', avatar: 'https://i.pravatar.cc/150?img=11', memberType: 'member', role: 'Chủ tịch', skills: ['Lãnh đạo', 'Rust', 'Blockchain'], socials: { github: 'zah', twitter: 'zah' }, streak: 84 },
    { id: 'mock-2', name: 'Neo', avatar: 'https://i.pravatar.cc/150?img=12', memberType: 'member', role: 'Solana Dev', skills: ['Solana', 'Anchor', 'Rust'], socials: { github: 'neo' }, streak: 62 },
    { id: 'mock-5', name: 'Cypher', avatar: 'https://i.pravatar.cc/150?img=15', memberType: 'community', role: 'Frontend', skills: ['React', 'TypeScript', 'Tailwind'], socials: { twitter: 'cypher' }, streak: 55 },
  ];

  const displayMembers = members.length > 0 ? members : mockMembers;

  const member = displayMembers.find(m => m.id === id) || {
    id: id || 'mock-id',
    name: 'Người dùng ' + (id?.substring(0,4) || 'X'),
    avatar: `https://i.pravatar.cc/150?u=${id}`,
    role: 'Thành viên',
    memberType: 'community',
    skills: [],
    socials: {},
    streak: 0
  };

  const isCommunity = member?.memberType === 'community';

  if (!member) {
    return <div className="text-slate-800 text-center pt-20 font-medium">Không tìm thấy thành viên</div>;
  }

  const handleContactSelect = (platform: string, url: string) => {
    window.open(url, '_blank');
    setShowContactPopup(false);
  };

  return (
    <div className="max-w-6xl mx-auto pt-10 px-4 sm:px-6 pb-20">
      <button
        onClick={() => navigate('/members')}
        className="mb-8 flex items-center gap-2 text-brutal-black hover:bg-brutal-yellow transition-colors font-black text-xs uppercase tracking-widest px-4 py-3 bg-white border-4 border-brutal-black shadow-neo-sm hover:shadow-neo brutal-btn w-fit"
      >
        <ArrowLeft size={20} /> Quay lại danh sách
      </button>

      {/* Contact Popup */}
      <AnimatePresence>
        {showContactPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brutal-black/80 backdrop-blur-sm"
              onClick={() => setShowContactPopup(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white p-8 shadow-neo-lg border-4 border-brutal-black max-w-sm w-full brutal-card"
            >
              <button
                onClick={() => setShowContactPopup(false)}
                className="absolute top-6 right-6 text-brutal-black bg-brutal-pink hover:bg-brutal-yellow p-2 border-4 border-brutal-black shadow-neo-sm transition-colors brutal-btn"
              >
                <X size={24} strokeWidth={3} />
              </button>

              <h2 className="text-2xl font-display font-black text-brutal-black mb-6 border-b-4 border-brutal-black pb-4 uppercase tracking-tighter">
                Kết nối
              </h2>

              <div className="space-y-4">
                {member.email && (
                  <button onClick={() => handleContactSelect('email', `mailto:${member.email}`)} className="w-full flex items-center gap-4 bg-white hover:bg-brutal-yellow border-4 border-brutal-black p-4 transition-all group shadow-neo-sm brutal-btn">
                    <Mail className="text-brutal-black group-hover:scale-110 transition-transform" size={24} />
                    <span className="font-black text-sm text-brutal-black uppercase tracking-wider">Email</span>
                  </button>
                )}
                {member.socials?.telegram && (
                  <button onClick={() => handleContactSelect('telegram', member.socials.telegram!.startsWith('http') ? member.socials.telegram! : `https://t.me/${member.socials.telegram}`)} className="w-full flex items-center gap-4 bg-white hover:bg-brutal-blue hover:text-white border-4 border-brutal-black p-4 transition-all group shadow-neo-sm brutal-btn">
                    <Send className="text-brutal-black group-hover:text-white group-hover:scale-110 transition-transform" size={24} />
                    <span className="font-black text-sm uppercase tracking-wider text-brutal-black group-hover:text-white">Telegram</span>
                  </button>
                )}
                {member.socials?.twitter && (
                  <button onClick={() => handleContactSelect('twitter', member.socials.twitter!.startsWith('http') ? member.socials.twitter! : `https://x.com/${member.socials.twitter}`)} className="w-full flex items-center gap-4 bg-white hover:bg-brutal-black hover:text-white border-4 border-brutal-black p-4 transition-all group shadow-neo-sm brutal-btn">
                    <Twitter className="text-brutal-black group-hover:text-white group-hover:scale-110 transition-transform" size={24} />
                    <span className="font-black text-sm uppercase tracking-wider text-brutal-black group-hover:text-white">Twitter / X</span>
                  </button>
                )}
                {member.socials?.facebook && (
                  <button onClick={() => handleContactSelect('facebook', member.socials.facebook!.startsWith('http') ? member.socials.facebook! : `https://facebook.com/${member.socials.facebook}`)} className="w-full flex items-center gap-4 bg-white hover:bg-brutal-blue hover:text-white border-4 border-brutal-black p-4 transition-all group shadow-neo-sm brutal-btn">
                    <Facebook className="text-brutal-black group-hover:text-white group-hover:scale-110 transition-transform" size={24} />
                    <span className="font-black text-sm uppercase tracking-wider text-brutal-black group-hover:text-white">Facebook</span>
                  </button>
                )}

                {!member.email && !member.socials?.telegram && !member.socials?.twitter && !member.socials?.facebook && (
                  <div className="text-center text-brutal-black font-black text-sm p-6 border-4 border-brutal-black bg-gray-200">
                    Thành viên này chưa cập nhật thông tin liên hệ.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Avatar & Basic Stats */}
        <div className="md:col-span-4 lg:col-span-4 flex flex-col items-center group relative z-10 w-full">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-64 h-64 mb-10 mx-auto"
          >
            {/* Soft decorative background rings instead of spinning borders */}
            <div className="absolute inset-0 border-4 border-brutal-black bg-brutal-yellow transition-transform duration-700 shadow-neo group-hover:translate-x-2 group-hover:translate-y-2" />
            <div className="absolute inset-0 border-4 border-brutal-black bg-brutal-pink transition-transform duration-700 shadow-neo group-hover:-translate-x-2 group-hover:-translate-y-2" />

            <div className="absolute inset-0 overflow-hidden border-4 border-brutal-black shadow-neo-sm bg-white z-10 transition-transform duration-500">
              <img src={member.avatar || `https://i.pravatar.cc/150?u=${member.id}`} alt={member.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" />
            </div>

            <div className="absolute bottom-4 -right-4 bg-brutal-blue text-white font-black text-xs px-4 py-2 shadow-neo-sm z-20 border-4 border-brutal-black tracking-widest uppercase">
              CẤP 42
            </div>

            {(member as any).streak > 0 && (
              <div className="absolute top-8 -left-8 flex items-center gap-1 bg-brutal-gold text-brutal-black px-4 py-2 font-black text-sm shadow-neo z-20 border-4 border-brutal-black -rotate-6">
                {(member as any).streak} ngày <span className="ml-1">🔥</span>
              </div>
            )}
          </motion.div>

          <div className="w-full space-y-4 max-w-sm mx-auto">
            <div className="bg-white p-5 border-4 border-brutal-black shadow-neo-sm flex justify-between items-center relative overflow-hidden group/item brutal-card">
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-brutal-blue opacity-50 group-hover/item:opacity-100 transition-opacity border-r-4 border-brutal-black" />
              <div className="flex flex-col pl-4">
                <span className="text-[10px] text-brutal-black uppercase font-black tracking-widest mb-1">Vai trò</span>
                <span className="text-brutal-black text-xl font-display font-black uppercase tracking-tight">{member.role || 'Thành viên'}</span>
              </div>
              <Shield className="text-brutal-black w-8 h-8 group-hover/item:scale-110 transition-transform" />
            </div>
            <div className="bg-white p-5 border-4 border-brutal-black shadow-neo-sm flex justify-between items-center relative overflow-hidden group/item brutal-card">
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-brutal-green opacity-50 group-hover/item:opacity-100 transition-opacity border-r-4 border-brutal-black" />
              <div className="flex flex-col pl-4">
                <span className="text-[10px] text-brutal-black uppercase font-black tracking-widest mb-1">Trạng thái</span>
                <span className="text-brutal-black text-xl font-display font-black tracking-tight">ONLINE</span>
              </div>
              <Globe className="text-brutal-black w-8 h-8 group-hover/item:scale-110 transition-transform animate-pulse" />
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Dossier */}
        <div className="md:col-span-8 lg:col-span-8 space-y-10 relative z-10">
          <div className="border-b-4 border-brutal-black pb-8 relative">
            <div className="absolute right-0 top-0 text-[120px] font-display font-black text-gray-100 leading-none pointer-events-none select-none z-[-1]">
              {(member.id || 'XXXX').substring(0,4)}
            </div>
            <motion.h1
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-display font-black text-brutal-black mb-6 uppercase tracking-tighter decoration-brutal-yellow decoration-4 underline underline-offset-8"
            >
              {member.name}
            </motion.h1>
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-3 flex-wrap"
            >
              <div className="bg-brutal-blue border-4 border-brutal-black px-4 py-2 text-white font-black tracking-widest uppercase text-xs shadow-neo-sm">
                {isCommunity ? 'Thành viên cộng đồng' : member.role}
              </div>
              <div className="px-4 py-2 bg-brutal-pink border-4 border-brutal-black font-mono text-brutal-black font-black uppercase text-xs shadow-neo-sm">
                ID: {member.id || 'CLASSIFIED'}
              </div>
            </motion.div>
          </div>

          <div className="space-y-8">
            <div className="bg-white border-4 border-brutal-black p-8 shadow-neo relative overflow-hidden brutal-card">
              <h3 className="text-sm font-black text-brutal-black uppercase tracking-widest mb-6 flex items-center gap-3 relative z-10 border-b-4 border-brutal-black pb-4">
                <span className="w-3 h-3 bg-brutal-yellow border-2 border-brutal-black" /> Kỹ năng chuyên môn
              </h3>
              <div className="flex flex-wrap gap-3 relative z-10">
                {member.skills?.length > 0 ? member.skills.map((skill, i) => (
                  <motion.span
                    key={skill}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + (i * 0.05) }}
                    className="px-4 py-2 border-4 border-brutal-black bg-white text-brutal-black font-black text-xs uppercase shadow-neo-sm hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all cursor-default"
                  >
                    {skill}
                  </motion.span>
                )) : (
                  <span className="text-brutal-black font-black text-sm bg-gray-200 border-4 border-brutal-black px-4 py-2">Chưa cập nhật kỹ năng.</span>
                )}
              </div>
            </div>

            <div className="bg-brutal-yellow border-4 border-brutal-black p-8 shadow-neo brutal-card">
              <h3 className="text-sm font-black text-brutal-black uppercase tracking-widest mb-6 flex items-center gap-3 relative z-10 border-b-4 border-brutal-black pb-4">
                <span className="w-3 h-3 bg-brutal-blue border-2 border-brutal-black" /> Kênh liên lạc
              </h3>
              <div className="flex flex-wrap gap-4 relative z-10">
                {member.socials?.github ? (
                  <a href={member.socials.github.startsWith('http') ? member.socials.github : `https://github.com/${member.socials.github}`} target="_blank" rel="noreferrer" className="w-16 h-16 flex items-center justify-center border-4 border-brutal-black hover:bg-brutal-blue hover:text-white bg-white text-brutal-black shadow-neo-sm transition-all hover:translate-x-1 hover:-translate-y-1 brutal-btn">
                    <Github size={32} />
                  </a>
                ) : (
                  <div className="w-16 h-16 flex items-center justify-center border-4 border-brutal-black bg-gray-200 text-gray-500 cursor-not-allowed opacity-50"><Github size={32} /></div>
                )}
                {member.socials?.twitter ? (
                  <a href={member.socials.twitter.startsWith('http') ? member.socials.twitter : `https://twitter.com/${member.socials.twitter}`} target="_blank" rel="noreferrer" className="w-16 h-16 flex items-center justify-center border-4 border-brutal-black hover:bg-brutal-black hover:text-white bg-white text-brutal-black shadow-neo-sm transition-all hover:translate-x-1 hover:-translate-y-1 brutal-btn">
                    <Twitter size={32} />
                  </a>
                ) : (
                  <div className="w-16 h-16 flex items-center justify-center border-4 border-brutal-black bg-gray-200 text-gray-500 cursor-not-allowed opacity-50"><Twitter size={32} /></div>
                )}
                {member.socials?.telegram ? (
                  <a href={member.socials.telegram.startsWith('http') ? member.socials.telegram : `https://t.me/${member.socials.telegram}`} target="_blank" rel="noreferrer" className="w-16 h-16 flex items-center justify-center border-4 border-brutal-black hover:bg-brutal-blue hover:text-white bg-white text-brutal-black shadow-neo-sm transition-all hover:translate-x-1 hover:-translate-y-1 brutal-btn">
                    <Send size={32} />
                  </a>
                ) : (
                  <div className="w-16 h-16 flex items-center justify-center border-4 border-brutal-black bg-gray-200 text-gray-500 cursor-not-allowed opacity-50"><Send size={32} /></div>
                )}
                {member.socials?.facebook ? (
                  <a href={member.socials.facebook.startsWith('http') ? member.socials.facebook : `https://facebook.com/${member.socials.facebook}`} target="_blank" rel="noreferrer" className="w-16 h-16 flex items-center justify-center border-4 border-brutal-black hover:bg-brutal-blue hover:text-white bg-white text-brutal-black shadow-neo-sm transition-all hover:translate-x-1 hover:-translate-y-1 brutal-btn">
                    <Facebook size={32} />
                  </a>
                ) : (
                  <div className="w-16 h-16 flex items-center justify-center border-4 border-brutal-black bg-gray-200 text-gray-500 cursor-not-allowed opacity-50"><Facebook size={32} /></div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t-4 border-brutal-black pt-8 mt-12 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 text-brutal-black text-xs font-black uppercase tracking-widest bg-white border-4 border-brutal-black px-4 py-2 shadow-neo-sm">
              <Globe size={20} className="text-brutal-blue" />
              Được xác thực bởi DSUC Database
            </div>
            <button onClick={() => setShowContactPopup(true)} className="bg-brutal-pink hover:bg-brutal-yellow text-brutal-black px-8 py-4 border-4 border-brutal-black font-black text-sm uppercase tracking-wider transition-all w-full sm:w-auto text-center shadow-neo hover:shadow-neo-lg flex items-center justify-center gap-2 brutal-btn">
              <Mail size={24} /> Đề xuất hợp tác
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

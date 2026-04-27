
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
    { id: 'mock-1', name: 'Zah', avatar: 'https://i.pravatar.cc/150?img=11', memberType: 'member', role: 'President', skills: ['Leadership', 'Rust', 'Blockchain'], socials: { github: 'zah', twitter: 'zah' }, streak: 84 },
    { id: 'mock-2', name: 'Neo', avatar: 'https://i.pravatar.cc/150?img=12', memberType: 'member', role: 'Solana Dev', skills: ['Solana', 'Anchor', 'Rust'], socials: { github: 'neo' }, streak: 62 },
    { id: 'mock-5', name: 'Cypher', avatar: 'https://i.pravatar.cc/150?img=15', memberType: 'community', role: 'Frontend', skills: ['React', 'TypeScript', 'Tailwind'], socials: { twitter: 'cypher' }, streak: 55 },
  ];

  const displayMembers = members.length > 0 ? members : mockMembers;

  const member = displayMembers.find(m => m.id === id) || {
    id: id || 'mock-id',
    name: 'Unknown User ' + (id?.substring(0,4) || 'X'),
    avatar: `https://i.pravatar.cc/150?u=${id}`,
    role: 'Member',
    memberType: 'community',
    skills: [],
    socials: {},
    streak: 0
  };

  const isCommunity = member?.memberType === 'community';

  if (!member) {
    return <div className="text-white text-center pt-20">Member not found</div>;
  }

  const handleContactSelect = (platform: string, url: string) => {
    window.open(url, '_blank');
    setShowContactPopup(false);
  };

  return (
    <div className="max-w-6xl mx-auto pt-10 px-4 pb-20">
      <button
        onClick={() => navigate('/members')}
        className="mb-8 flex items-center gap-2 text-white/40 hover:text-cyber-yellow transition-colors font-mono text-xs uppercase tracking-widest"
      >
        <ArrowLeft size={16} /> Return to Directory
      </button>

      {/* Contact Popup */}
      <AnimatePresence>
        {showContactPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowContactPopup(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-[#050B14] border border-cyber-yellow/30 p-8 shadow-[0_0_40px_rgba(255,214,0,0.15)] max-w-sm w-full"
            >
              <button
                onClick={() => setShowContactPopup(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>

              <h2 className="text-2xl font-display font-bold text-white mb-6 uppercase tracking-wider border-b border-white/10 pb-4">
                Establish Contact
              </h2>

              <div className="space-y-3">
                {member.email && (
                  <button onClick={() => handleContactSelect('email', `mailto:${member.email}`)} className="w-full flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 p-4 transition-colors group">
                    <Mail className="text-white/40 group-hover:text-cyber-blue" size={20} />
                    <span className="font-mono text-sm uppercase tracking-widest text-white/80 group-hover:text-white">Email</span>
                  </button>
                )}
                {member.socials?.telegram && (
                  <button onClick={() => handleContactSelect('telegram', member.socials.telegram!.startsWith('http') ? member.socials.telegram! : `https://t.me/${member.socials.telegram}`)} className="w-full flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 p-4 transition-colors group">
                    <Send className="text-white/40 group-hover:text-cyber-blue" size={20} />
                    <span className="font-mono text-sm uppercase tracking-widest text-white/80 group-hover:text-white">Telegram</span>
                  </button>
                )}
                {member.socials?.twitter && (
                  <button onClick={() => handleContactSelect('twitter', member.socials.twitter!.startsWith('http') ? member.socials.twitter! : `https://x.com/${member.socials.twitter}`)} className="w-full flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 p-4 transition-colors group">
                    <Twitter className="text-white/40 group-hover:text-cyber-blue" size={20} />
                    <span className="font-mono text-sm uppercase tracking-widest text-white/80 group-hover:text-white">Twitter / X</span>
                  </button>
                )}
                {member.socials?.facebook && (
                  <button onClick={() => handleContactSelect('facebook', member.socials.facebook!.startsWith('http') ? member.socials.facebook! : `https://facebook.com/${member.socials.facebook}`)} className="w-full flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 p-4 transition-colors group">
                    <Facebook className="text-white/40 group-hover:text-cyber-blue" size={20} />
                    <span className="font-mono text-sm uppercase tracking-widest text-white/80 group-hover:text-white">Facebook</span>
                  </button>
                )}

                {!member.email && !member.socials?.telegram && !member.socials?.twitter && !member.socials?.facebook && (
                  <div className="text-center text-white/40 font-mono text-sm p-4 border border-white/5 bg-black/50">
                    No contact channels available for this operative.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Avatar & Basic Stats */}
        <div className="md:col-span-4 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-64 h-64 mb-10"
          >
            {/* Spinning Rings */}
            <div className="absolute inset-0 rounded-full border border-cyber-blue/30 border-t-transparent animate-spin duration-3000" />
            <div className="absolute inset-2 rounded-full border border-cyber-yellow/20 border-b-transparent animate-spin duration-2000 direction-reverse" />

            <div className="absolute inset-4 rounded-full overflow-hidden border-2 border-white/10 bg-black">
              <img src={member.avatar || `https://i.pravatar.cc/150?u=${member.id}`} alt={member.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-cyber-blue/10 mix-blend-overlay"></div>
            </div>

            <div className="absolute bottom-4 right-4 bg-cyber-blue text-black font-bold font-mono text-[10px] px-2 py-0.5 border border-white shadow-[0_0_10px_rgba(41,121,255,0.8)]">
              LEVEL 42
            </div>

            {(member as any).streak > 0 && (
              <div className="absolute -left-2 top-10 flex items-center gap-1 bg-black/80 border border-cyber-yellow/30 px-3 py-1 font-mono text-xs text-cyber-yellow font-bold rotate-[-15deg] shadow-[0_0_10px_rgba(255,214,0,0.3)]">
                {(member as any).streak} STREAK
              </div>
            )}
          </motion.div>

          <div className="w-full space-y-4">
            <div className="bg-[#050B14] p-5 border border-white/10 flex justify-between items-center relative overflow-hidden group">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyber-blue group-hover:w-full group-hover:opacity-10 transition-all duration-500"></div>
              <div className="flex flex-col relative z-10">
                <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider mb-1">Rank</span>
                <span className="text-cyber-blue text-lg font-display font-bold uppercase">{member.role || 'Operative'}</span>
              </div>
              <Shield className="text-cyber-blue/50 w-8 h-8 relative z-10" />
            </div>
            <div className="bg-[#050B14] p-5 border border-white/10 flex justify-between items-center relative overflow-hidden group">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyber-yellow group-hover:w-full group-hover:opacity-10 transition-all duration-500"></div>
              <div className="flex flex-col relative z-10">
                <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider mb-1">Availability</span>
                <span className="text-cyber-yellow text-lg font-display font-bold">ONLINE</span>
              </div>
              <Globe className="text-cyber-yellow/50 w-8 h-8 relative z-10 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Dossier */}
        <div className="md:col-span-8 space-y-12">
          <div className="border-b border-white/10 pb-8 relative">
            <div className="absolute right-0 top-0 text-[120px] font-display font-black text-white/[0.02] leading-none pointer-events-none select-none">
              {(member.id || 'XXXX').substring(0,4)}
            </div>
            <motion.h1
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="text-5xl md:text-7xl font-display font-bold text-white mb-4 uppercase drop-shadow-lg"
            >
              {member.name}
            </motion.h1>
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-4 flex-wrap"
            >
              <div className="bg-cyber-blue/10 border border-cyber-blue/30 px-4 py-1 text-cyber-blue font-bold font-mono tracking-widest uppercase">
                {isCommunity ? 'Community Member' : member.role}
              </div>
              <div className="flex items-center gap-1 text-[10px] bg-white/5 border border-white/10 px-3 py-1 font-mono text-white/60 uppercase">
                ID: {member.id || 'CLASSIFIED'}
              </div>
            </motion.div>
          </div>

          <div className="space-y-8">
            <div className="bg-[#050B14] border border-white/10 p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 pointer-events-none" />
              <h3 className="text-sm font-mono text-white/60 uppercase tracking-widest mb-6 flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-cyber-yellow rounded-full animate-pulse" /> Tactical Skill Matrix
              </h3>
              <div className="flex flex-wrap gap-3 relative z-10">
                {member.skills?.length > 0 ? member.skills.map((skill, i) => (
                  <motion.span
                    key={skill}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + (i * 0.05) }}
                    className="px-4 py-2 border border-cyber-blue/30 bg-cyber-blue/5 text-cyber-blue font-bold font-mono text-xs uppercase hover:bg-cyber-blue hover:text-black transition-colors cursor-default"
                  >
                    {skill}
                  </motion.span>
                )) : (
                  <span className="text-white/30 font-mono text-sm italic">No skills recorded.</span>
                )}
              </div>
            </div>

            <div className="bg-[#050B14] border border-white/10 p-8 shadow-xl">
              <h3 className="text-sm font-mono text-white/60 uppercase tracking-widest mb-6 flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-cyber-blue rounded-full" /> Comms Channels
              </h3>
              <div className="flex flex-wrap gap-4">
                {member.socials?.github ? (
                  <a href={member.socials.github.startsWith('http') ? member.socials.github : `https://github.com/${member.socials.github}`} target="_blank" rel="noreferrer" className="w-14 h-14 flex items-center justify-center border border-white/20 hover:border-cyber-blue hover:text-cyber-blue hover:bg-cyber-blue/5 bg-black text-white/60 transition-all rounded">
                    <Github size={24} />
                  </a>
                ) : (
                  <div className="w-14 h-14 flex items-center justify-center border border-white/5 bg-black/50 text-white/20 rounded cursor-not-allowed"><Github size={24} /></div>
                )}
                {member.socials?.twitter ? (
                  <a href={member.socials.twitter.startsWith('http') ? member.socials.twitter : `https://twitter.com/${member.socials.twitter}`} target="_blank" rel="noreferrer" className="w-14 h-14 flex items-center justify-center border border-white/20 hover:border-cyber-blue hover:text-cyber-blue hover:bg-cyber-blue/5 bg-black text-white/60 transition-all rounded">
                    <Twitter size={24} />
                  </a>
                ) : (
                  <div className="w-14 h-14 flex items-center justify-center border border-white/5 bg-black/50 text-white/20 rounded cursor-not-allowed"><Twitter size={24} /></div>
                )}
                {member.socials?.telegram ? (
                  <a href={member.socials.telegram.startsWith('http') ? member.socials.telegram : `https://t.me/${member.socials.telegram}`} target="_blank" rel="noreferrer" className="w-14 h-14 flex items-center justify-center border border-white/20 hover:border-cyber-blue hover:text-cyber-blue hover:bg-cyber-blue/5 bg-black text-white/60 transition-all rounded">
                    <Send size={24} />
                  </a>
                ) : (
                  <div className="w-14 h-14 flex items-center justify-center border border-white/5 bg-black/50 text-white/20 rounded cursor-not-allowed"><Send size={24} /></div>
                )}
                {member.socials?.facebook ? (
                  <a href={member.socials.facebook.startsWith('http') ? member.socials.facebook : `https://facebook.com/${member.socials.facebook}`} target="_blank" rel="noreferrer" className="w-14 h-14 flex items-center justify-center border border-white/20 hover:border-cyber-blue hover:text-cyber-blue hover:bg-cyber-blue/5 bg-black text-white/60 transition-all rounded">
                    <Facebook size={24} />
                  </a>
                ) : (
                  <div className="w-14 h-14 flex items-center justify-center border border-white/5 bg-black/50 text-white/20 rounded cursor-not-allowed"><Facebook size={24} /></div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 mt-16 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 text-white/30 text-[10px] font-mono uppercase">
              <Globe size={14} className="animate-pulse text-cyber-blue/50" />
              Verified in DSUC Global Database
            </div>
            <button onClick={() => setShowContactPopup(true)} className="bg-white/5 hover:bg-cyber-yellow hover:text-black text-white px-8 py-4 font-display font-bold text-sm uppercase tracking-widest transition-colors w-full sm:w-auto border border-white/10 hover:border-cyber-yellow text-center shadow-[0_0_15px_rgba(255,214,0,0)] hover:shadow-[0_0_15px_rgba(255,214,0,0.3)] cursor-pointer">
              Propose Collaboration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

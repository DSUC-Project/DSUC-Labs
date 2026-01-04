
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Github, Twitter, Send, Shield, Globe } from 'lucide-react';
import { useStore } from '../store/useStore';

export function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { members } = useStore();

  const member = members.find(m => m.id === id);

  if (!member) {
    return <div className="text-white text-center pt-20">OPERATIVE NOT FOUND</div>;
  }

  return (
    <div className="max-w-5xl mx-auto pt-10">
      <button
        onClick={() => navigate('/members')}
        className="mb-8 flex items-center gap-2 text-white/40 hover:text-cyber-yellow transition-colors font-mono text-xs uppercase tracking-widest"
      >
        <ArrowLeft size={16} /> Return to Directory
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Left Column: Avatar & Basic Stats */}
        <div className="md:col-span-1 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-64 h-64 mb-8"
          >
            {/* Spinning Rings */}
            <div className="absolute inset-0 rounded-full border border-cyber-blue/30 border-t-transparent animate-spin duration-3000" />
            <div className="absolute inset-2 rounded-full border border-cyber-yellow/20 border-b-transparent animate-spin duration-2000 direction-reverse" />

            <div className="absolute inset-4 rounded-full overflow-hidden border-2 border-white/10 bg-black">
              <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
            </div>

            <div className="absolute bottom-4 right-4 bg-cyber-blue text-black font-bold font-mono text-[10px] px-2 py-0.5 border border-white">
              LVL 1
            </div>
          </motion.div>

          <div className="w-full space-y-4">
            <div className="cyber-card p-4 bg-surface/50 border border-cyber-blue/20 text-center">
              <span className="block text-cyber-blue text-2xl font-display font-bold">100%</span>
              <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Mission Success Rate</span>
            </div>
            <div className="cyber-card p-4 bg-surface/50 border border-cyber-blue/20 text-center">
              <span className="block text-cyber-yellow text-2xl font-display font-bold">ACTIVE</span>
              <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Current Status</span>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Dossier */}
        <div className="md:col-span-2 space-y-10">
          <div>
            <motion.h1
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="text-5xl md:text-6xl font-display font-bold text-white mb-2 uppercase"
            >
              {member.name}
            </motion.h1>
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-4"
            >
              <span className="text-xl font-mono text-cyber-blue uppercase tracking-widest border-b border-cyber-blue/30 pb-1">
                {member.role}
              </span>
              <span className="flex items-center gap-1 text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/60 font-bold border border-white/5">
                <Shield size={10} /> VERIFIED
              </span>
            </motion.div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-mono text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-4 h-[1px] bg-cyber-yellow" /> Skills Matrix
              </h3>
              <div className="flex flex-wrap gap-2">
                {member.skills.map((skill, i) => (
                  <motion.span
                    key={skill}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + (i * 0.05) }}
                    className="px-4 py-2 border border-cyber-blue/30 bg-cyber-blue/5 text-cyber-blue font-bold font-mono text-xs uppercase hover:bg-cyber-blue hover:text-black transition-colors cursor-default"
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-mono text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-4 h-[1px] bg-cyber-yellow" /> Establish Comms
              </h3>
              <div className="flex gap-4">
                {member.socials?.github && (
                  <a href={member.socials.github.startsWith('http') ? member.socials.github : `https://github.com/${member.socials.github}`} target="_blank" rel="noreferrer" className="w-12 h-12 flex items-center justify-center border border-white/10 hover:border-cyber-blue hover:text-cyber-blue bg-surface text-white/60 transition-all cyber-button">
                    <Github size={20} />
                  </a>
                )}
                {member.socials?.twitter && (
                  <a href={member.socials.twitter.startsWith('http') ? member.socials.twitter : `https://twitter.com/${member.socials.twitter}`} target="_blank" rel="noreferrer" className="w-12 h-12 flex items-center justify-center border border-white/10 hover:border-cyber-blue hover:text-cyber-blue bg-surface text-white/60 transition-all cyber-button">
                    <Twitter size={20} />
                  </a>
                )}
                {member.socials?.telegram && (
                  <a href={member.socials.telegram.startsWith('http') ? member.socials.telegram : `https://t.me/${member.socials.telegram}`} target="_blank" rel="noreferrer" className="w-12 h-12 flex items-center justify-center border border-white/10 hover:border-cyber-blue hover:text-cyber-blue bg-surface text-white/60 transition-all cyber-button">
                    <Send size={20} />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 mt-12 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/30 text-[10px] font-mono uppercase">
              <Globe size={12} />
              DSUC Global Database
            </div>
            <button className="bg-white/5 hover:bg-cyber-yellow hover:text-black text-white px-6 py-2 font-display font-bold text-xs uppercase tracking-widest cyber-button transition-colors">
              Request Collaboration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

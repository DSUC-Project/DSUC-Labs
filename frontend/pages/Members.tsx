
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Github, Twitter, Send } from 'lucide-react';
import { useStore } from '../store/useStore'; // Use store for Members
import { Member } from '../types';

export function Members() {
  const { members } = useStore(); // Get members from store

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-cyber-blue/20 pb-6">
        <div>
          <h2 className="text-4xl font-display font-bold mb-1 text-white">OPERATIVES</h2>
          <p className="text-cyber-blue font-mono text-sm">Active contributors in the network.</p>
        </div>
        <div className="font-mono text-sm text-cyber-yellow border border-cyber-yellow/30 px-3 py-1 bg-cyber-yellow/5">
           {members.length} UNITS ONLINE
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {members.map((member) => (
          <MemberCard key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
}

function MemberCard({ member }: { member: Member }) {
  return (
    <Link to={`/member/${member.id}`}>
      <motion.div
        whileHover={{ y: -5 }}
        className="relative group cursor-pointer h-full"
      >
        <div className="cyber-card p-5 h-full relative z-10 bg-surface/50 backdrop-blur-sm hover:bg-cyber-blue/5 transition-all duration-300 flex flex-col items-center text-center">
           <div className="w-20 h-20 shrink-0 relative mb-4 rounded-full p-1 border border-cyber-blue/30 group-hover:border-cyber-blue transition-colors">
             <img src={member.avatar} alt={member.name} className="w-full h-full object-cover rounded-full grayscale group-hover:grayscale-0 transition-all duration-300" />
           </div>
           
           <div className="mb-4">
             <h3 className="text-lg font-display font-bold leading-none mb-1 text-white group-hover:text-cyber-yellow transition-colors">{member.name}</h3>
             <p className="text-[10px] font-mono text-cyber-blue uppercase tracking-wider">{member.role}</p>
           </div>

           <div className="flex flex-wrap justify-center gap-1 mb-4 w-full">
              {member.skills.slice(0, 3).map(skill => (
                <span key={skill} className="text-[9px] uppercase font-bold px-1.5 py-0.5 border border-white/10 text-white/40 group-hover:border-cyber-blue/30 group-hover:text-cyber-blue transition-colors">
                  {skill}
                </span>
              ))}
           </div>

           <div className="flex gap-4 text-white/30 group-hover:text-white transition-colors mt-auto">
              {member.socials.github && <Github size={14} className="hover:text-cyber-yellow" />}
              {member.socials.twitter && <Twitter size={14} className="hover:text-cyber-yellow" />}
              {member.socials.telegram && <Send size={14} className="hover:text-cyber-yellow" />}
           </div>
        </div>
      </motion.div>
    </Link>
  );
}

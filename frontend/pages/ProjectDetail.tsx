
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Github, Rocket, Share2 } from 'lucide-react';
import { useStore } from '../store/useStore';

export function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects } = useStore();
  
  const project = projects.find(p => p.id === id);

  if (!project) {
    return <div className="text-white text-center pt-20">SYSTEM NOT FOUND</div>;
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('LINK COPIED TO CLIPBOARD');
  };

  return (
    <div className="max-w-4xl mx-auto pt-10">
      <button 
        onClick={() => navigate('/projects')}
        className="mb-8 flex items-center gap-2 text-white/40 hover:text-cyber-yellow transition-colors font-mono text-xs uppercase tracking-widest"
      >
        <ArrowLeft size={16} /> Return to Projects
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface/50 cyber-card border border-cyber-blue p-8 md:p-12 relative overflow-hidden"
      >
        {/* Background Grid Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyber-blue/5 rounded-bl-full pointer-events-none" />
        <button 
          onClick={handleCopyLink}
          className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors"
          title="Share Link"
        >
          <Share2 size={20} />
        </button>

        <div className="flex flex-col md:flex-row items-start gap-8 mb-10 relative z-10">
           <div className="w-24 h-24 bg-cyber-blue/10 border border-cyber-blue/30 flex items-center justify-center text-cyber-blue shrink-0 cyber-clip-top">
              <Rocket size={48} />
           </div>
           
           <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                 <span className="px-3 py-1 bg-cyber-yellow/10 text-cyber-yellow text-xs font-mono font-bold uppercase border border-cyber-yellow/20">
                   {project.category}
                 </span>
                 <span className="text-xs text-green-500 font-mono flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> SYSTEM ONLINE
                 </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 leading-tight">{project.name}</h1>
              
              <div className="flex flex-wrap gap-2">
                {project.builders.map(b => (
                   <span key={b} className="text-xs font-mono text-white/60 uppercase bg-white/5 px-2 py-1 rounded-sm border border-white/10 hover:border-white/30 transition-colors cursor-default">
                     {b}
                   </span>
                ))}
              </div>
           </div>
        </div>

        <div className="mb-10 relative z-10">
           <h3 className="text-sm font-mono text-cyber-blue uppercase mb-4 tracking-widest flex items-center gap-2">
             <span className="w-4 h-[1px] bg-cyber-blue" /> System Overview
           </h3>
           <p className="text-white/80 font-sans leading-relaxed text-lg border-l-2 border-white/10 pl-6">
             {project.description}
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
           <a 
             href={project.link} 
             target="_blank" 
             rel="noreferrer"
             className="bg-cyber-blue text-white hover:bg-white hover:text-black py-4 cyber-button font-display font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
           >
             <ExternalLink size={18} /> INITIALIZE DEMO
           </a>
           {project.repoLink && (
             <a 
               href={project.repoLink} 
               target="_blank" 
               rel="noreferrer"
               className="bg-black border border-white/20 text-white hover:border-cyber-blue hover:text-cyber-blue py-4 cyber-button font-display font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
             >
               <Github size={18} /> ACCESS SOURCE
             </a>
           )}
        </div>
      </motion.div>
    </div>
  );
}

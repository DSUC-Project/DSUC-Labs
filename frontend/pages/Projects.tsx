
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Layers, Terminal, Plus, X, Github, Rocket } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Project } from '../types';
import { Link } from 'react-router-dom';

export function Projects() {
  const { projects, addProject, isWalletConnected } = useStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleAddClick = () => {
    if (!isWalletConnected) {
      alert('Please connect your wallet first!');
      return;
    }
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-cyber-blue/20 pb-6">
        <div>
          <h2 className="text-4xl font-display font-bold mb-1 text-white">CLUB PROJECTS</h2>
          <p className="text-cyber-blue font-mono text-sm">Deployed systems and active developments.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="font-mono text-sm text-cyber-yellow border border-cyber-yellow/30 px-3 py-1 bg-cyber-yellow/5">
              {projects.length} SYSTEMS DEPLOYED
           </div>
           <button 
             onClick={handleAddClick}
             disabled={!isWalletConnected}
             className={`font-display font-bold text-sm px-4 py-2 cyber-button flex items-center gap-2 transition-all ${
               isWalletConnected 
                 ? 'bg-cyber-blue text-white hover:bg-white hover:text-black' 
                 : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
             }`}
           >
             <Plus size={16} /> ADD PROJECT
             {!isWalletConnected && <span className="text-[10px] ml-2">(Connect Wallet)</span>}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project, index) => (
          <Link to={`/project/${project.id}`} key={project.id} className="block h-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="cyber-card group relative p-6 bg-surface/50 border border-cyber-blue/20 hover:border-cyber-blue hover:bg-cyber-blue/5 transition-all h-full cursor-pointer"
            >
              <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity">
                <ExternalLink size={20} className="text-cyber-blue" />
              </div>

              <div className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center text-cyber-yellow mb-6 group-hover:scale-110 transition-transform">
                 {index % 2 === 0 ? <Layers size={24} /> : <Terminal size={24} />}
              </div>

              <div className="mb-4">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 border border-cyber-blue/30 text-cyber-blue bg-cyber-blue/5 mb-3 inline-block">
                  {project.category}
                </span>
                <h3 className="text-2xl font-display font-bold text-white mb-2 group-hover:text-cyber-yellow transition-colors">
                  {project.name}
                </h3>
                <p className="text-white/60 font-mono text-sm leading-relaxed line-clamp-3">
                  {project.description}
                </p>
              </div>

              <div className="mt-auto pt-4 border-t border-white/5">
                <span className="text-[10px] text-white/30 uppercase font-mono block mb-2">Builders</span>
                <div className="flex flex-wrap gap-2">
                  {project.builders.map(builder => (
                    <span key={builder} className="text-xs text-white/80 bg-black/50 px-2 py-1 border border-white/10 rounded-sm">
                      {builder}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-cyber-blue scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </motion.div>
          </Link>
        ))}
      </div>
      
      {/* Add Project Modal */}
      <AddProjectModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={addProject} />
    </div>
  );
}

function AddProjectModal({ isOpen, onClose, onAdd }: { isOpen: boolean, onClose: () => void, onAdd: (p: Project) => void }) {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    onAdd({
      id: Math.random().toString(),
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      builders: (formData.get('builders') as string).split(',').map(s => s.trim()),
      link: formData.get('link') as string,
      repoLink: formData.get('repoLink') as string
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-surface cyber-card border border-cyber-blue/50 p-6 md:p-8 w-full max-w-md relative z-10 my-8 max-h-[90vh] overflow-y-auto"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors z-10">
          <X size={20} />
        </button>
        <h3 className="text-xl md:text-2xl font-display font-bold mb-4 md:mb-6 text-cyber-blue uppercase pr-8">INITIALIZE PROJECT</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input name="name" placeholder="Project Name" required className="w-full bg-black/50 border border-white/10 p-2.5 text-white focus:border-cyber-blue outline-none font-mono text-sm" />
          <textarea name="description" placeholder="Short Description" rows={3} required className="w-full bg-black/50 border border-white/10 p-2.5 text-white focus:border-cyber-blue outline-none font-mono text-sm" />
          <input name="category" placeholder="Category (e.g. DeFi, Tooling)" required className="w-full bg-black/50 border border-white/10 p-2.5 text-white focus:border-cyber-blue outline-none font-mono text-sm" />
          <input name="builders" placeholder="Builders (comma separated)" required className="w-full bg-black/50 border border-white/10 p-2.5 text-white focus:border-cyber-blue outline-none font-mono text-sm" />
          <input name="link" placeholder="Project URL (Demo)" required className="w-full bg-black/50 border border-white/10 p-2.5 text-white focus:border-cyber-blue outline-none font-mono text-sm" />
          <input name="repoLink" placeholder="GitHub Repo URL" className="w-full bg-black/50 border border-white/10 p-2.5 text-white focus:border-cyber-blue outline-none font-mono text-sm" />
          <button type="submit" className="w-full bg-cyber-yellow text-black font-display font-bold py-2.5 cyber-button hover:bg-white transition-colors uppercase tracking-widest text-sm">DEPLOY TO HUB</button>
        </form>
      </motion.div>
    </div>
  );
}

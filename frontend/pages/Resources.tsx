import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Link as LinkIcon, Download, Plus, X, Video, Book, Trophy } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Resource, ResourceCategory } from '../types';

const CATEGORIES: ResourceCategory[] = ['Learning', 'Training', 'Document', 'Media', 'Hackathon'];

export function Resources() {
  const { resources, addResource } = useStore();
  const [filter, setFilter] = useState<ResourceCategory | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredResources = filter === 'All' ? resources : resources.filter(r => r.category === filter);

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-cyber-blue/20 pb-6 gap-6">
         <div>
            <h2 className="text-4xl font-display font-bold mb-1 text-white">KNOWLEDGE BASE</h2>
            <p className="text-cyber-blue font-mono text-sm">Classified intel and assets.</p>
         </div>
         <div className="flex flex-wrap gap-2">
           <button 
             onClick={() => setFilter('All')} 
             className={`px-4 py-1 text-xs font-bold font-display uppercase border ${filter === 'All' ? 'bg-white text-black border-white' : 'border-white/20 text-white/40 hover:text-white'}`}
           >
             All
           </button>
           {CATEGORIES.map(cat => (
             <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-1 text-xs font-bold font-display uppercase border ${filter === cat ? 'bg-cyber-blue text-white border-cyber-blue' : 'border-white/20 text-white/40 hover:text-white'}`}
             >
               {cat}
             </button>
           ))}
           <button 
             onClick={() => setIsModalOpen(true)}
             className="ml-4 bg-cyber-yellow text-black px-4 py-2 font-bold font-display text-xs hover:bg-white flex items-center gap-2 cyber-button"
           >
             <Plus size={14} /> ADD
           </button>
         </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {filteredResources.map((resource, i) => (
          <ResourceCard key={resource.id} resource={resource} index={i} />
        ))}
      </div>

      <AddResourceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={addResource} />
    </div>
  );
}

function ResourceCard({ resource, index }: { resource: Resource, index: number }) {
  const getIcon = () => {
     switch(resource.category) {
       case 'Media': return Video;
       case 'Learning': return Book;
       case 'Hackathon': return Trophy;
       case 'Document': return FileText;
       default: return LinkIcon;
     }
  };
  const Icon = getIcon();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="cyber-card p-6 group cursor-pointer hover:bg-cyber-blue/5 transition-colors flex flex-col items-center text-center gap-4 border border-cyber-blue/20 hover:border-cyber-blue bg-surface/50"
    >
      <div className={`w-14 h-14 bg-cyber-blue/10 flex items-center justify-center text-cyber-blue group-hover:scale-110 transition-transform duration-300 clip-path-polygon border border-cyber-blue/20`}>
        <Icon size={24} />
      </div>
      
      <div>
        <h3 className="font-bold font-display text-sm mb-1 line-clamp-1 text-white">{resource.name}</h3>
        <p className="text-[9px] text-white/40 uppercase font-bold tracking-wider font-mono">{resource.category} {resource.size && `• ${resource.size}`}</p>
      </div>

      <button className="mt-auto w-full py-2 bg-white/5 text-[10px] font-bold font-mono hover:bg-cyber-blue hover:text-white transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-200 uppercase tracking-widest">
        <Download size={10} />
        ACCESS DATA
      </button>
    </motion.div>
  );
}

function AddResourceModal({ isOpen, onClose, onAdd }: { isOpen: boolean, onClose: () => void, onAdd: (r: Resource) => void }) {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    onAdd({
      id: Math.random().toString(),
      name: formData.get('name') as string,
      url: formData.get('url') as string,
      type: 'Link',
      category: formData.get('category') as ResourceCategory,
      size: 'N/A'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-surface cyber-card border border-cyber-blue/50 p-8 w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white"><X /></button>
        <h3 className="text-2xl font-display font-bold mb-6 text-cyber-blue uppercase">UPLOAD RESOURCE</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="name" placeholder="Resource Name" required className="w-full bg-black/50 border border-white/10 p-3 text-white focus:border-cyber-blue outline-none font-mono text-sm" />
          <input name="url" placeholder="URL Link" required className="w-full bg-black/50 border border-white/10 p-3 text-white focus:border-cyber-blue outline-none font-mono text-sm" />
          <select name="category" className="w-full bg-black/50 border border-white/10 p-3 text-white focus:border-cyber-blue outline-none font-mono text-sm">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="submit" className="w-full bg-cyber-yellow text-black font-display font-bold py-3 cyber-button hover:bg-white transition-colors uppercase tracking-widest">UPLOAD TO VAULT</button>
        </form>
      </motion.div>
    </div>
  );
}
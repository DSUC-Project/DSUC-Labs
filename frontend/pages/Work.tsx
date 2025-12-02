
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { GitBranch, Star, Code, ExternalLink, Plus, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Bounty, Repo } from '../types';
import { clsx } from 'clsx';

export function Work() {
  const [activeTab, setActiveTab] = useState<'bounties' | 'repos'>('bounties');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isWalletConnected } = useStore();

  const handleAddClick = () => {
    if (!isWalletConnected) {
      alert('Please connect your wallet first!');
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b border-cyber-blue/20 pb-6">
         <h2 className="text-4xl font-display font-bold text-white uppercase">Operations</h2>
         <button 
           onClick={handleAddClick}
           disabled={!isWalletConnected}
           className={`font-display font-bold text-sm px-4 py-2 cyber-button flex items-center gap-2 ${
             isWalletConnected 
               ? 'bg-cyber-yellow text-black hover:bg-white' 
               : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
           }`}
         >
           <Plus size={16} /> ADD {activeTab === 'bounties' ? 'BOUNTY' : 'REPO'}
           {!isWalletConnected && <span className="text-[10px] ml-2">(Connect Wallet)</span>}
         </button>
      </div>

      <div className="flex gap-4 p-1 border border-cyber-blue/30 w-fit rounded-none cyber-button">
        <TabButton active={activeTab === 'bounties'} onClick={() => setActiveTab('bounties')}>
          Active Bounties
        </TabButton>
        <TabButton active={activeTab === 'repos'} onClick={() => setActiveTab('repos')}>
          Open Source Repos
        </TabButton>
      </div>

      {activeTab === 'bounties' ? <BountyBoard /> : <RepoList />}
      
      {isModalOpen && <AddItemModal type={activeTab} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}

function TabButton({ children, active, onClick }: { children?: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={clsx(
        "px-6 py-2 text-xs font-bold font-display uppercase transition-all cyber-button",
        active ? "bg-cyber-blue text-white" : "text-white/60 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

function BountyBoard() {
  const { bounties } = useStore();
  const columns = ['Open', 'In Progress', 'Closed'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map(status => (
        <div key={status} className="space-y-4">
          <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
            <div className={clsx("w-2 h-2 rotate-45", 
              status === 'Open' ? 'bg-green-400' : status === 'In Progress' ? 'bg-cyber-yellow' : 'bg-white/20'
            )} />
            <span className="font-display text-xs font-bold uppercase tracking-wider text-white/60">{status}</span>
          </div>

          <div className="space-y-4">
             {bounties.filter(b => b.status === status).map(bounty => (
               <BountyCard key={bounty.id} bounty={bounty} />
             ))}
             {bounties.filter(b => b.status === status).length === 0 && (
                <div className="h-24 border border-dashed border-white/10 flex items-center justify-center text-white/20 text-xs font-mono">
                  Null
                </div>
             )}
          </div>
        </div>
      ))}
    </div>
  );
}

function BountyCard({ bounty }: { bounty: Bounty; key?: React.Key }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="cyber-card p-5 group border border-cyber-blue/20 hover:border-cyber-blue transition-all cursor-pointer bg-surface/50"
    >
      <div className="flex justify-between items-start mb-3">
         <span className={clsx("text-[10px] font-bold px-2 py-0.5 font-mono uppercase border", 
            bounty.difficulty === 'Easy' ? 'text-green-400 border-green-400/20' : 
            bounty.difficulty === 'Medium' ? 'text-cyber-yellow border-cyber-yellow/20' : 'text-red-400 border-red-400/20'
         )}>
           {bounty.difficulty}
         </span>
         <span className="text-cyber-blue font-mono font-bold text-sm">{bounty.reward}</span>
      </div>
      <h4 className="font-bold font-display text-base leading-tight mb-4 text-white">{bounty.title}</h4>
      <div className="flex flex-wrap gap-2">
        {bounty.tags.map(tag => (
          <span key={tag} className="text-[9px] text-white/40 font-mono border border-white/10 px-1 bg-black/50">#{tag}</span>
        ))}
      </div>
    </motion.div>
  );
}

function RepoList() {
  const { repos } = useStore();
  return (
    <div className="grid grid-cols-1 gap-4">
      {repos.map((repo) => (
        <motion.div 
          key={repo.id}
          whileHover={{ x: 5 }}
          className="cyber-card p-6 flex items-center justify-between group border-l-2 border-transparent hover:border-l-cyber-blue transition-all bg-surface/50"
        >
          <div className="flex items-center gap-6">
            <div className="w-10 h-10 bg-cyber-blue/5 flex items-center justify-center text-cyber-blue group-hover:text-white group-hover:bg-cyber-blue transition-colors border border-cyber-blue/20">
              <Code size={20} />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-white group-hover:text-cyber-blue transition-colors">{repo.name}</h3>
              <p className="text-white/60 text-xs font-mono">{repo.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 text-white/60 font-mono text-[10px] uppercase">
                <div className="w-1.5 h-1.5 bg-cyber-yellow" />
                {repo.language}
             </div>
             <div className="flex items-center gap-4 font-mono text-xs text-white/60">
                <div className="flex items-center gap-1"><Star size={12} className="text-cyber-yellow" /> {repo.stars}</div>
                <div className="flex items-center gap-1"><GitBranch size={12} /> {repo.forks}</div>
             </div>
             <button className="p-2 hover:bg-white/10 text-white/40 hover:text-white transition-colors">
               <ExternalLink size={18} />
             </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function AddItemModal({ type, onClose }: { type: 'bounties' | 'repos', onClose: () => void }) {
  const { addBounty, addRepo } = useStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    if (type === 'bounties') {
      addBounty({
        id: Math.random().toString(),
        title: formData.get('title') as string,
        reward: formData.get('reward') as string,
        difficulty: formData.get('difficulty') as any,
        tags: (formData.get('tags') as string).split(',').map(s => s.trim()),
        status: 'Open'
      });
    } else {
      addRepo({
        id: Math.random().toString(),
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        language: formData.get('language') as string,
        stars: 0,
        forks: 0
      });
    }
    onClose();
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-surface cyber-card border border-cyber-blue/50 p-8 w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white"><X /></button>
        <h3 className="text-2xl font-display font-bold mb-6 text-cyber-blue uppercase">ADD {type === 'bounties' ? 'BOUNTY' : 'REPOSITORY'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name={type === 'bounties' ? 'title' : 'name'} placeholder={type === 'bounties' ? 'Bounty Title' : 'Repo Name'} required className="w-full bg-black/50 border border-white/10 p-3 text-white focus:border-cyber-blue outline-none font-mono text-sm" />
          
          {type === 'bounties' ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <input name="reward" placeholder="Reward (e.g. $500)" required className="bg-black/50 border border-white/10 p-3 text-white focus:border-cyber-blue outline-none font-mono text-sm" />
                <select name="difficulty" className="bg-black/50 border border-white/10 p-3 text-white focus:border-cyber-blue outline-none font-mono text-sm">
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <input name="tags" placeholder="Tags (comma separated)" required className="w-full bg-black/50 border border-white/10 p-3 text-white focus:border-cyber-blue outline-none font-mono text-sm" />
            </>
          ) : (
            <>
              <textarea name="description" placeholder="Description" rows={3} required className="w-full bg-black/50 border border-white/10 p-3 text-white focus:border-cyber-blue outline-none font-mono text-sm" />
              <input name="language" placeholder="Language (e.g. Rust)" required className="w-full bg-black/50 border border-white/10 p-3 text-white focus:border-cyber-blue outline-none font-mono text-sm" />
            </>
          )}

          <button type="submit" className="w-full bg-cyber-yellow text-black font-display font-bold py-3 cyber-button hover:bg-white transition-colors uppercase tracking-widest">CONFIRM UPLOAD</button>
        </form>
      </motion.div>
    </div>,
    document.body
  );
}


import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Save, Upload, X, Github, Twitter, Send, LogOut, Check, CreditCard } from 'lucide-react';
import { useStore } from '../store/useStore';
import { AVAILABLE_SKILLS, ROLES, BANKS } from '../data/mockData';
import { clsx } from 'clsx';

export function MyProfile() {
  const { currentUser, isWalletConnected, updateCurrentUser, disconnectWallet } = useStore();
  const navigate = useNavigate();

  // Local state for form
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [avatar, setAvatar] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [github, setGithub] = useState('');
  const [twitter, setTwitter] = useState('');
  const [telegram, setTelegram] = useState('');
  
  // Banking state
  const [bankId, setBankId] = useState('');
  const [accountNo, setAccountNo] = useState('');

  useEffect(() => {
    if (!isWalletConnected || !currentUser) {
      navigate('/');
      return;
    }
    // Load current data
    setName(currentUser.name);
    setRole(currentUser.role);
    setAvatar(currentUser.avatar);
    setSkills(currentUser.skills);
    setGithub(currentUser.socials.github || '');
    setTwitter(currentUser.socials.twitter || '');
    setTelegram(currentUser.socials.telegram || '');
    setBankId(currentUser.bankInfo?.bankId || '');
    setAccountNo(currentUser.bankInfo?.accountNo || '');
  }, [currentUser, isWalletConnected, navigate]);

  const toggleSkill = (skill: string) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter(s => s !== skill));
    } else {
      if (skills.length < 5) {
        setSkills([...skills, skill]);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateCurrentUser({
      name,
      role,
      avatar,
      skills,
      socials: {
        github,
        twitter,
        telegram
      },
      bankInfo: bankId && accountNo ? { bankId, accountNo } : undefined
    });
    alert('PROTOCOL UPDATED SUCCESSFULLY');
  };

  const handleLogout = () => {
    disconnectWallet();
    navigate('/');
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-cyber-blue/20 pb-6">
        <div>
          <h2 className="text-4xl font-display font-bold mb-1 text-white">MY PROFILE</h2>
          <p className="text-cyber-blue font-mono text-sm">Configure your operative identity.</p>
        </div>
        <div className="flex gap-4">
           <button 
            onClick={handleLogout}
            className="bg-red-900/20 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white font-display font-bold text-sm px-4 py-3 cyber-button flex items-center gap-2 transition-all uppercase tracking-widest"
          >
            <LogOut size={16} /> TERMINATE
          </button>
          <button 
            onClick={handleSave}
            className="bg-cyber-yellow text-black hover:bg-white font-display font-bold text-sm px-8 py-3 cyber-button flex items-center gap-2 transition-all uppercase tracking-widest shadow-[0_0_15px_rgba(255,214,0,0.3)] hover:shadow-[0_0_25px_rgba(255,214,0,0.5)]"
          >
            <Save size={16} /> UPDATE PROTOCOL
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Col: Avatar & Preview */}
        <motion.div 
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           className="cyber-card p-6 flex flex-col items-center bg-surface/50 h-fit"
        >
          <div className="w-40 h-40 rounded-full p-2 border-2 border-dashed border-cyber-blue/30 mb-6 relative group overflow-hidden">
            <div className="absolute inset-0 rounded-full border border-cyber-blue/50 animate-pulse-fast opacity-50 pointer-events-none"></div>
            <img src={avatar} alt="Avatar" className="w-full h-full object-cover rounded-full bg-black/50" />
            
            {/* Upload Overlay */}
            <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
               <Upload className="text-cyber-yellow mb-1" />
               <span className="text-[10px] font-mono text-white uppercase">Upload Img</span>
               <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
          
          <div className="w-full text-center">
             <span className="text-[10px] text-white/40 font-mono uppercase tracking-wider block mb-1">Current Clearance</span>
             <span className="text-cyber-blue font-bold font-display">{role || 'UNASSIGNED'}</span>
          </div>
        </motion.div>

        {/* Right Col: Details Form */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="md:col-span-2 space-y-8"
        >
          {/* Core Info */}
          <div className="cyber-card p-8 bg-surface/50 border border-cyber-blue/20">
             <h3 className="text-xl font-display font-bold text-cyber-blue mb-6 flex items-center gap-2">
               <span className="w-2 h-6 bg-cyber-blue block" /> 
               IDENTITY MODULE
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                 <label className="text-xs font-mono text-cyber-yellow uppercase tracking-wider">Operative Name</label>
                 <input 
                   value={name} 
                   onChange={e => setName(e.target.value)}
                   className="w-full bg-black/30 border border-white/10 p-3 text-white focus:border-cyber-blue outline-none font-display font-bold text-lg" 
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-xs font-mono text-cyber-yellow uppercase tracking-wider">Assigned Role</label>
                 <select 
                   value={role} 
                   onChange={e => setRole(e.target.value)}
                   className="w-full bg-black/30 border border-white/10 p-3 text-white focus:border-cyber-blue outline-none font-mono text-sm appearance-none" 
                 >
                   <option value="" disabled>Select Rank</option>
                   {ROLES.map(r => (
                     <option key={r} value={r} className="bg-black text-white">{r}</option>
                   ))}
                 </select>
               </div>
             </div>
          </div>

          {/* Financial Protocol */}
          <div className="cyber-card p-8 bg-surface/50 border border-cyber-blue/20">
             <h3 className="text-xl font-display font-bold text-cyber-blue mb-6 flex items-center gap-2">
               <span className="w-2 h-6 bg-cyber-blue block" /> 
               FINANCIAL PROTOCOL
             </h3>
             <p className="text-[10px] text-white/40 font-mono mb-6">Linked account for treasury disbursements and direct transfers.</p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                 <label className="text-xs font-mono text-cyber-yellow uppercase tracking-wider flex items-center gap-2"><CreditCard size={12}/> Bank Institute</label>
                 <select 
                   value={bankId} 
                   onChange={e => setBankId(e.target.value)}
                   className="w-full bg-black/30 border border-white/10 p-3 text-white focus:border-cyber-blue outline-none font-mono text-sm appearance-none" 
                 >
                   <option value="" disabled>Select Bank</option>
                   {BANKS.map(b => (
                     <option key={b.id} value={b.id} className="bg-black text-white">{b.shortName} - {b.name}</option>
                   ))}
                 </select>
               </div>
               <div className="space-y-2">
                 <label className="text-xs font-mono text-cyber-yellow uppercase tracking-wider">Account Number</label>
                 <input 
                   value={accountNo} 
                   onChange={e => setAccountNo(e.target.value)}
                   placeholder="0000 0000 0000"
                   className="w-full bg-black/30 border border-white/10 p-3 text-white focus:border-cyber-blue outline-none font-mono text-sm tracking-widest" 
                 />
               </div>
             </div>
          </div>

          {/* Skills */}
          <div className="cyber-card p-8 bg-surface/50 border border-cyber-blue/20">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-display font-bold text-cyber-blue flex items-center gap-2">
                  <span className="w-2 h-6 bg-cyber-blue block" /> 
                  SKILL MATRIX
                </h3>
                <span className="text-xs font-mono text-white/40">{skills.length}/5 Selected</span>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
               {AVAILABLE_SKILLS.map(skill => {
                 const isSelected = skills.includes(skill);
                 return (
                   <div 
                     key={skill}
                     onClick={() => toggleSkill(skill)}
                     className={clsx(
                       "flex items-center gap-2 px-3 py-2 text-xs font-mono border cursor-pointer transition-all",
                       isSelected 
                        ? "bg-cyber-blue/20 border-cyber-blue text-white" 
                        : "bg-black/30 border-white/10 text-white/40 hover:border-white/30"
                     )}
                   >
                     <div className={clsx("w-3 h-3 border flex items-center justify-center", isSelected ? "border-cyber-blue bg-cyber-blue" : "border-white/30")}>
                        {isSelected && <Check size={10} className="text-black" />}
                     </div>
                     {skill}
                   </div>
                 );
               })}
             </div>
          </div>

          {/* Socials */}
          <div className="cyber-card p-8 bg-surface/50 border border-cyber-blue/20">
             <h3 className="text-xl font-display font-bold text-cyber-blue mb-6 flex items-center gap-2">
               <span className="w-2 h-6 bg-cyber-blue block" /> 
               COMMS LINK (URL)
             </h3>
             <div className="space-y-4">
               <div className="flex items-center gap-4">
                 <Github className="text-white/40" size={20} />
                 <input 
                   type="url"
                   value={github} 
                   onChange={e => setGithub(e.target.value)}
                   placeholder="https://github.com/username"
                   className="flex-1 bg-black/30 border border-white/10 p-2 text-white focus:border-cyber-blue outline-none font-mono text-sm" 
                 />
               </div>
               <div className="flex items-center gap-4">
                 <Twitter className="text-white/40" size={20} />
                 <input 
                   type="url"
                   value={twitter} 
                   onChange={e => setTwitter(e.target.value)}
                   placeholder="https://x.com/username"
                   className="flex-1 bg-black/30 border border-white/10 p-2 text-white focus:border-cyber-blue outline-none font-mono text-sm" 
                 />
               </div>
               <div className="flex items-center gap-4">
                 <Send className="text-white/40" size={20} />
                 <input 
                   type="url"
                   value={telegram} 
                   onChange={e => setTelegram(e.target.value)}
                   placeholder="https://t.me/username"
                   className="flex-1 bg-black/30 border border-white/10 p-2 text-white focus:border-cyber-blue outline-none font-mono text-sm" 
                 />
               </div>
             </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}

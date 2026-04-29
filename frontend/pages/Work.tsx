import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { GitBranch, Star, Code, ExternalLink, Plus, X, Briefcase } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Bounty, Repo } from '../types';
import { clsx } from 'clsx';

export function Work() {
  const [activeTab, setActiveTab] = useState<'bounties' | 'repos'>('bounties');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentUser } = useStore();
  const canManage = currentUser?.memberType === 'member';

  const handleAddClick = () => {
    if (!currentUser) {
      alert('Vui lòng đăng nhập trước!');
      return;
    }

    if (!canManage) {
      alert('Tài khoản cộng đồng không thể tạo dự án/nhiệm vụ.');
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 pt-10 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-200 pb-6 gap-6">
         <div>
           <h2 className="text-4xl sm:text-5xl font-display font-bold text-slate-800 tracking-tight">HOẠT ĐỘNG</h2>
           <p className="text-slate-500 font-medium text-sm mt-2">Nhiệm vụ (Bounties) & Mã nguồn mở từ DSUC.</p>
         </div>
         <button 
           onClick={handleAddClick}
           disabled={!canManage}
           className={`font-black text-sm px-6 py-4 border-4 transition-all w-full flex items-center justify-center gap-2 sm:w-auto brutal-btn ${
             canManage
               ? 'bg-brutal-yellow text-brutal-black border-brutal-black hover:bg-brutal-pink' 
               : 'bg-gray-200 text-gray-500 cursor-not-allowed border-gray-400'
           }`}
         >
           <Plus size={20} /> THÊM {activeTab === 'bounties' ? 'BOUNTY' : 'REPO'}
           {!canManage && <span className="text-[10px] uppercase font-black tracking-widest ml-1">(Chỉ Member)</span>}
         </button>
      </div>

      <div className="flex bg-white border-4 border-brutal-black w-fit shadow-neo-sm">
        <TabButton active={activeTab === 'bounties'} onClick={() => setActiveTab('bounties')}>
          Bounties (Nhiệm vụ)
        </TabButton>
        <TabButton active={activeTab === 'repos'} onClick={() => setActiveTab('repos')}>
          Mã Nguồn Mở
        </TabButton>
      </div>

      {activeTab === 'bounties' ? <BountyBoard /> : <RepoList />}
      
      {isModalOpen && canManage && <AddItemModal type={activeTab} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}

function TabButton({ children, active, onClick }: { children?: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={clsx(
        "px-6 py-3 text-sm font-black uppercase transition-colors whitespace-nowrap border-x-2 border-transparent first:border-l-0 last:border-r-0",
        active ? "bg-brutal-blue text-white border-r-brutal-black hover:bg-brutal-pink hover:text-brutal-black" : "text-gray-500 hover:text-brutal-black hover:bg-brutal-yellow"
      )}
    >
      {children}
    </button>
  );
}

function BountyBoard() {
  const { bounties } = useStore();
  const columns = ['Open', 'In Progress', 'Completed', 'Closed'];

  const STATUS_LABELS: Record<string, string> = {
    'Open': 'Đang Mở',
    'In Progress': 'Đang Thực Hiện',
    'Completed': 'Đã Hoàn Thành',
    'Closed': 'Đã Đóng'
  };

  const STATUS_COLORS: Record<string, string> = {
    'Open': 'bg-brutal-green',
    'In Progress': 'bg-brutal-blue',
    'Completed': 'bg-brutal-yellow',
    'Closed': 'bg-gray-300'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 tracking-tight">
      {columns.map(status => (
        <div key={status} className="bg-white border-4 border-brutal-black p-4 shadow-neo">
          <div className="flex items-center gap-2 mb-4 border-b-4 border-brutal-black pb-3">
            <div className={clsx("w-3 h-3 border-2 border-brutal-black", STATUS_COLORS[status])} />
            <span className="font-black text-sm uppercase tracking-widest text-brutal-black shrink-0">{STATUS_LABELS[status] || status}</span>
            <span className="ml-auto bg-brutal-pink border-2 border-brutal-black text-brutal-black text-xs font-black px-2 py-0.5 shadow-neo-sm">
              {bounties.filter(b => b.status === status).length}
            </span>
          </div>

          <div className="space-y-6">
             {bounties.filter(b => b.status === status).map(bounty => (
               <BountyCard key={bounty.id} bounty={bounty} />
             ))}
             {bounties.filter(b => b.status === status).length === 0 && (
                <div className="h-24 border-4 border-dashed border-brutal-black flex items-center justify-center text-brutal-black text-xs font-black uppercase tracking-widest bg-gray-50">
                  Trống
                </div>
             )}
          </div>
        </div>
      ))}
    </div>
  );
}

function BountyCard({ bounty }: { bounty: Bounty; key?: React.Key }) {
  const DIFFICULTY_INFO = {
    'Easy': { text: 'Dễ', color: 'text-brutal-black bg-brutal-green border-brutal-black' },
    'Medium': { text: 'Trang bình', color: 'text-brutal-black bg-brutal-yellow border-brutal-black' },
    'Hard': { text: 'Khó', color: 'text-white bg-brutal-red border-brutal-black' },
  }[bounty.difficulty] || { text: bounty.difficulty, color: 'text-brutal-black bg-white border-brutal-black' };

  const content = (
    <div className="bg-white p-5 border-4 border-brutal-black shadow-neo-sm hover:shadow-neo hover:-translate-y-1 hover:-translate-x-1 transition-all group flex flex-col h-full relative cursor-pointer brutal-card">
      <div className="flex justify-between items-start mb-4">
         <span className={clsx("text-[10px] font-black px-2.5 py-1 uppercase border-2 shadow-neo-sm", DIFFICULTY_INFO.color)}>
           {DIFFICULTY_INFO.text}
         </span>
         <span className="text-brutal-black bg-brutal-yellow font-black text-sm px-2 py-1 border-2 border-brutal-black shadow-neo-sm uppercase">{bounty.reward}</span>
      </div>
      <h4 className="font-black font-display text-brutal-black text-xl leading-tight mb-4 group-hover:underline decoration-brutal-blue decoration-4 underline-offset-2 uppercase">{bounty.title}</h4>
      <div className="flex flex-wrap gap-2 mb-6">
        {bounty.tags.map(tag => (
          <span key={tag} className="text-[10px] text-brutal-black font-black uppercase tracking-wider border-2 border-brutal-black px-2.5 py-1 bg-white shadow-neo-sm">#{tag}</span>
        ))}
      </div>
      {bounty.submitLink && (
        <div className="mt-auto w-full py-3 bg-brutal-pink text-brutal-black hover:bg-brutal-blue rounded-none font-black text-xs transition-all flex items-center justify-center gap-2 border-4 border-brutal-black group-hover:shadow-neo-sm">
          TỚI TRANG NHIỆM VỤ
          <ExternalLink size={16} className="group-hover:translate-x-1 transition-transform border-l-2 border-brutal-black pl-1" />
        </div>
      )}
    </div>
  );

  if (bounty.submitLink) {
    return (
      <motion.a
        whileHover={{ y: -2 }}
        href={bounty.submitLink}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.div whileHover={{ y: -2 }} className="block">
      {content}
    </motion.div>
  );
}

function RepoList() {
  const { repos } = useStore();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {repos.map((repo) => {
        const content = (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10 w-full h-full">
            <div className="flex items-start sm:items-center gap-5 flex-1">
              <div className="w-16 h-16 bg-brutal-blue flex items-center justify-center text-white border-4 border-brutal-black shadow-neo-sm shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
                <Code size={32} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-display font-black text-brutal-black group-hover:underline decoration-brutal-pink decoration-4 underline-offset-4 tracking-tight uppercase line-clamp-1">{repo.name}</h3>
                <p className="text-brutal-black font-bold text-sm mt-2 line-clamp-2">{repo.description}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4 pl-5 shrink-0 sm:mt-0 sm:pl-0">
               <div className="flex items-center gap-2 text-brutal-black font-black text-[10px] uppercase tracking-widest bg-brutal-yellow px-3 py-1.5 border-2 border-brutal-black shadow-neo-sm">
                  <div className="w-2 h-2 rounded-full bg-brutal-black" />
                  {repo.language}
               </div>
               <div className="flex items-center gap-4 text-sm font-black text-brutal-black bg-white px-3 py-1.5 border-2 border-brutal-black shadow-neo-sm">
                  <div className="flex items-center gap-1.5"><Star size={16} className="text-brutal-black" /> {repo.stars}</div>
                  <div className="flex items-center gap-1.5"><GitBranch size={16} className="text-brutal-black" /> {repo.forks}</div>
               </div>
               <div className="p-2 text-brutal-black bg-brutal-pink border-2 border-brutal-black shadow-neo-sm group-hover:-rotate-12 transition-transform sm:block hidden">
                 <ExternalLink size={20} />
               </div>
            </div>
          </div>
        );

        const className = clsx(
          "bg-white p-6 md:p-8 flex flex-col justify-center border-4 border-brutal-black transition-all shadow-neo relative overflow-hidden group brutal-card duration-300 h-full",
          repo.repoLink
            ? "hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo-lg cursor-pointer"
            : "opacity-75 cursor-default"
        );

        if (repo.repoLink) {
          return (
            <motion.a
              key={repo.id}
              whileHover={{ scale: 1.01 }}
              href={repo.repoLink}
              target="_blank"
              rel="noopener noreferrer"
              className={className}
            >
              <div className="absolute top-0 bottom-0 left-0 w-1 bg-sky-400 scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom" />
              {content}
            </motion.a>
          );
        }

        return (
          <motion.div key={repo.id} whileHover={{ scale: 1.01 }} className={className}>
            {content}
          </motion.div>
        );
      })}
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
        status: 'Open',
        submitLink: formData.get('submitLink') as string || undefined
      });
    } else {
      addRepo({
        id: Math.random().toString(),
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        language: formData.get('language') as string,
        stars: 0,
        forks: 0,
        repoLink: formData.get('repoLink') as string || undefined
      });
    }
    onClose();
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        className="bg-white rounded-[2rem] border border-slate-100 p-8 w-full max-w-lg relative z-10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors z-10">
          <X size={20} />
        </button>
        <div className="mb-8 pr-10">
          <h3 className="text-2xl font-display font-bold text-slate-800">THÊM {type === 'bounties' ? 'NHIỆM VỤ' : 'MÃ NGUỒN'}</h3>
          <p className="text-slate-500 text-sm font-medium mt-1">
            {type === 'bounties' ? 'Đăng tải nhiệm vụ để các thành viên khác thực hiện và nhận thưởng.' : 'Chia sẻ mã nguồn mở cho cộng đồng cùng tham khảo và đóng góp.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">{type === 'bounties' ? 'Tên nhiệm vụ' : 'Tên Repo'}</label>
            <input name={type === 'bounties' ? 'title' : 'name'} placeholder={type === 'bounties' ? 'Ví dụ: Sửa bug UI trang đăng nhập' : 'DSUC-Labs-Core'} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none font-medium text-sm transition-all shadow-sm" />
          </div>
          
          {type === 'bounties' ? (
             <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Phần Thưởng</label>
                    <input name="reward" placeholder="Ví dụ: $500, 100 Điểm..." required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sky-600 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none font-medium text-sm transition-all shadow-sm font-bold" />
                 </div>
                 <div className="space-y-1.5">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Độ khó</label>
                     <select name="difficulty" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none font-medium text-sm transition-all shadow-sm appearance-none">
                       <option value="Easy">Dễ</option>
                       <option value="Medium">Trung bình</option>
                       <option value="Hard">Khó</option>
                     </select>
                 </div>
               </div>
               <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Tags (Cách nhau dấu phẩy)</label>
                 <input name="tags" placeholder="UI, React, Bugfix..." required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none font-medium text-sm transition-all shadow-sm" />
               </div>
               <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Link nhiệm vụ/Issue (Tuỳ chọn)</label>
                 <input name="submitLink" placeholder="https://github.com/.../issues/1" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none font-medium text-sm transition-all shadow-sm" />
               </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Mô tả</label>
                <textarea name="description" placeholder="Giới thiệu sơ lược về repository..." rows={3} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none font-medium text-sm transition-all shadow-sm resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Ngôn ngữ chính</label>
                    <input name="language" placeholder="Ví dụ: TypeScript, Rust..." required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none font-medium text-sm transition-all shadow-sm" />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Link Repository</label>
                    <input name="repoLink" placeholder="https://github.com/..." required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sky-600 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none font-medium text-sm transition-all shadow-sm" />
                 </div>
              </div>
            </div>
          )}

          <button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-4 rounded-full transition-all shadow-sm hover:shadow uppercase tracking-wider text-sm mt-6">TẠO MỚI</button>
        </form>
      </motion.div>
    </div>,
    document.body
  );
}

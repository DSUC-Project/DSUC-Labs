import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { FileText, Link as LinkIcon, Download, Plus, X, Video, Book, Trophy } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Resource, ResourceCategory } from '../types';

const CATEGORIES: ResourceCategory[] = ['Learning', 'Training', 'Document', 'Media', 'Hackathon'];

const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  Learning: 'Học tập',
  Training: 'Đào tạo',
  Document: 'Tài liệu',
  Media: 'Truyền thông',
  Hackathon: 'Hackathon'
};

export function Resources() {
  const { resources, addResource, currentUser } = useStore();
  const [filter, setFilter] = useState<ResourceCategory | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const canManage = currentUser?.memberType === 'member';

  const filteredResources = filter === 'All' ? resources : resources.filter(r => r.category === filter);

  const handleAddClick = () => {
    if (!currentUser) {
      alert('Vui lòng đăng nhập trước!');
      return;
    }
    if (!canManage) {
      alert('Tài khoản cộng đồng không thể thêm tài nguyên.');
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <div className="pt-10 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 border-b border-slate-200 pb-6 gap-6">
         <div>
            <h2 className="text-4xl sm:text-5xl font-display font-bold mb-2 text-slate-800 tracking-tight">KHO LƯU TRỮ</h2>
            <p className="text-slate-500 font-medium text-sm">Tài liệu, khóa học và các tài nguyên nội bộ của DSUC.</p>
         </div>
         <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
           <button 
             onClick={() => setFilter('All')} 
             className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-colors whitespace-nowrap ${filter === 'All' ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
           >
             Tất cả
           </button>
           {CATEGORIES.map(cat => (
             <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-colors whitespace-nowrap ${filter === cat ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
             >
               {CATEGORY_LABELS[cat] || cat}
             </button>
           ))}
           <button 
             onClick={handleAddClick}
             disabled={!canManage}
             className={`ml-0 lg:ml-2 mt-2 lg:mt-0 px-5 py-2 font-bold text-xs rounded-full flex items-center justify-center gap-2 w-full lg:w-auto transition-colors ${
               canManage
                 ? 'bg-amber-400 text-amber-950 hover:bg-amber-500 shadow-sm' 
                 : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
             }`}
           >
             <Plus size={16} /> THÊM MỚI
           </button>
         </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredResources.map((resource, i) => (
          <ResourceCard key={resource.id} resource={resource} index={i} />
        ))}
        {filteredResources.length === 0 && (
           <div className="col-span-full py-16 text-center text-slate-500 font-medium bg-slate-50 rounded-3xl border border-slate-100">
             Chưa có tài nguyên nào trong mục này.
           </div>
        )}
      </div>

      <AddResourceModal isOpen={isModalOpen && canManage} onClose={() => setIsModalOpen(false)} onAdd={addResource} />
    </div>
  );
}

function ResourceCard({ resource, index }: { resource: Resource, index: number, key?: React.Key }) {
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

  const handleAccess = () => {
    if (resource.url) {
      window.open(resource.url, '_blank', 'noopener,noreferrer');
    } else {
      alert('Chưa có link cho tài nguyên này');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={handleAccess}
      className="bg-white p-6 group cursor-pointer hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo-lg transition-all flex flex-col items-center text-center gap-5 border-4 border-brutal-black h-full overflow-hidden relative brutal-card"
    >
      <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-brutal-blue to-brutal-yellow scale-x-0 group-hover:scale-x-100 transition-transform origin-left border-b-2 border-brutal-black" />

      <div className="w-16 h-16 bg-brutal-yellow text-brutal-black flex items-center justify-center group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300 border-4 border-brutal-black shadow-neo-sm mt-3">
        <Icon size={32} />
      </div>

      <div className="flex-1 flex flex-col justify-center w-full">
        <h3 className="font-black font-display text-brutal-black text-lg mb-3 line-clamp-2 leading-tight uppercase group-hover:underline decoration-brutal-pink decoration-2 underline-offset-2">{resource.name}</h3>
        <p className="text-[10px] text-brutal-black font-black uppercase tracking-widest bg-brutal-green px-3 py-1.5 border-2 border-brutal-black shadow-neo-sm inline-block w-fit mx-auto">
          {CATEGORY_LABELS[resource.category] || resource.category} {resource.size && `• ${resource.size}`}
        </p>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); handleAccess(); }}
        className="w-full mt-auto py-3 bg-white text-brutal-black font-black text-sm hover:bg-brutal-blue transition-colors flex items-center justify-center gap-2 uppercase tracking-wide border-4 border-brutal-black shadow-neo-sm hover:shadow-neo-none hover:translate-x-0.5 hover:translate-y-0.5"
      >
        <Download size={18} />
        Truy Cập
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

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        className="bg-white rounded-[2rem] border border-slate-100 p-8 w-full max-w-md relative z-10 my-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors z-10">
          <X size={20} />
        </button>
        
        <div className="mb-8 pr-8">
          <h3 className="text-2xl font-display font-bold text-slate-800">Thêm Tài Nguyên</h3>
          <p className="text-slate-500 font-medium text-sm mt-2">Chia sẻ tài liệu vào kho lưu trữ chung của câu lạc bộ.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Tên tài nguyên</label>
            <input name="name" placeholder="Ví dụ: Slide buổi Training ReactJS" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none font-medium text-sm transition-all shadow-sm" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Liên kết (URL)</label>
            <input name="url" placeholder="https://drive.google.com/..." required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sky-600 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none font-medium text-sm transition-all shadow-sm" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Phân loại</label>
            <select name="category" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none font-medium text-sm transition-all shadow-sm appearance-none">
              {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>)}
            </select>
          </div>

          <button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-4 rounded-full transition-all shadow-sm hover:shadow uppercase tracking-wider text-sm mt-6">
            Tải Lên Máy Chủ
          </button>
        </form>
      </motion.div>
    </div>,
    document.body
  );
}

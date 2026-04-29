import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Terminal, Plus, X, Rocket, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Project } from '../types';
import { Link } from 'react-router-dom';

export function Projects() {
  const { projects, addProject, currentUser } = useStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const canManage = currentUser?.memberType === 'member';

  const handleAddClick = () => {
    if (!currentUser) {
      alert('Vui lòng đăng nhập trước!');
      return;
    }
    if (!canManage) {
      alert('Tài khoản cộng đồng không thể tạo dự án.');
      return;
    }
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-12 pt-10 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-4 border-brutal-black pb-6 gap-6">
        <div>
          <h2 className="text-4xl sm:text-5xl font-display font-black mb-2 text-brutal-black tracking-tight uppercase">DỰ ÁN KHỞI NGHIỆP</h2>
          <p className="text-brutal-black font-bold text-sm border-l-4 border-brutal-blue pl-4">Các sản phẩm đã triển khai và dự án đang được phát triển.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
           <div className="font-black text-xs text-brutal-black border-4 border-brutal-black px-4 py-2 bg-brutal-yellow flex items-center gap-2 shadow-neo-sm uppercase tracking-wider">
              <Rocket size={16} />
              {projects.length} DỰ ÁN
           </div>
           <button 
             onClick={handleAddClick}
             disabled={!canManage}
             className={`font-black text-sm px-6 py-3 border-4 flex items-center justify-center gap-2 transition-all w-full sm:w-auto shadow-neo-sm uppercase tracking-wider ${
               canManage
                 ? 'bg-brutal-pink text-brutal-black border-brutal-black hover:bg-brutal-yellow hover:-translate-y-1' 
                 : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300'
             }`}
           >
             <Plus size={16} /> THÊM DỰ ÁN
             {!canManage && <span className="text-[10px] uppercase font-bold tracking-widest ml-1">(Chỉ Member)</span>}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project, index) => (
          <Link to={`/project/${project.id}`} key={project.id} className="block h-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-8 border-4 border-brutal-black brutal-card hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo-lg transition-all duration-300 h-full flex flex-col cursor-pointer overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brutal-blue opacity-10 group-hover:opacity-30 transition-opacity duration-500 -z-0" />
              
              <div className="relative z-10 flex justify-between items-start mb-6">
                <div className={`w-14 h-14 border-4 border-brutal-black flex items-center justify-center shadow-neo-sm group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 ${index % 2 === 0 ? 'bg-brutal-blue text-white' : 'bg-brutal-pink text-brutal-black'}`}>
                   {index % 2 === 0 ? <Layers size={28} /> : <Terminal size={28} />}
                </div>
                <div className="p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-brutal-yellow border-2 border-brutal-black shadow-neo-sm text-brutal-black">
                  <ArrowRight size={20} />
                </div>
              </div>

              <div className="mb-6 relative z-10 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-brutal-green text-brutal-black border-2 border-brutal-black inline-block mb-4 shadow-neo-sm">
                  {project.category}
                </span>
                <h3 className="text-2xl font-display font-black text-brutal-black mb-3 tracking-tight line-clamp-1 uppercase">
                  {project.name}
                </h3>
                <p className="text-brutal-black font-bold text-sm leading-relaxed line-clamp-3">
                  {project.description}
                </p>
              </div>

              <div className="mt-auto pt-6 border-t-4 border-brutal-black relative z-10">
                <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest block mb-3">Thành viên phát triển</span>
                <div className="flex flex-wrap gap-2">
                  {project.builders.map(builder => (
                    <span key={builder} className="text-[11px] font-bold text-brutal-black bg-white px-3 py-1.5 border-2 border-brutal-black shadow-neo-sm uppercase">
                      {builder}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
      
      {/* Add Project Modal */}
      <AddProjectModal isOpen={isAddModalOpen && canManage} onClose={() => setIsAddModalOpen(false)} onAdd={addProject} />
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

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        className="bg-white border-4 border-brutal-black p-8 w-full max-w-lg relative z-10 my-8 max-h-[90vh] overflow-y-auto shadow-neo-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-brutal-black hover:text-brutal-black bg-white hover:bg-brutal-yellow p-2 border-2 border-transparent hover:border-brutal-black transition-colors z-10">
          <X size={20} />
        </button>
        
        <div className="mb-8 pr-10">
          <h3 className="text-2xl font-display font-black text-brutal-black uppercase">Thêm Dự Án Mới</h3>
          <p className="text-brutal-black text-sm font-bold mt-2 border-l-4 border-brutal-pink pl-4">Đăng tải sản phẩm lên danh mục của câu lạc bộ.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-brutal-black uppercase tracking-widest pl-1">Tên dự án</label>
            <input name="name" placeholder="Ví dụ: DSUC Academy" required className="w-full bg-white border-4 border-brutal-black px-4 py-3 text-brutal-black outline-none font-bold text-sm transition-all focus:bg-brutal-yellow/20" />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-black text-brutal-black uppercase tracking-widest pl-1">Mô tả ngắn</label>
            <textarea name="description" placeholder="Nền tảng học hỏi và phát triển..." rows={3} required className="w-full bg-white border-4 border-brutal-black px-4 py-3 text-brutal-black outline-none font-bold text-sm transition-all focus:bg-brutal-yellow/20 resize-none" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-brutal-black uppercase tracking-widest pl-1">Danh mục</label>
            <input name="category" placeholder="Ví dụ: EdTech, Defi, Web3..." required className="w-full bg-white border-4 border-brutal-black px-4 py-3 text-brutal-black outline-none font-bold text-sm transition-all focus:bg-brutal-yellow/20" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-brutal-black uppercase tracking-widest pl-1">Đội ngũ (Cách nhau bằng dấu phẩy)</label>
            <input name="builders" placeholder="Zah, Cuong, Hieu..." required className="w-full bg-white border-4 border-brutal-black px-4 py-3 text-brutal-black outline-none font-bold text-sm transition-all focus:bg-brutal-yellow/20" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-brutal-black uppercase tracking-widest pl-1">Link Website</label>
              <input name="link" placeholder="https://" required className="w-full bg-white border-4 border-brutal-black px-4 py-3 text-brutal-blue outline-none font-bold text-sm transition-all focus:bg-brutal-yellow/20" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-black text-brutal-black uppercase tracking-widest pl-1">Link GitHub Repo</label>
              <input name="repoLink" placeholder="https://github.com/..." className="w-full bg-white border-4 border-brutal-black px-4 py-3 text-brutal-black outline-none font-bold text-sm transition-all focus:bg-brutal-yellow/20" />
            </div>
          </div>

          <button type="submit" className="w-full border-4 border-brutal-black bg-brutal-blue text-white font-black py-4 hover:bg-brutal-pink hover:text-brutal-black transition-all shadow-neo uppercase tracking-wider text-sm mt-4 hover:-translate-y-1">Tạo Dự Án</button>
        </form>
      </motion.div>
    </div>,
    document.body
  );
}

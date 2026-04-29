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
    return <div className="text-slate-800 text-center pt-20 font-bold uppercase tracking-widest">Không tìm thấy hệ thống</div>;
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('ĐÃ SAO CHÉP LIÊN KẾT');
  };

  return (
    <div className="max-w-4xl mx-auto pt-10 pb-20 px-4 sm:px-6">
      <button 
        onClick={() => navigate('/projects')}
        className="mb-8 flex items-center gap-2 text-slate-500 hover:text-sky-600 transition-colors font-bold text-xs uppercase tracking-widest px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm hover:shadow"
      >
        <ArrowLeft size={16} /> Quay Lại DSKT
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-4 border-brutal-black p-8 md:p-12 relative overflow-hidden shadow-neo-xl"
      >
        {/* Background Grid Accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-brutal-blue opacity-10 pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brutal-yellow opacity-10 pointer-events-none -ml-20 -mb-20" />
        
        <button 
          onClick={handleCopyLink}
          className="absolute top-8 right-8 text-brutal-black hover:bg-brutal-pink bg-brutal-yellow p-3 border-2 border-brutal-black transition-colors z-20 shadow-neo-sm hover:shadow-neo-none hover:translate-x-1 hover:translate-y-1"
          title="Chia Sẻ Liên Kết"
        >
          <Share2 size={24} />
        </button>

        <div className="flex flex-col md:flex-row items-start gap-8 mb-12 relative z-10">
           <div className="w-28 h-28 bg-brutal-blue border-4 border-brutal-black flex items-center justify-center text-white shrink-0 shadow-neo-sm rotate-3 hover:rotate-6 transition-transform duration-300">
              <Rocket size={48} />
           </div>
           
           <div className="flex-1 mt-2">
              <div className="flex flex-wrap items-center gap-3 mb-5">
                 <span className="px-4 py-1.5 bg-brutal-yellow text-brutal-black text-xs font-bold uppercase tracking-widest border-2 border-brutal-black shadow-neo-sm">
                   {project.category}
                 </span>
                 <span className="text-xs text-brutal-black font-bold tracking-widest uppercase flex items-center gap-2 bg-brutal-green px-4 py-1.5 border-2 border-brutal-black shadow-neo-sm">
                   <div className="w-2 h-2 bg-brutal-black rounded-full animate-ping opacity-75 absolute" />
                   <div className="w-2 h-2 bg-brutal-black rounded-full relative z-10" />
                   Hệ Thống Trực Tuyến
                 </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-display font-black text-brutal-black mb-5 leading-tight tracking-tight uppercase underline decoration-brutal-blue decoration-4 underline-offset-4">{project.name}</h1>
              
              <div className="flex flex-wrap gap-2">
                {project.builders.map(b => (
                   <span key={b} className="text-xs font-bold tracking-wide text-brutal-black uppercase bg-white px-3 py-1.5 border-2 border-brutal-black hover:bg-brutal-pink transition-colors cursor-default shadow-neo-sm">
                     {b}
                   </span>
                ))}
              </div>
           </div>
        </div>

        <div className="mb-12 relative z-10 bg-white border-4 border-brutal-black p-8 shadow-neo">
           <h3 className="text-sm font-black text-brutal-black uppercase mb-4 tracking-widest flex items-center gap-3 border-b-2 border-brutal-black pb-2">
             <span className="w-3 h-3 bg-brutal-pink border-2 border-brutal-black block" /> Tổng Quan Dự Án
           </h3>
           <p className="text-brutal-black font-bold leading-relaxed pl-5 border-l-4 border-brutal-blue">
             {project.description}
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
           <a 
             href={project.link} 
             target="_blank" 
             rel="noreferrer"
             className="bg-brutal-blue text-brutal-black border-4 border-brutal-black py-4 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-neo hover:shadow-neo-none hover:translate-x-1 hover:translate-y-1 transition-all"
           >
             <ExternalLink size={20} /> Khởi Động Demo
           </a>
           {project.repoLink && (
             <a 
               href={project.repoLink} 
               target="_blank" 
               rel="noreferrer"
               className="bg-white text-brutal-black border-4 border-brutal-black py-4 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-neo hover:shadow-neo-none hover:translate-x-1 hover:translate-y-1 transition-all hover:bg-brutal-yellow"
             >
               <Github size={20} /> Truy Cập Mã Nguồn
             </a>
           )}
        </div>
      </motion.div>
    </div>
  );
}

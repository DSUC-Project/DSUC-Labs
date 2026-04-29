import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { MapPin, Users, Plus, X, Calendar } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Event } from '../types';

export function Events() {
  const { events, addEvent, currentUser } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const canManage = currentUser?.memberType === 'member';

  // Sort by date descending - newest first
  const sortedEvents = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAddClick = () => {
    if (!currentUser) {
      alert('Vui lòng đăng nhập trước!');
      return;
    }
    if (!canManage) {
      alert('Tài khoản cộng đồng không thể tạo sự kiện.');
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <div className="relative min-h-screen pb-20 pt-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-16 flex flex-col items-start justify-between gap-6 border-b-4 border-brutal-black pb-6 sm:flex-row sm:items-end">
          <div>
            <h2 className="mb-3 text-4xl font-display font-black uppercase tracking-tighter text-brutal-black decoration-brutal-yellow decoration-4 underline underline-offset-4 sm:text-5xl">Sự kiện</h2>
            <p className="border-l-4 border-brutal-pink pl-4 text-sm font-bold text-brutal-black">Cập nhật lịch trình hoạt động mới nhất của câu lạc bộ.</p>
          </div>
          <button
            onClick={handleAddClick}
            disabled={!canManage}
            className={`flex w-full items-center justify-center gap-2 border-4 px-6 py-4 text-sm font-black uppercase tracking-wider transition-all sm:w-auto brutal-btn ${canManage
                ? 'bg-brutal-yellow text-brutal-black border-brutal-black hover:bg-brutal-pink'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed border-gray-400'
              }`}
          >
            <Plus size={20} />
            THÊM SỰ KIỆN
            {!canManage && <span className="text-[10px] uppercase font-bold tracking-widest ml-1">(Chỉ Member)</span>}
          </button>
        </div>

        <div className="relative">
          {/* Timeline Line */}
          {sortedEvents.length > 0 && (
            <div className="absolute bottom-0 left-6 top-4 w-2 border-x-2 border-brutal-black bg-brutal-black md:left-1/2 md:-ml-1" />
          )}

          <div className="space-y-12">
            {sortedEvents.map((event, index) => (
              <EventItem key={event.id} event={event} index={index} />
            ))}
            {sortedEvents.length === 0 && (
              <div className="py-20 text-center bg-white border-4 border-brutal-black shadow-neo">
                <Calendar className="w-16 h-16 text-brutal-black mx-auto mb-4" />
                <p className="text-brutal-black font-bold uppercase tracking-widest text-sm">Chưa có sự kiện nào được lên lịch</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <AddEventModal isOpen={isModalOpen && canManage} onClose={() => setIsModalOpen(false)} onAdd={addEvent} />
    </div>
  );
}

function EventItem({ event, index }: { event: Event, index: number, key?: React.Key }) {
  const isLeft = index % 2 === 0;
  const luma_link = event.luma_link || event.luma_link;

  const handleClick = () => {
    if (luma_link) {
      window.open(luma_link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      className={`flex flex-col md:flex-row items-center gap-6 md:gap-12 relative ${isLeft ? '' : 'md:flex-row-reverse'}`}
    >
      {/* Date Node */}
      <div className="md:w-1/2 flex justify-start md:justify-end items-center order-1 md:order-none w-full pl-16 md:pl-0">
        <div className={`text-left ${isLeft ? 'md:text-right' : 'md:text-left'} w-full`}>
          <span className="text-sky-600 font-display text-2xl font-bold tracking-tight">{event.date}</span>
          <span className="block text-gray-500 font-bold tracking-widest uppercase text-xs mt-1">{event.time}</span>
        </div>
      </div>

      {/* Center Dot */}
      <div className="absolute left-6 md:left-1/2 w-6 h-6 bg-brutal-yellow border-4 border-brutal-black transform -translate-x-1/2 md:-translate-x-1/2 z-10 shadow-neo-sm" />

      {/* Card - Clickable */}
      <div className="md:w-1/2 w-full pl-16 md:pl-0">
        <div
          onClick={handleClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleClick()}
          className={`bg-white p-6 md:p-8 border-4 border-brutal-black transition-all group relative ${luma_link ? 'cursor-pointer brutal-card hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo-lg' : 'shadow-neo'
            }`}
        >
          <div className="flex justify-between items-start mb-6">
            <span className="px-3 py-1 bg-brutal-pink text-[10px] font-bold uppercase tracking-widest text-brutal-black border-2 border-brutal-black shadow-neo-sm">
              {event.type}
            </span>
            <div className="flex items-center gap-1.5 text-brutal-black text-xs font-bold bg-brutal-green px-3 py-1 border-2 border-brutal-black shadow-neo-sm">
              <Users size={14} />
              {event.attendees}
            </div>
          </div>

          <h3 className="text-2xl font-display font-black mb-4 text-brutal-black group-hover:underline decoration-brutal-pink decoration-4 underline-offset-4 transition-colors uppercase">{event.title}</h3>

          <div className="flex items-center gap-2 text-brutal-black font-bold bg-brutal-yellow p-3 border-2 border-brutal-black shadow-neo-sm w-fit">
            <MapPin size={18} className="text-brutal-black" />
            <span className="text-sm uppercase">{event.location}</span>
          </div>
          
          {luma_link && (
            <div className="mt-8 border-t-4 border-brutal-black pt-4 flex items-center text-brutal-black text-sm font-bold uppercase tracking-widest group-hover:text-brutal-blue transition-colors">
              Đăng ký tham gia <span className="ml-2 font-black text-xl transition-transform group-hover:translate-x-2">→</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function AddEventModal({ isOpen, onClose, onAdd }: { isOpen: boolean, onClose: () => void, onAdd: (e: Event) => void }) {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    onAdd({
      id: Math.random().toString(),
      title: formData.get('title') as string,
      date: formData.get('date') as string,
      time: formData.get('time') as string,
      location: formData.get('location') as string,
      luma_link: formData.get('luma_link') as string,
      type: 'Workshop',
      attendees: 0
    });
    onClose();
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg border-4 border-brutal-black bg-white p-8 shadow-neo-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-5 top-5 border-2 border-transparent p-2 text-brutal-black transition-colors hover:border-brutal-black hover:bg-brutal-yellow"><X size={20} /></button>
        
        <div className="mb-8">
          <h3 className="text-3xl font-display font-black uppercase tracking-tight text-brutal-black">Tạo sự kiện</h3>
          <p className="mt-3 border-l-4 border-brutal-blue pl-4 text-sm font-bold text-brutal-black">Lên lịch hoạt động và chia sẻ đến các thành viên.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="ml-1 text-xs font-black uppercase tracking-widest text-brutal-black">Tên sự kiện</label>
            <input name="title" placeholder="Ví dụ: DSUC Meetup #01" required className="w-full border-4 border-brutal-black bg-white p-4 pl-5 text-sm font-bold text-brutal-black outline-none transition-colors focus:bg-brutal-yellow/20" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="ml-1 text-xs font-black uppercase tracking-widest text-brutal-black">Ngày diễn ra</label>
              <input name="date" type="date" required className="w-full border-4 border-brutal-black bg-white p-4 px-5 text-sm font-bold text-brutal-black outline-none transition-colors focus:bg-brutal-yellow/20" />
            </div>
            <div className="space-y-2">
              <label className="ml-1 text-xs font-black uppercase tracking-widest text-brutal-black">Thời gian</label>
              <input name="time" type="time" required className="w-full border-4 border-brutal-black bg-white p-4 px-5 text-sm font-bold text-brutal-black outline-none transition-colors focus:bg-brutal-yellow/20" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="ml-1 text-xs font-black uppercase tracking-widest text-brutal-black">Địa điểm</label>
            <input name="location" placeholder="Đà Nẵng, Việt Nam" required className="w-full border-4 border-brutal-black bg-white p-4 pl-5 text-sm font-bold text-brutal-black outline-none transition-colors focus:bg-brutal-yellow/20" />
          </div>

          <div className="space-y-2">
            <label className="ml-1 text-xs font-black uppercase tracking-widest text-brutal-black">Link Luma đăng ký</label>
            <input name="luma_link" type="url" placeholder="https://lu.ma/..." required className="w-full border-4 border-brutal-black bg-white p-4 pl-5 text-sm font-bold text-brutal-blue outline-none transition-colors focus:bg-brutal-yellow/20" />
            <p className="ml-1 mt-1 text-[11px] font-bold text-gray-500">Học viên sẽ được bấm chuyển hướng tới link này khi nhấn đăng ký sự kiện.</p>
          </div>

          <button type="submit" className="mt-4 w-full border-4 border-brutal-black bg-brutal-blue py-4 text-sm font-black uppercase tracking-wider text-white transition-all hover:-translate-y-1 hover:bg-brutal-pink hover:text-brutal-black hover:shadow-neo">Tạo sự kiện mới</button>
        </form>
      </motion.div>
    </div>,
    document.body
  );
}

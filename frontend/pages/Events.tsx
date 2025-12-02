
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { MapPin, Users, ArrowRight, Plus, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Event } from '../types';

export function Events() {
  const { events, addEvent, isWalletConnected } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleAddClick = () => {
    if (!isWalletConnected) {
      alert('Please connect your wallet first!');
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <div className="relative min-h-screen pb-20">
      <div className="flex justify-between items-end mb-16 border-b border-cyber-blue/20 pb-6">
        <div>
          <h2 className="text-4xl font-display font-bold mb-1 text-white">TIMELINE</h2>
          <p className="text-cyber-blue font-mono text-sm">Synchronized club activities.</p>
        </div>
        <button 
          onClick={handleAddClick}
          disabled={!isWalletConnected}
          className={`font-display font-bold text-sm px-6 py-3 cyber-button transition-all flex items-center gap-2 ${
            isWalletConnected 
              ? 'bg-cyber-yellow text-black hover:bg-white' 
              : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
          }`}
        >
          <Plus size={16} />
          INITIATE EVENT
          {!isWalletConnected && <span className="text-[10px] ml-2">(Connect Wallet)</span>}
        </button>
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Timeline Line */}
        <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-cyber-blue/0 via-cyber-blue/30 to-cyber-blue/0" />

        <div className="space-y-20">
          {sortedEvents.map((event, index) => (
            <EventItem key={event.id} event={event} index={index} />
          ))}
        </div>
      </div>

      <AddEventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={addEvent} />
    </div>
  );
}

function EventItem({ event, index }: { event: Event, index: number, key?: React.Key }) {
  const isLeft = index % 2 === 0;
  const lumaLink = event.lumaLink || event.luma_link;

  const handleRegister = () => {
    if (lumaLink) {
      window.open(lumaLink, '_blank', 'noopener,noreferrer');
    } else {
      alert('Registration link not available');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      className={`flex flex-col md:flex-row items-center gap-8 md:gap-12 ${isLeft ? '' : 'md:flex-row-reverse'}`}
    >
      {/* Date Node */}
      <div className="md:w-1/2 flex justify-start md:justify-end items-center order-1 md:order-none w-full pl-16 md:pl-0">
        <div className={`text-left ${isLeft ? 'md:text-right' : 'md:text-left'} w-full`}>
          <span className="text-cyber-blue font-display text-xl font-bold tracking-widest">{event.date}</span>
          <span className="block text-white/40 font-mono text-xs">{event.time}</span>
        </div>
      </div>

      {/* Center Dot */}
      <div className="absolute left-8 md:left-1/2 w-3 h-3 bg-black border border-cyber-blue transform rotate-45 -translate-x-1/2 z-10 shadow-[0_0_10px_#2979FF]" />

      {/* Card */}
      <div className="md:w-1/2 w-full pl-16 md:pl-0">
        <div className="cyber-card p-6 rounded-none hover:bg-cyber-blue/5 transition-all group border-l-2 border-l-cyber-blue/50 relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="px-2 py-0.5 bg-cyber-blue/10 text-[10px] font-bold font-mono uppercase tracking-wider text-cyber-blue border border-cyber-blue/20">
              {event.type}
            </span>
            <div className="flex items-center gap-1 text-white/40 text-xs font-mono">
              <Users size={12} />
              {event.attendees}
            </div>
          </div>
          
          <h3 className="text-xl font-display font-bold mb-2 group-hover:text-cyber-yellow transition-colors uppercase">{event.title}</h3>
          
          <div className="flex items-center gap-2 text-white/50 mb-6 font-mono">
            <MapPin size={14} />
            <span className="text-xs">{event.location}</span>
          </div>

          <button 
            onClick={handleRegister}
            disabled={!lumaLink}
            className="w-full py-2 bg-white/5 hover:bg-cyber-blue hover:text-white font-bold font-display text-sm transition-all flex items-center justify-center gap-2 group/btn cyber-button disabled:opacity-50 disabled:cursor-not-allowed"
          >
            REGISTER
            <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
          </button>
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
      lumaLink: formData.get('lumaLink') as string,
      type: 'Workshop',
      attendees: 0
    });
    onClose();
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-surface cyber-card border border-cyber-blue/50 p-8 w-full max-w-lg relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white"><X /></button>
        <h3 className="text-2xl font-display font-bold mb-6 text-cyber-blue uppercase">New Event Protocol</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-white/40 uppercase">Event Title</label>
            <input name="title" placeholder="DSUC Meetup #01" required className="w-full bg-black/50 border border-white/10 p-3 text-white focus:border-cyber-blue outline-none font-mono text-sm" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-white/40 uppercase">Date</label>
              <input name="date" type="date" required className="w-full bg-black/50 border border-white/10 p-3 text-white focus:border-cyber-blue outline-none font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-white/40 uppercase">Time</label>
              <input name="time" type="time" required className="w-full bg-black/50 border border-white/10 p-3 text-white focus:border-cyber-blue outline-none font-mono text-sm" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-white/40 uppercase">Location</label>
            <input name="location" placeholder="Da Nang, Vietnam" required className="w-full bg-black/50 border border-white/10 p-3 text-white focus:border-cyber-blue outline-none font-mono text-sm" />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-white/40 uppercase">Luma Registration Link</label>
            <input name="lumaLink" type="url" placeholder="https://lu.ma/..." required className="w-full bg-black/50 border border-white/10 p-3 text-white focus:border-cyber-blue outline-none font-mono text-sm" />
            <p className="text-[9px] font-mono text-white/30">Users will be redirected here when they click Register</p>
          </div>
          
          <button type="submit" className="w-full bg-cyber-yellow text-black font-display font-bold py-3 cyber-button hover:bg-white transition-colors uppercase tracking-widest">INITIALIZE</button>
        </form>
      </motion.div>
    </div>,
    document.body
  );
}

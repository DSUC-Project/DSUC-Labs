
import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { ArrowUpRight, Cpu, Globe, Facebook } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useContactModal } from '../components/Layout';

export function Dashboard() {
  const { events } = useStore();
  const { openContactModal } = useContactModal();

  // Get 3 most recent past events (event history)
  const now = new Date();
  const eventHistory = [...events]
    .filter(e => new Date(e.date) <= now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex flex-col justify-center items-center text-center pt-10">

        {/* Technical Deco Lines */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/2 left-0 w-32 h-[1px] bg-cyber-blue" />
          <div className="absolute top-1/2 right-0 w-32 h-[1px] bg-cyber-blue" />
          <div className="absolute top-10 left-10 w-4 h-4 border-l border-t border-cyber-blue" />
          <div className="absolute bottom-10 right-10 w-4 h-4 border-r border-b border-cyber-blue" />
        </div>

        {/* Floating HUD Elements - Smaller & Sharper */}
        <div className="absolute inset-0 pointer-events-none overflow-visible hidden md:block">
          <FloatingBadge className="top-[10%] left-[10%]" delay={0}>
            <div className="flex items-center gap-2 text-cyber-blue text-xs font-mono">
              <Cpu size={14} />
              <span>SYS.ONLINE</span>
            </div>
          </FloatingBadge>
          <FloatingBadge className="bottom-[20%] right-[10%]" delay={1.5}>
            <div className="flex items-center gap-2 text-cyber-yellow text-xs font-mono">
              <Globe size={14} />
              <span>NET.ACTIVE</span>
            </div>
          </FloatingBadge>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 inline-flex items-center gap-2 px-3 py-1 border border-cyber-blue/30 rounded-full bg-cyber-blue/5 text-cyber-blue text-xs font-mono uppercase tracking-widest"
        >
          <span className="w-2 h-2 bg-cyber-blue rounded-full animate-pulse" />
          v2.0.4 System Ready
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-6 max-w-4xl z-10 leading-[1.1] text-white"
        >
          DUT SUPERTEAM <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyber-blue to-white/50">
            UNIVERSITY CLUB LABS
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-white/60 max-w-xl mb-10 z-10 font-sans leading-relaxed"
        >
          A Web3 playground for DUT students to develop skills, launch Solana projects, and grow together as a tech community.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 z-10"
        >
          <button
            onClick={openContactModal}
            className="bg-cyber-yellow text-black font-display font-bold text-sm px-8 py-4 cyber-button hover:bg-white transition-all hover:shadow-[0_0_20px_rgba(255,214,0,0.5)] flex items-center justify-center gap-2"
          >
            CONTACT US <ArrowUpRight size={18} />
          </button>
          <a
            href="https://www.facebook.com/superteamdut.club"
            target="_blank"
            rel="noreferrer"
            className="border border-cyber-blue/50 text-cyber-blue font-display font-bold text-sm px-8 py-4 cyber-button hover:bg-cyber-blue/10 transition-colors flex items-center justify-center gap-2"
          >
            <Facebook size={18} /> FANPAGE
          </a>
        </motion.div>
      </section>

      {/* Stats Tickers - Updated Content */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-b border-cyber-blue/20 py-8 bg-surface/30">
        <StatCard label="Total Member" value="15" suffix="HACKERS" />
        <StatCard label="Active Projects" value="10+" suffix="PROJECTS" />
        <StatCard label="Internship" value="5+" suffix="MEMBERS" />
      </section>

      {/* Event History - 3 Most Recent Past Events */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 bg-cyber-yellow rounded-full animate-pulse" />
          <span className="text-cyber-yellow font-mono text-xs uppercase tracking-widest">Event History</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {eventHistory.map((event, idx) => (
            <React.Fragment key={event.id}>
              <EventCard event={event} idx={idx} />
            </React.Fragment>
          ))}
          {eventHistory.length === 0 && (
            <div className="col-span-3 text-center py-10 border border-dashed border-white/10 text-white/20 font-mono text-sm">
              NO PAST EVENTS
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// Separate EventCard component to avoid closure issues
function EventCard({ event, idx }: { event: any, idx: number }) {
  const luma_link = event.luma_link || event.luma_link;

  console.log("[EventCard] Event:", event.title, "luma_link:", luma_link, "raw event:", event);

  const handleClick = () => {
    console.log("[EventCard] Clicked! luma_link:", luma_link);
    if (luma_link) {
      window.open(luma_link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.1 }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      className={clsx(
        "cyber-card p-4 relative overflow-hidden group transition-all bg-surface/50",
        luma_link ? "cursor-pointer hover:border-cyber-blue hover:shadow-[0_0_20px_rgba(41,121,255,0.3)]" : "cursor-default"
      )}
    >
      {/* Hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyber-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Header with type and date */}
      <div className="flex justify-between items-start mb-3 relative">
        <span className="px-2 py-0.5 border border-white/10 text-[10px] font-mono uppercase bg-black/50 text-white/60">
          {event.type}
        </span>
        <div className="text-right">
          <div className="text-xl font-display font-bold text-white/20 group-hover:text-cyber-blue transition-colors">
            {event.date?.split('-')[2] || '--'}
          </div>
          <div className="text-[10px] font-mono text-white/40 uppercase">
            {event.date ? new Date(event.date).toLocaleString('default', { month: 'short' }) : '---'}
          </div>
        </div>
      </div>

      {/* Title and location */}
      <h3 className="text-lg font-display font-bold mb-1 text-white group-hover:text-cyber-yellow transition-colors truncate">
        {event.title}
      </h3>
      <p className="text-cyber-blue font-mono text-xs">{event.location}</p>
    </motion.div>
  );
}

function FloatingBadge({ children, className, delay }: { children?: React.ReactNode, className?: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        y: [0, -5, 0],
      }}
      transition={{
        y: { repeat: Infinity, duration: 4, ease: "easeInOut", delay },
        opacity: { duration: 0.5, delay }
      }}
      className={clsx("absolute border border-cyber-blue/20 bg-black/80 px-4 py-2 backdrop-blur-sm", className)}
    >
      {children}
    </motion.div>
  );
}

function StatCard({ label, value, suffix }: { label: string, value: string, suffix: string }) {
  return (
    <div className="flex flex-col items-center justify-center group">
      <span className="text-white/40 text-xs font-mono uppercase tracking-widest mb-2">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-display font-bold text-white group-hover:text-cyber-blue transition-colors shadow-glow">{value}</span>
        <span className="text-xs font-bold text-cyber-yellow font-display">{suffix}</span>
      </div>
    </div>
  );
}


import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { ArrowUpRight, Cpu, Globe, Loader2, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useContactModal } from '../components/Layout';

export function Dashboard() {
  const { events, backendStatus } = useStore();
  const { openContactModal } = useContactModal();

  const eventHistory = [...events]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const statusConfig = {
    connecting: { text: 'ĐANG KHỞI TẠO...', color: 'text-amber-500', icon: Loader2, pulse: true, spin: true },
    online: { text: 'MÁY CHỦ HOẠT ĐỘNG', color: 'text-sky-600', icon: Cpu, pulse: false, spin: false },
    offline: { text: 'MẤT KẾT NỐI', color: 'text-red-500', icon: AlertCircle, pulse: false, spin: false },
  }[backendStatus];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex flex-col justify-center items-center text-center pt-10">
        
        <div className="absolute top-20 left-10 w-16 h-16 bg-brutal-yellow rounded-full border-4 border-brutal-black pointer-events-none -z-10 shadow-neo" />
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-brutal-pink border-4 border-brutal-black transform rotate-12 pointer-events-none -z-10 shadow-neo" />
        <div className="absolute top-1/4 right-20 w-12 h-12 bg-brutal-blue border-4 border-brutal-black transform rotate-45 pointer-events-none -z-10 shadow-neo" />
        <div className="absolute bottom-1/3 left-20 w-20 h-20 bg-brutal-green rounded-tl-3xl border-4 border-brutal-black transform -rotate-12 pointer-events-none -z-10 shadow-neo" />

        {/* Floating HUD Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-visible hidden md:block z-50">
          <FloatingBadge className="top-[10%] left-[10%]" delay={0}>
            <div className={`flex items-center gap-2 ${statusConfig.color} font-mono font-bold bg-white px-3 py-2 border-4 border-brutal-black shadow-neo pointer-events-auto text-sm uppercase`}>
              <statusConfig.icon size={16} className={clsx("text-brutal-black", statusConfig.pulse && 'animate-pulse', statusConfig.spin && 'animate-spin')} />
              <span>{statusConfig.text}</span>
            </div>
          </FloatingBadge>
          <FloatingBadge className="bottom-[15%] right-[10%]" delay={1.5}>
            <div className="flex items-center gap-2 text-brutal-black bg-brutal-yellow px-3 py-2 border-4 border-brutal-black shadow-neo font-mono font-bold text-sm uppercase">
              <Globe size={16} />
              <span>MẠNG LƯỚI ỔN ĐỊNH</span>
            </div>
          </FloatingBadge>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 inline-flex items-center gap-2 px-4 py-2 border-4 border-brutal-black bg-brutal-pink shadow-neo text-brutal-black text-xs font-bold uppercase tracking-widest z-10"
        >
          <span className="w-2.5 h-2.5 bg-brutal-black animate-pulse" />
          Hệ thống v2.0.4 đã sẵn sàng
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl lg:text-8xl font-display font-black tracking-tighter mb-8 max-w-4xl z-10 leading-[0.95] text-brutal-black uppercase drop-shadow-[4px_4px_0_#38bdf8]"
        >
          DUT SUPERTEAM <br />
          UNIVERSITY CLUB
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-brutal-black max-w-2xl mb-10 z-10 font-bold leading-relaxed border-2 border-brutal-black bg-white p-4 shadow-neo-sm"
        >
          Sân chơi Web3 dành cho sinh viên bách khoa Đà Nẵng phát triển kỹ năng, khởi chạy dự án thực tế trên Blockchain Solana và cùng nhau phát triển.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-4 z-10"
        >
          <button
            onClick={openContactModal}
            className="group flex items-center justify-center gap-3 bg-brutal-blue text-white hover:bg-brutal-yellow hover:text-brutal-black px-8 py-5 border-4 border-brutal-black font-display font-black text-xl tracking-wider shadow-neo transition-all hover:-translate-y-2 hover:shadow-neo-lg"
          >
            LIÊN HỆ VỚI CHÚNG TÔI
            <ArrowUpRight size={28} className="group-hover:rotate-45 transition-transform duration-300" strokeWidth={3} />
          </button>
        </motion.div>
      </section>

      {/* Stats Tickers */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-y-4 border-brutal-black bg-brutal-yellow">
        <StatCard label="Thành viên" value="15" suffix="HACKERS" />
        <StatCard label="Dự án đang chạy" value="10+" suffix="DỰ ÁN" />
        <StatCard label="Thực tập sinh" value="5+" suffix="THÀNH VIÊN" />
      </section>

      {/* Event History */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-brutal-pink border-4 border-brutal-black shadow-neo flex items-center justify-center">
            <Globe size={24} className="text-brutal-black" />
          </div>
          <span className="text-brutal-black font-display font-black text-3xl uppercase tracking-tighter">Sự kiện gần đây</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {eventHistory.map((event, idx) => (
            <React.Fragment key={event.id}>
              <EventCard event={event} idx={idx} />
            </React.Fragment>
          ))}
          {eventHistory.length === 0 && (
            <div className="col-span-3 text-center py-16 bg-white border-4 border-brutal-black shadow-neo text-brutal-black font-mono font-bold text-lg uppercase tracking-widest">
              CHƯA CÓ SỰ KIỆN NÀO
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function EventCard({ event, idx }: { event: any, idx: number }) {
  const lumaLink = String(event.luma_link || event.lumaLink || event.link || '').trim();
  const eventDate = event.date ? new Date(event.date) : null;
  const dayLabel = eventDate
    ? String(eventDate.getDate()).padStart(2, '0')
    : '--';
  const monthLabel = eventDate
    ? eventDate.toLocaleString('vi-VN', { month: 'short' })
    : '---';

  const cardClasses = clsx(
    "bg-white p-6 relative group transition-all border-4 border-brutal-black",
    lumaLink ? "cursor-pointer brutal-card hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo-lg" : "cursor-default shadow-neo"
  );

  const inner = (
    <>
      <div className="flex justify-between items-start mb-6">
        <span className="px-3 py-1 bg-brutal-yellow border-2 border-brutal-black text-brutal-black text-xs font-bold uppercase tracking-wider shadow-neo-sm">
          {event.type}
        </span>
        <div className="text-right">
          <div className="text-3xl font-display font-black text-brutal-black group-hover:text-brutal-blue transition-colors leading-none">
            {dayLabel}
          </div>
          <div className="text-xs font-bold text-gray-500 uppercase mt-1">
            {monthLabel}
          </div>
        </div>
      </div>

      <h3 className="text-xl font-display font-black mb-3 text-brutal-black transition-colors line-clamp-2 leading-tight uppercase">
        {event.title}
      </h3>
      <p className="w-fit border-2 border-brutal-black bg-gray-50 p-2 font-mono text-xs font-bold uppercase text-brutal-blue shadow-neo-sm">
        {event.location || 'Đang cập nhật địa điểm'}
      </p>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.1 }}
      className="h-full"
    >
      {lumaLink ? (
        <div className={`${cardClasses} h-full relative`}>
          <a
            href={lumaLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Mở sự kiện ${event.title}`}
            className="absolute inset-0 z-30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brutal-blue focus-visible:ring-offset-4"
          />
          <div className="relative z-10 pointer-events-none">
            {inner}
          </div>
        </div>
      ) : (
        <div className={`${cardClasses} h-full`}>
          {inner}
        </div>
      )}
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
      className={clsx("absolute", className)}
    >
      {children}
    </motion.div>
  );
}

function StatCard({ label, value, suffix }: { label: string, value: string, suffix: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white border-4 border-brutal-black shadow-neo transform rotate-0 hover:-rotate-2 hover:scale-105 hover:shadow-neo-lg transition-transform duration-300">
      <span className="text-brutal-blue text-xs font-mono font-bold uppercase tracking-widest mb-2 border-b-2 border-brutal-black pb-1">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-display font-black text-brutal-black">{value}</span>
        <span className="text-sm font-bold text-brutal-pink font-display uppercase tracking-widest">{suffix}</span>
      </div>
    </div>
  );
}

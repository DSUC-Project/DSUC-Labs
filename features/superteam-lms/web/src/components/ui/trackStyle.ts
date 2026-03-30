import type { TrackId } from '@/lib/curriculum';

export function trackStyle(track: TrackId) {
  if (track === 'genin') {
    return {
      gradient: 'from-emerald-400 via-cyan-400 to-indigo-400',
      cardGlow: 'from-emerald-500/40 to-cyan-500/10',
      badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]',
    };
  }
  if (track === 'chunin') {
    return {
      gradient: 'from-indigo-400 via-purple-400 to-cyan-400',
      cardGlow: 'from-indigo-500/40 to-purple-500/10',
      badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
      dot: 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]',
    };
  }
  return {
    gradient: 'from-purple-400 via-fuchsia-400 to-amber-300',
    cardGlow: 'from-purple-500/40 to-amber-500/10',
    badge: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    dot: 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.5)]',
  };
}

import React from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

interface AppBackgroundProps {
  intensity?: 'low' | 'medium' | 'high';
  className?: string;
}

export function AppBackground({
  intensity = 'medium',
  className,
}: AppBackgroundProps) {
  const dotOpacity =
    intensity === 'low' ? 'opacity-35' : intensity === 'medium' ? 'opacity-55' : 'opacity-75';
  const codeOpacity =
    intensity === 'low' ? 'opacity-15' : intensity === 'medium' ? 'opacity-30' : 'opacity-45';

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-main-bg transition-colors duration-300',
        className
      )}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className={cn('absolute inset-0 dsuc-dot-grid', dotOpacity)}
      />

      <div className={cn('absolute inset-0 hidden items-center justify-around md:flex', codeOpacity)}>
        <motion.div
          animate={{ y: [0, -64] }}
          transition={{ repeat: Infinity, duration: 28, ease: 'linear', repeatType: 'mirror' }}
          className="font-mono text-[11px] uppercase tracking-[0.24em] text-text-muted/60"
        >
          build
          <br />
          learn
          <br />
          ship
        </motion.div>
        <motion.div
          animate={{ y: [0, 52] }}
          transition={{ repeat: Infinity, duration: 34, ease: 'linear', repeatType: 'mirror' }}
          className="font-mono text-[11px] text-text-muted/55"
        >
          const guild = "dsuc";
          <br />
          academy.start();
          <br />
          deploy();
        </motion.div>
        <motion.div
          animate={{ y: [0, -44] }}
          transition={{ repeat: Infinity, duration: 38, ease: 'linear', repeatType: 'mirror' }}
          className="font-mono text-[11px] text-text-muted/55"
        >
          fn ship() {'{'}
          <br />
          &nbsp;&nbsp;println!("solana");
          <br />
          {'}'}
        </motion.div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center opacity-40 dark:opacity-20">
        <div className="h-[540px] w-[540px] rounded-full border border-border-main/50" />
        <div className="absolute h-[340px] w-[340px] rounded-full border border-border-main/60" />
      </div>
    </div>
  );
}

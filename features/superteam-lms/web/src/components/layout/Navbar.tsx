'use client';

import Link from 'next/link';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Wallet } from 'lucide-react';

export function Navbar() {
  return (
    <div className="fixed top-6 left-0 right-0 flex justify-center z-50 px-4 pointer-events-none">
      <nav className="w-full max-w-5xl bg-[#151725]/70 backdrop-blur-xl border border-white/10 shadow-2xl rounded-full px-4 py-2 sm:px-6 sm:py-3 flex justify-between items-center pointer-events-auto transition-all ring-1 ring-white/5">
        <div className="flex items-center">
          <Link
            href="/"
            className="text-lg sm:text-xl font-bold font-display bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 hover:to-white transition-all"
          >
            DSUC - Academy
          </Link>
        </div>

        {/* Keep the real wallet button for now, but style around it */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-transparent text-slate-300 hover:bg-white/5 px-4 py-2">
            <Wallet className="w-4 h-4" />
            <span className="text-sm font-semibold">Wallet</span>
          </div>
          <div className="wallet-dark">
            <WalletMultiButton />
          </div>
        </div>
      </nav>
    </div>
  );
}

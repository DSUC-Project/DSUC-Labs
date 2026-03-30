'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { animFrame, animLabel, animPanel, animTitle } from './theme';

export default function AccountModel() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const tl = gsap.timeline({ repeat: -1, paused: false });

    gsap.set(['#field-lamports', '#field-data', '#field-owner', '#field-extra', '#ownership', '#legend'], { opacity: 0 });

    tl.from('#account-box', { duration: 0.5, scale: 0.94, opacity: 0, ease: 'back.out(1.5)' })
      .to('#field-lamports', { duration: 0.35, opacity: 1, ease: 'power2.out' }, '+=0.4')
      .to('#field-data', { duration: 0.35, opacity: 1, ease: 'power2.out' }, '+=0.6')
      .to('#field-owner', { duration: 0.35, opacity: 1, ease: 'power2.out' }, '+=0.6')
      .to('#field-extra', { duration: 0.3, opacity: 1, ease: 'power2.out' }, '+=0.6')
      .to('#ownership', { duration: 0.4, opacity: 1, ease: 'power2.out' }, '+=0.6')
      .to('#legend', { duration: 0.4, opacity: 1, ease: 'power2.out' }, '+=0.6')
      .to('#account-box rect:first-child', { duration: 0.3, stroke: '#088395' }, '+=0.6')
      .to('#account-box rect:first-child', { duration: 0.3, stroke: '#09637E' })
      .to({}, { duration: 0.8 })
      .to(['#field-lamports', '#field-data', '#field-owner', '#field-extra', '#ownership', '#legend'], { duration: 0.25, opacity: 0 });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div ref={rootRef} className={animFrame}>
      <div className={animLabel}>Animation</div>
      <div className={animTitle}>Solana Account Structure</div>

      <div className={animPanel}>
        <svg id="account-svg" width="100%" height="100%" viewBox="0 0 700 320" className="h-[220px] w-full">
          <defs>
            <linearGradient id="accountGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#09637E" stopOpacity="1" />
              <stop offset="100%" stopColor="#088395" stopOpacity="1" />
            </linearGradient>
          </defs>

          <text x="350" y="25" textAnchor="middle" fill="#888" fontSize="14">Solana Account Structure</text>

          <g id="account-box">
            <rect x="200" y="50" width="300" height="220" rx="12" fill="rgba(153,69,255,0.10)" stroke="#09637E" strokeWidth="2" />
            <rect x="200" y="50" width="300" height="35" rx="12" fill="#09637E" />
            <rect x="200" y="73" width="300" height="12" fill="#09637E" />
            <text x="350" y="75" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">Account</text>
          </g>

          <g id="account-fields">
            <g id="field-lamports" opacity="0">
              <rect x="220" y="100" width="260" height="35" rx="6" fill="rgba(255,255,255,0.65)" stroke="rgba(0,0,0,0.10)" />
              <text x="235" y="123" fill="#09637E" fontSize="11" fontWeight="bold">lamports</text>
              <text x="340" y="123" fill="#444" fontSize="11">1,500,000,000</text>
              <text x="460" y="123" fill="#666" fontSize="9">(1.5 SOL)</text>
            </g>

            <g id="field-data" opacity="0">
              <rect x="220" y="145" width="260" height="35" rx="6" fill="rgba(255,255,255,0.65)" stroke="rgba(0,0,0,0.10)" />
              <text x="235" y="168" fill="#088395" fontSize="11" fontWeight="bold">data</text>
              <text x="340" y="168" fill="#444" fontSize="11">[user_stats bytes...]</text>
            </g>

            <g id="field-owner" opacity="0">
              <rect x="220" y="190" width="260" height="35" rx="6" fill="rgba(255,255,255,0.65)" stroke="rgba(0,0,0,0.10)" />
              <text x="235" y="213" fill="#09637E" fontSize="11" fontWeight="bold">owner</text>
              <text x="340" y="213" fill="#444" fontSize="10">YourProgram111...111</text>
            </g>

            <g id="field-extra" opacity="0">
              <rect x="220" y="235" width="125" height="25" rx="4" fill="rgba(255,255,255,0.55)" stroke="rgba(0,0,0,0.10)" />
              <text x="235" y="252" fill="#666" fontSize="9">executable: false</text>

              <rect x="355" y="235" width="125" height="25" rx="4" fill="rgba(255,255,255,0.55)" stroke="rgba(0,0,0,0.10)" />
              <text x="370" y="252" fill="#666" fontSize="9">rent_epoch: 364</text>
            </g>
          </g>

          <g id="ownership" opacity="0">
            <path d="M 520 207 L 580 207 L 580 130 L 620 130" stroke="#09637E" strokeWidth="2" fill="none" strokeDasharray="5,5" />
            <text x="620" y="110" fill="#09637E" fontSize="11" fontWeight="bold">Program</text>
            <rect x="600" y="115" width="80" height="40" rx="6" fill="rgba(153,69,255,0.18)" stroke="#09637E" strokeWidth="2" />
            <text x="640" y="140" textAnchor="middle" fill="#09637E" fontSize="9">Controls</text>
          </g>

          <g id="legend" opacity="0">
            <rect x="30" y="100" width="140" height="150" rx="8" fill="rgba(255,255,255,0.55)" stroke="rgba(0,0,0,0.10)" />
            <text x="100" y="125" textAnchor="middle" fill="#666" fontSize="10" fontWeight="bold">Account Types</text>

            <circle cx="50" cy="150" r="8" fill="#09637E" />
            <text x="65" y="154" fill="#666" fontSize="9">Wallet (SOL)</text>

            <circle cx="50" cy="180" r="8" fill="#088395" />
            <text x="65" y="184" fill="#666" fontSize="9">Token Account</text>

            <circle cx="50" cy="210" r="8" fill="url(#accountGradient)" />
            <text x="65" y="214" fill="#666" fontSize="9">PDA (Data)</text>
          </g>
        </svg>
      </div>
    </div>
  );
}

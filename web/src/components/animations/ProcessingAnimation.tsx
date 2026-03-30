'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { animFrame, animLabel, animPanel, animTitle } from './theme';

export default function ProcessingAnimation() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const q = gsap.utils.selector(root);

    tlRef.current?.kill();

    const tl = gsap.timeline({ paused: false, repeat: -1 });

    // Reset state
    gsap.set(['#seq-tx-1', '#seq-tx-2', '#seq-tx-3', '#seq-tx-4'], { x: 0, opacity: 0.8, fill: '#09637E' });
    gsap.set(['#par-tx-1', '#par-tx-2', '#par-tx-3', '#par-tx-4'], { x: 0, opacity: 0.8, fill: '#088395' });
    gsap.set(['#seq-done-1', '#seq-done-2', '#seq-done-3', '#seq-done-4'], { opacity: 0, scale: 1 });
    gsap.set(['#par-done-1', '#par-done-2', '#par-done-3', '#par-done-4'], { opacity: 0, scale: 1 });

    // Sequential
    [1, 2, 3, 4].forEach((n, i) => {
      const delay = i * 1.2;
      tl.to(`#seq-tx-${n}`, { duration: 0.3, x: 90, opacity: 1, ease: 'power2.inOut' }, delay)
        .to(`#seq-tx-${n}`, { duration: 0.6, fill: '#088395', ease: 'none' }, delay + 0.3)
        .to(`#seq-tx-${n}`, { duration: 0.3, x: 170, opacity: 0, ease: 'power2.inOut' }, delay + 0.9)
        .to(`#seq-done-${n}`, { duration: 0.2, opacity: 1, scale: 1.2, ease: 'back.out' }, delay + 1.0)
        .to(`#seq-done-${n}`, { duration: 0.1, scale: 1 }, delay + 1.2);
    });

    // Parallel
    const parDelay = 0.5;
    [1, 2, 3, 4].forEach((n) => {
      tl.to(`#par-tx-${n}`, { duration: 0.3, x: 90, ease: 'power2.inOut' }, parDelay)
        .to(`#par-tx-${n}`, { duration: 0.8, fill: '#09637E', ease: 'none' }, parDelay + 0.3)
        .to(`#par-tx-${n}`, { duration: 0.3, x: 170, opacity: 0, ease: 'power2.inOut' }, parDelay + 1.1)
        .to(`#par-done-${n}`, { duration: 0.2, opacity: 1, scale: 1.2, ease: 'back.out' }, parDelay + 1.3)
        .to(`#par-done-${n}`, { duration: 0.1, scale: 1 }, parDelay + 1.5);
    });

    // time label
    const timeLabel = (q('#time-label')[0] as unknown) as SVGTextElement | undefined;
    tl.eventCallback('onUpdate', () => {
      if (!timeLabel) return;
      const time = tl.time().toFixed(1);
      timeLabel.textContent = `Time: ${time}s`;
    });

    // loop reset
    tl.to({}, { duration: 0.6 });

    tlRef.current = tl;

    return () => {
      tl.kill();
      tlRef.current = null;
    };
  }, []);

  return (
    <div ref={rootRef} className={animFrame}>
      <div className={animLabel}>Animation</div>
      <div className={animTitle}>Sequential vs Parallel Processing</div>
      <div className={animPanel}>
        <svg id="processing-svg" width="100%" height="100%" viewBox="0 0 600 280" className="h-[210px] w-full">
          <defs>
            <filter id="glow-green">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <text x="150" y="25" textAnchor="middle" fill="#888" fontSize="12">Sequential Processing</text>
          <text x="150" y="42" textAnchor="middle" fill="#666" fontSize="10">(Traditional Blockchains)</text>

          <g id="sequential">
            <rect x="30" y="60" width="240" height="180" rx="8" fill="rgba(255,255,255,0.02)" stroke="rgba(0,0,0,0.10)" strokeWidth="1" />

            <g id="seq-queue">
              <rect id="seq-tx-1" x="50" y="80" width="60" height="30" rx="4" fill="#09637E" opacity="0.8" />
              <text x="80" y="100" textAnchor="middle" fill="white" fontSize="10">TX 1</text>

              <rect id="seq-tx-2" x="50" y="120" width="60" height="30" rx="4" fill="#09637E" opacity="0.5" />
              <text x="80" y="140" textAnchor="middle" fill="white" fontSize="10">TX 2</text>

              <rect id="seq-tx-3" x="50" y="160" width="60" height="30" rx="4" fill="#09637E" opacity="0.3" />
              <text x="80" y="180" textAnchor="middle" fill="white" fontSize="10">TX 3</text>

              <rect id="seq-tx-4" x="50" y="200" width="60" height="30" rx="4" fill="#09637E" opacity="0.2" />
              <text x="80" y="220" textAnchor="middle" fill="white" fontSize="10">TX 4</text>
            </g>

            <rect x="140" y="130" width="50" height="50" rx="8" fill="rgba(153,69,255,0.12)" stroke="#09637E" strokeWidth="2" />
            <text x="165" y="160" textAnchor="middle" fill="#09637E" fontSize="8">CPU</text>

            <g id="seq-output">
              <circle id="seq-done-1" cx="220" cy="95" r="12" fill="none" stroke="#088395" strokeWidth="2" opacity="0" />
              <circle id="seq-done-2" cx="220" cy="135" r="12" fill="none" stroke="#088395" strokeWidth="2" opacity="0" />
              <circle id="seq-done-3" cx="220" cy="175" r="12" fill="none" stroke="#088395" strokeWidth="2" opacity="0" />
              <circle id="seq-done-4" cx="220" cy="215" r="12" fill="none" stroke="#088395" strokeWidth="2" opacity="0" />
            </g>
          </g>

          <text x="450" y="25" textAnchor="middle" fill="#088395" fontSize="12">Parallel Processing</text>
          <text x="450" y="42" textAnchor="middle" fill="#666" fontSize="10">(Solana)</text>

          <g id="parallel">
            <rect x="330" y="60" width="240" height="180" rx="8" fill="rgba(20,241,149,0.02)" stroke="rgba(16,185,129,0.25)" strokeWidth="1" />

            <g id="par-queue">
              <rect id="par-tx-1" x="350" y="80" width="60" height="30" rx="4" fill="#088395" opacity="0.8" />
              <text x="380" y="100" textAnchor="middle" fill="#09637E" fontSize="10">TX 1</text>

              <rect id="par-tx-2" x="350" y="120" width="60" height="30" rx="4" fill="#088395" opacity="0.8" />
              <text x="380" y="140" textAnchor="middle" fill="#09637E" fontSize="10">TX 2</text>

              <rect id="par-tx-3" x="350" y="160" width="60" height="30" rx="4" fill="#088395" opacity="0.8" />
              <text x="380" y="180" textAnchor="middle" fill="#09637E" fontSize="10">TX 3</text>

              <rect id="par-tx-4" x="350" y="200" width="60" height="30" rx="4" fill="#088395" opacity="0.8" />
              <text x="380" y="220" textAnchor="middle" fill="#09637E" fontSize="10">TX 4</text>
            </g>

            {[1, 2, 3, 4].map((n) => (
              <g key={n}>
                <rect x="440" y={80 + (n - 1) * 45} width="40" height="35" rx="4" fill="rgba(20,241,149,0.16)" stroke="#088395" strokeWidth="2" />
                <text x="460" y={102 + (n - 1) * 45} textAnchor="middle" fill="#088395" fontSize="8">CPU {n}</text>
              </g>
            ))}

            <g id="par-output">
              <circle id="par-done-1" cx="520" cy="97" r="12" fill="none" stroke="#088395" strokeWidth="2" opacity="0" />
              <circle id="par-done-2" cx="520" cy="142" r="12" fill="none" stroke="#088395" strokeWidth="2" opacity="0" />
              <circle id="par-done-3" cx="520" cy="187" r="12" fill="none" stroke="#088395" strokeWidth="2" opacity="0" />
              <circle id="par-done-4" cx="520" cy="232" r="12" fill="none" stroke="#088395" strokeWidth="2" opacity="0" />
            </g>
          </g>

          <text id="time-label" x="300" y="270" textAnchor="middle" fill="#666" fontSize="12">Time: 0s</text>
        </svg>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import ProcessingAnimation from '@/components/animations/ProcessingAnimation';
import ComputerFlow from '@/components/animations/ComputerFlow';
import ConsensusStepper from '@/components/animations/ConsensusStepper';
import AccountModel from '@/components/animations/AccountModel';
import PromptFlow from '@/components/animations/PromptFlow';

type Props = { lessonId: string };

type StepInfo = { title: string; description: string };

function ControlButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border border-black/10 bg-white/55 px-3 py-1 text-xs font-extrabold hover:bg-white disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="rounded-3xl border border-black/10 bg-white/60 p-4 sm:p-5 backdrop-blur-xl">{children}</div>;
}

function Title({ lessonId }: { lessonId: string }) {
  const title = useMemo(() => {
    switch (lessonId) {
      case 'm1-blockchain-as-a-computer':
        return 'Client-server vs P2P replication';
      case 'm2-identity-and-authentication':
        return 'Signing flow';
      case 'm3-consensus-input-not-memory':
        return 'Consensus = ordering inputs';
      case 'm4-account-file':
        return 'Account model';
      case 'm5-program-library':
        return 'PDA derivation';
      case 'm6-environment-setup-minimal':
        return 'Minimal setup checklist';
      case 'm7-coding-with-claude':
        return 'Prompt flow';
      default:
        return 'Concept animation';
    }
  }, [lessonId]);

  return <div className="text-sm font-extrabold text-black">{title}</div>;
}

function Stepper({ steps, step, setStep }: { steps: StepInfo[]; step: number; setStep: (n: number) => void }) {
  const active = steps[Math.min(step, steps.length - 1)];
  const percent = Math.round(((Math.min(step, steps.length - 1) + 1) / steps.length) * 100);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-black/60">{active?.description}</div>
        <div className="flex gap-2">
          <ControlButton onClick={() => setStep(Math.max(0, step - 1))} disabled={step <= 0}>
            Prev
          </ControlButton>
          <ControlButton onClick={() => setStep(Math.min(steps.length - 1, step + 1))} disabled={step >= steps.length - 1}>
            Next
          </ControlButton>
        </div>
      </div>

      <div className="mt-3 h-2 w-full rounded-full bg-black/10 overflow-hidden">
        <div className="h-full rounded-full bg-emerald-600" style={{ width: `${percent}%` }} />
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
        {steps.map((s, idx) => {
          const state = idx < step ? 'complete' : idx === step ? 'active' : 'pending';
          const cls =
            state === 'active'
              ? 'border-emerald-600/30 bg-emerald-500/10'
              : state === 'complete'
                ? 'border-black/10 bg-white/55'
                : 'border-black/10 bg-white/40';
          return (
            <button
              type="button"
              key={s.title}
              onClick={() => setStep(idx)}
              className={`text-left rounded-2xl border px-3 py-2 ${cls}`}
            >
              <div className="text-xs text-black/50">Step {idx + 1}</div>
              <div className="text-sm font-extrabold text-black">{s.title}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function LessonAnimation({ lessonId }: Props) {
  // Phase 2: embed upstream-style animations as dedicated components.
  if (lessonId === 'm1-blockchain-as-a-computer') return <ComputerFlow />;
  if (lessonId === 'm2-identity-and-authentication') return <ProcessingAnimation />;
  if (lessonId === 'm3-consensus-input-not-memory') return <ConsensusStepper />;
  if (lessonId === 'm4-account-file' || lessonId === 'm5-program-library') return <AccountModel />;
  if (lessonId === 'm7-coding-with-claude') return <PromptFlow />;

  const [playing, setPlaying] = useState(true);
  const [resetTick, setResetTick] = useState(0);
  const [mode, setMode] = useState<'client-server' | 'p2p'>('client-server');

  const rootRef = useRef<HTMLDivElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const steps = useMemo<StepInfo[] | null>(() => {
    if (lessonId === 'm2-identity-and-authentication') {
      return [
        { title: 'Create', description: 'The app constructs a message (or transaction).' },
        { title: 'Sign', description: 'Your wallet shows approval UI and signs with your private key.' },
        { title: 'Submit', description: 'The signed payload is sent to the network via an RPC.' },
        { title: 'Process', description: 'Validators verify signatures and execute instructions.' },
        { title: 'Confirm', description: 'The network finalizes the ordered result; you see confirmation.' },
      ];
    }
    if (lessonId === 'm3-consensus-input-not-memory') {
      return [
        { title: 'Collect Inputs', description: 'Transactions arrive from many clients into a shared pool.' },
        { title: 'Propose Order', description: 'A leader proposes a canonical ordering for the next block.' },
        { title: 'Vote & Validate', description: 'Validators verify and vote on the proposed order.' },
        { title: 'Finalize', description: 'The ordered inputs become canonical history.' },
      ];
    }
    if (lessonId === 'm7-coding-with-claude') {
      return [
        { title: 'Define Goal', description: 'State the outcome you want in one crisp sentence.' },
        { title: 'Add Constraints', description: 'Specify accounts, checks, limits, and required instructions.' },
        { title: 'Generate & Review', description: 'Draft the code, then verify invariants and security checks.' },
        { title: 'Test & Iterate', description: 'Run tests, fix failures, then harden edge cases.' },
      ];
    }
    return null;
  }, [lessonId]);

  const [step, setStep] = useState(0);

  // clamp step if lesson changes
  const clampedStep = steps ? Math.min(step, steps.length - 1) : 0;

  const key = `${lessonId}:${resetTick}`;
  const cls = playing ? 'is-playing' : 'is-paused';

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // kill previous timeline
    tlRef.current?.kill();
    tlRef.current = null;

    const q = gsap.utils.selector(root);

    // default: subtle idle motion for dots/checks
    const tl = gsap.timeline({ repeat: -1, defaults: { ease: 'power2.inOut' } });

    // Build per-lesson timelines that mimic the upstream repo behavior:
    // - highlight nodes sequentially
    // - move "packets" along the flow
    // - pulse completion states

    if (lessonId === 'm1-blockchain-as-a-computer') {
      // animate packet from client -> server/db OR client -> validators
      tl.to(q('[data-anim="packet"]'), { x: mode === 'client-server' ? 360 : 230, duration: 1.1 })
        .to(q('[data-anim="packet"]'), { x: mode === 'client-server' ? 650 : 460, duration: 1.1 })
        .to(q('[data-anim="packet"]'), { x: 0, duration: 0.6, ease: 'power1.inOut' });

      if (mode === 'p2p') {
        tl.to(q('[data-anim="validator"]'), { opacity: 1, duration: 0.2, stagger: 0.06 }, 0.2)
          .to(q('[data-anim="validator"]'), { opacity: 0.75, duration: 0.2, stagger: 0.06 }, 1.1);
      }
    } else if (lessonId === 'm2-identity-and-authentication') {
      // loop across 5 stages like their lifecycle animation
      const nodes = q('[data-anim="stage"]');
      const dot = q('[data-anim="packet"]');

      gsap.set(nodes, { opacity: 0.55 });
      gsap.set(nodes[0], { opacity: 1 });

      tl.clear();
      for (let i = 0; i < 5; i++) {
        tl.to(nodes, { opacity: 0.55, duration: 0.15 })
          .to(nodes[i], { opacity: 1, duration: 0.15 }, '<')
          .to(dot, { x: i * 170, duration: 0.5 }, '<');
      }
      tl.to(dot, { x: 0, duration: 0.45, ease: 'power1.inOut' });
    } else if (lessonId === 'm3-consensus-input-not-memory') {
      // animate tx blocks moving into canonical order (step-by-step)
      const txs = ['TxA', 'TxB', 'TxC', 'TxD'];
      const map: Record<string, number> = { TxB: 0, TxD: 1, TxA: 2, TxC: 3 };

      tl.clear();
      txs.forEach((t, idx) => {
        tl.to(q(`[data-tx="${t}"]`), { x: 390 + map[t] * 86 - (80 + idx * 76), duration: 0.55, ease: 'power2.inOut' }, idx * 0.15);
      });
      tl.to(q('[data-anim="packet"]'), { x: 120, duration: 0.6 }, 0.1).to(q('[data-anim="packet"]'), { x: 0, duration: 0.6 }, 1.0);
      tl.to(txs.map((t) => q(`[data-order="${t}"]`)).flat(), { opacity: 1, duration: 0.25, stagger: 0.08 }, 0.55);
      tl.to({}, { duration: 0.35 });
      tl.to(q('[data-anim="reset"]'), { opacity: 1, duration: 0 });
      tl.to(txs.map((t) => q(`[data-tx="${t}"]`)).flat(), { x: 0, duration: 0.45, ease: 'power2.inOut' });
      tl.to(q('[data-order]'), { opacity: 0, duration: 0.2 }, '<');
      tl.to(q('[data-anim="reset"]'), { opacity: 0, duration: 0 }, '<');
    } else if (lessonId === 'm4-account-file') {
      // reveal fields one-by-one like their account-model animation
      const fields = q('[data-anim="field"]');
      gsap.set(fields, { opacity: 0, y: 6 });
      tl.clear();
      tl.to(fields[0], { opacity: 1, y: 0, duration: 0.35 })
        .to(fields[1], { opacity: 1, y: 0, duration: 0.35 }, '+=0.35')
        .to(fields[2], { opacity: 1, y: 0, duration: 0.35 }, '+=0.35')
        .to(fields[3], { opacity: 1, y: 0, duration: 0.35 }, '+=0.35')
        .to(fields, { opacity: 0.85, duration: 0.2 })
        .to({}, { duration: 0.5 })
        .to(fields, { opacity: 0, duration: 0.25 });
    } else if (lessonId === 'm7-coding-with-claude') {
      // pulse through prompt blocks like their prompt-flow stepper
      const blocks = q('[data-anim="prompt"]');
      gsap.set(blocks, { opacity: 0.55 });
      tl.clear();
      [0, 1, 2, 3].forEach((i) => {
        tl.to(blocks, { opacity: 0.55, duration: 0.15 })
          .to(blocks[i], { opacity: 1, duration: 0.15 }, '<')
          .to(q('[data-anim="packet"]'), { x: i * 200, duration: 0.55 }, '<');
      });
      tl.to(q('[data-anim="packet"]'), { x: 0, duration: 0.45, ease: 'power1.inOut' });
    } else {
      // fallback subtle
      tl.to(q('[data-anim="packet"]'), { x: 110, duration: 1.1 }).to(q('[data-anim="packet"]'), { x: 0, duration: 1.1 });
    }

    tlRef.current = tl;

    return () => {
      tl.kill();
      tlRef.current = null;
    };
  }, [lessonId, mode, resetTick]);

  useEffect(() => {
    const tl = tlRef.current;
    if (!tl) return;
    if (playing) tl.play();
    else tl.pause();
  }, [playing]);

  return (
    <Frame>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-xs text-black/50">Animation</div>
          <Title lessonId={lessonId} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {lessonId === 'm1-blockchain-as-a-computer' ? (
            <>
              <ControlButton onClick={() => setMode('client-server')}>Client-Server</ControlButton>
              <ControlButton onClick={() => setMode('p2p')}>P2P</ControlButton>
            </>
          ) : null}

          <ControlButton onClick={() => setPlaying((p) => !p)}>{playing ? 'Pause' : 'Play'}</ControlButton>
          <ControlButton
            onClick={() => {
              setPlaying(false);
              setResetTick((t) => t + 1);
              setStep(0);
              setTimeout(() => setPlaying(true), 50);
            }}
          >
            Reset
          </ControlButton>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-black/10 bg-white/70">
        <div ref={rootRef} className={`academy-anim ${cls}`}>
          {/* M1: mimic "computer/network" style: clear boxes + moving packet */}
          {lessonId === 'm1-blockchain-as-a-computer' ? (
            <svg key={key + ':' + mode} viewBox="0 0 900 240" className="h-[170px] w-full">
              <text x="30" y="32" fontSize="12" fill="rgba(0,0,0,0.55)">
                {mode === 'client-server'
                  ? 'Client → Server → Database (single authority)'
                  : 'Client → Validators (verify + replicate)'}
              </text>

              {mode === 'client-server' ? (
                <>
                  <rect x="40" y="70" width="220" height="140" rx="18" fill="rgba(255,255,255,0.75)" stroke="rgba(0,0,0,0.10)" />
                  <text x="90" y="112" fontSize="16" fontWeight="900" fill="#0b1411">Client</text>
                  <text x="90" y="136" fontSize="12" fill="rgba(0,0,0,0.55)">request</text>

                  <rect x="340" y="70" width="220" height="140" rx="18" fill="rgba(124,58,237,0.08)" stroke="rgba(124,58,237,0.25)" />
                  <text x="395" y="112" fontSize="16" fontWeight="900" fill="#1f1147">Server</text>
                  <text x="395" y="136" fontSize="12" fill="rgba(0,0,0,0.55)">decides truth</text>

                  <rect x="640" y="70" width="220" height="140" rx="18" fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.25)" />
                  <text x="705" y="112" fontSize="16" fontWeight="900" fill="#052e2b">Database</text>
                  <text x="705" y="136" fontSize="12" fill="rgba(0,0,0,0.55)">single copy</text>

                  <path d="M 260 140 L 340 140" stroke="rgba(0,0,0,0.18)" strokeWidth="2" />
                  <path d="M 560 140 L 640 140" stroke="rgba(0,0,0,0.18)" strokeWidth="2" />

                  <circle className="anim-dot" data-anim="packet" cx="260" cy="140" r="7" fill="#7c3aed" />
                </>
              ) : (
                <>
                  <rect x="40" y="78" width="220" height="124" rx="18" fill="rgba(255,255,255,0.75)" stroke="rgba(0,0,0,0.10)" />
                  <text x="90" y="122" fontSize="16" fontWeight="900" fill="#0b1411">Client</text>
                  <text x="90" y="146" fontSize="12" fill="rgba(0,0,0,0.55)">broadcast tx</text>

                  <rect x="330" y="64" width="520" height="160" rx="22" fill="rgba(0,0,0,0.03)" stroke="rgba(0,0,0,0.10)" />
                  <text x="370" y="96" fontSize="14" fontWeight="900" fill="#0b1411">Validators</text>

                  {Array.from({ length: 5 }).map((_, i) => {
                    const x = 370 + i * 92;
                    const y = 120;
                    return (
                      <g key={i}>
                        <rect x={x} y={y} width={74} height={74} rx={16} fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.22)" />
                        <text x={x + 22} y={y + 44} fontSize="12" fontWeight="900" fill="#052e2b">V{i + 1}</text>
                      </g>
                    );
                  })}

                  <path d="M 260 140 L 330 140" stroke="rgba(0,0,0,0.18)" strokeWidth="2" />
                  <circle className="anim-dot" data-anim="packet" cx="260" cy="140" r="7" fill="#7c3aed" />

                  {Array.from({ length: 5 }).map((_, i) => (
                    <circle key={i} data-anim="validator" cx={407 + i * 92} cy={157} r={6} fill="#10b981" opacity={0.0} />
                  ))}

                  <text x="370" y="212" fontSize="12" fill="rgba(0,0,0,0.55)">verify signatures → execute → replicate state</text>
                </>
              )}
            </svg>
          ) : null}

          {/* M2: match repo’s stepper style with clear lifecycle */}
          {lessonId === 'm2-identity-and-authentication' ? (
            <svg key={key + ':' + clampedStep} viewBox="0 0 900 240" className="h-[170px] w-full">
              {['Create', 'Sign', 'Submit', 'Process', 'Confirm'].map((t, i) => {
                const x = 45 + i * 170;
                const active = i <= clampedStep;
                return (
                  <g key={t} data-anim="stage">
                    <rect
                      x={x}
                      y={76}
                      width={150}
                      height={92}
                      rx={18}
                      fill={active ? 'rgba(124,58,237,0.10)' : 'rgba(0,0,0,0.03)'}
                      stroke={active ? 'rgba(124,58,237,0.28)' : 'rgba(0,0,0,0.10)'}
                    />
                    <text x={x + 18} y={116} fontSize="14" fontWeight="900" fill="#0b1411">{t}</text>
                    <text x={x + 18} y={140} fontSize="12" fill="rgba(0,0,0,0.55)">
                      {i === 1 ? 'wallet UI' : i === 3 ? 'validators' : 'step'}
                    </text>
                    {i < 4 ? <path d={`M ${x + 150} 122 L ${x + 170} 122`} stroke="rgba(0,0,0,0.16)" strokeWidth="2" /> : null}
                  </g>
                );
              })}
              <circle className="anim-dot" data-anim="packet" cx={185} cy={122} r="7" fill="#7c3aed" />
            </svg>
          ) : null}

          {/* M3: consensus ordering */}
          {lessonId === 'm3-consensus-input-not-memory' ? (
            <svg key={key + ':' + clampedStep} viewBox="0 0 900 240" className="h-[170px] w-full">
              <rect x="45" y="60" width="360" height="160" rx="20" fill="rgba(0,0,0,0.03)" stroke="rgba(0,0,0,0.10)" />
              <text x="75" y="92" fontSize="14" fontWeight="900" fill="#0b1411">Incoming pool</text>
              {['TxA', 'TxB', 'TxC', 'TxD'].map((t, i) => {
                const x = 80 + i * 76;
                const y = 122;
                return (
                  <g key={t} data-tx={t}>
                    <rect x={x} y={y} width={60} height={38} rx={12} fill="rgba(124,58,237,0.10)" stroke="rgba(124,58,237,0.22)" />
                    <text x={x + 17} y={y + 25} fontSize="12" fontWeight="900" fill="#1f1147">{t}</text>
                  </g>
                );
              })}

              <rect x="470" y="60" width="385" height="160" rx="20" fill="rgba(16,185,129,0.10)" stroke="rgba(16,185,129,0.22)" />
              <text x="500" y="92" fontSize="14" fontWeight="900" fill="#052e2b">Canonical order</text>

              {['TxB', 'TxD', 'TxA', 'TxC'].map((t, i) => {
                const x = 505 + i * 86;
                const y = 128;
                return (
                  <g key={t} data-order={t} opacity={0}>
                    <rect x={x} y={y} width={70} height={42} rx={14} fill="rgba(16,185,129,0.12)" stroke="rgba(16,185,129,0.30)" />
                    <text x={x + 20} y={y + 27} fontSize="12" fontWeight="900" fill="#052e2b">{t}</text>
                  </g>
                );
              })}

              <path d="M 405 140 L 470 140" stroke="rgba(0,0,0,0.16)" strokeWidth="2" />
              <circle className="anim-dot" data-anim="packet" cx={405} cy={140} r="7" fill="#7c3aed" />
              <text data-anim="reset" x="500" y="206" fontSize="12" fill="rgba(0,0,0,0.55)" opacity={0}>
                Reset
              </text>
            </svg>
          ) : null}

          {/* M4 */}
          {lessonId === 'm4-account-file' ? (
            <svg key={key} viewBox="0 0 900 240" className="h-[170px] w-full">
              <text x="45" y="34" fontSize="12" fill="rgba(0,0,0,0.55)">Account = file with fields. Owner program controls writes.</text>
              <rect x="60" y="55" width="780" height="170" rx="22" fill="rgba(0,0,0,0.03)" stroke="rgba(0,0,0,0.10)" />
              {[
                { t: 'lamports', c: 'rgba(16,185,129,0.12)' },
                { t: 'data', c: 'rgba(124,58,237,0.10)' },
                { t: 'owner', c: 'rgba(0,0,0,0.04)' },
                { t: 'executable', c: 'rgba(16,185,129,0.10)' },
              ].map((x, i) => (
                <g key={x.t} data-anim="field">
                  <rect x={100 + i * 185} y={96} width={170} height={90} rx={18} fill={x.c} stroke="rgba(0,0,0,0.10)" />
                  <text x={120 + i * 185} y={134} fontSize="14" fontWeight="900" fill="#0b1411">{x.t}</text>
                  <text x={120 + i * 185} y={156} fontSize="12" fill="rgba(0,0,0,0.55)">field</text>
                </g>
              ))}
            </svg>
          ) : null}

          {/* M5 */}
          {lessonId === 'm5-program-library' ? (
            <svg key={key} viewBox="0 0 900 240" className="h-[170px] w-full">
              <text x="45" y="34" fontSize="12" fill="rgba(0,0,0,0.55)">Seeds + program id deterministically derive a PDA (no private key).</text>

              <rect x="55" y="80" width="240" height="120" rx="20" fill="rgba(0,0,0,0.03)" stroke="rgba(0,0,0,0.10)" />
              <text x="92" y="124" fontSize="14" fontWeight="900" fill="#0b1411">Seeds</text>
              <text x="92" y="148" fontSize="12" fill="rgba(0,0,0,0.55)">"profile" + user</text>

              <rect x="340" y="80" width="240" height="120" rx="20" fill="rgba(124,58,237,0.10)" stroke="rgba(124,58,237,0.28)" />
              <text x="375" y="124" fontSize="14" fontWeight="900" fill="#1f1147">Program ID</text>
              <text x="375" y="148" fontSize="12" fill="rgba(0,0,0,0.55)">authority</text>

              <rect x="625" y="80" width="220" height="120" rx="20" fill="rgba(16,185,129,0.10)" stroke="rgba(16,185,129,0.28)" />
              <text x="665" y="124" fontSize="14" fontWeight="900" fill="#052e2b">PDA</text>
              <text x="665" y="148" fontSize="12" fill="rgba(0,0,0,0.55)">derived address</text>

              <path d="M 295 140 L 340 140" stroke="rgba(0,0,0,0.16)" strokeWidth="2" />
              <path d="M 580 140 L 625 140" stroke="rgba(0,0,0,0.16)" strokeWidth="2" />
              <circle className="anim-dot" cx="295" cy="140" r="7" fill="#7c3aed" />
            </svg>
          ) : null}

          {/* M6 */}
          {lessonId === 'm6-environment-setup-minimal' ? (
            <svg key={key} viewBox="0 0 900 240" className="h-[170px] w-full">
              <text x="45" y="34" fontSize="12" fill="rgba(0,0,0,0.55)">Checklist: build a minimal loop before installing everything.</text>
              <rect x="60" y="60" width="780" height="160" rx="20" fill="rgba(0,0,0,0.03)" stroke="rgba(0,0,0,0.10)" />

              {['Rust', 'Solana CLI', 'Node.js', 'Anchor (optional)'].map((t, i) => (
                <g key={t}>
                  <rect x="105" y={92 + i * 34} width="22" height="22" rx="6" fill="rgba(16,185,129,0.12)" stroke="rgba(16,185,129,0.30)" />
                  <path className="anim-check" d={`M 112 ${107 + i * 34} L 116 ${111 + i * 34} L 123 ${100 + i * 34}`} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <text x="145" y={108 + i * 34} fontSize="13" fontWeight="900" fill="#0b1411">{t}</text>
                </g>
              ))}
            </svg>
          ) : null}

          {/* M7 */}
          {lessonId === 'm7-coding-with-claude' ? (
            <svg key={key + ':' + clampedStep} viewBox="0 0 900 240" className="h-[170px] w-full">
              {['Goal', 'Constraints', 'Review', 'Test'].map((t, i) => {
                const x = 75 + i * 200;
                const active = i <= clampedStep;
                return (
                  <g key={t} data-anim="prompt">
                    <rect x={x} y={86} width={170} height={86} rx={18} fill={active ? 'rgba(16,185,129,0.10)' : 'rgba(0,0,0,0.03)'} stroke={active ? 'rgba(16,185,129,0.28)' : 'rgba(0,0,0,0.10)'} />
                    <text x={x + 18} y={124} fontSize="14" fontWeight="900" fill="#0b1411">{t}</text>
                    <text x={x + 18} y={146} fontSize="12" fill="rgba(0,0,0,0.55)">prompt block</text>
                    {i < 3 ? <path d={`M ${x + 170} 129 L ${x + 200} 129`} stroke="rgba(0,0,0,0.16)" strokeWidth="2" /> : null}
                  </g>
                );
              })}
              <circle className="anim-dot" data-anim="packet" cx={150} cy={129} r="7" fill="#7c3aed" />
            </svg>
          ) : null}
        </div>
      </div>

      {steps ? <Stepper steps={steps} step={clampedStep} setStep={setStep} /> : null}

      <style jsx>{`
        .academy-anim.is-paused :global(*) {
          animation-play-state: paused !important;
        }

        .anim-dot {
          animation: dot-move 2.2s ease-in-out infinite;
        }

        .anim-check {
          animation: check-draw 2.2s ease-in-out infinite;
        }

        @keyframes dot-move {
          0% {
            transform: translateX(0);
            opacity: 0.6;
          }
          50% {
            transform: translateX(110px);
            opacity: 1;
          }
          100% {
            transform: translateX(0);
            opacity: 0.6;
          }
        }

        @keyframes check-draw {
          0% {
            stroke-dasharray: 40;
            stroke-dashoffset: 40;
            opacity: 0.35;
          }
          50% {
            stroke-dasharray: 40;
            stroke-dashoffset: 0;
            opacity: 1;
          }
          100% {
            stroke-dasharray: 40;
            stroke-dashoffset: 40;
            opacity: 0.35;
          }
        }
      `}</style>
    </Frame>
  );
}

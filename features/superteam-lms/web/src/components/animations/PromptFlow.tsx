'use client';

import { useMemo, useState } from 'react';
import { animBtn, animFrame, animLabel, animMuted, animTitle } from './theme';

const STEPS = [
  { title: 'Define Goal', description: 'State what you want to build and the outcome you need.' },
  { title: 'Add Constraints', description: 'Specify account structures, limits, and required instructions.' },
  { title: 'Generate & Review', description: 'Draft the code; review invariants and checks.' },
  { title: 'Test & Iterate', description: 'Run tests, fix errors, and improve reliability.' },
] as const;

export default function PromptFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const active = STEPS[currentStep];
  const progressPercent = useMemo(() => Math.round(((currentStep + 1) / STEPS.length) * 100), [currentStep]);

  return (
    <div className={animFrame}>
      <div className={animLabel}>Animation</div>
      <div className={animTitle}>Prompt Flow Stepper</div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className={animMuted}>{active.description}</div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
            disabled={currentStep === 0}
            className={animBtn}
          >
            Prev
          </button>
          <button
            onClick={() => setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1))}
            disabled={currentStep === STEPS.length - 1}
            className="rounded-full bg-emerald-500/90 hover:bg-emerald-500 text-white px-3 py-1 text-xs font-extrabold disabled:opacity-50"
          >
            Next
          </button>
          <button
            onClick={() => setCurrentStep(0)}
            className={animBtn}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-3 h-2 w-full rounded-full bg-black/10 overflow-hidden">
        <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
        {STEPS.map((s, idx) => {
          const state = idx < currentStep ? 'complete' : idx === currentStep ? 'active' : 'pending';
          const cls =
            state === 'active'
              ? 'border-emerald-600/35 bg-emerald-500/10'
              : state === 'complete'
                ? 'border-white/10 bg-white/5'
                : 'border-white/10 bg-black/20';
          return (
            <button
              key={s.title}
              type="button"
              onClick={() => setCurrentStep(idx)}
              className={`text-left rounded-2xl border px-3 py-2 ${cls}`}
            >
              <div className="text-xs text-slate-400">Step {idx + 1}</div>
              <div className="text-sm font-extrabold text-slate-200">{s.title}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

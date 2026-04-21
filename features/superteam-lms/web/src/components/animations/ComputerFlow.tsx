'use client';

import { useMemo, useState } from 'react';
import { animBtn, animFrame, animLabel, animTitle } from './theme';

type Fn = 'add' | 'sub' | 'mul';

export default function ComputerFlow() {
  const [value, setValue] = useState(10);
  const [input, setInput] = useState(5);
  const [fn, setFn] = useState<Fn>('add');
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [active, setActive] = useState<'input' | 'decode' | 'execute' | 'memory' | 'output' | 'share'>('input');

  const cmd = useMemo(() => {
    const prev = value;
    let next = prev;
    let symbol = '+';
    let label = 'ADD';
    if (fn === 'add') {
      next = prev + input;
      symbol = '+';
      label = 'ADD';
    }
    if (fn === 'sub') {
      next = prev - input;
      symbol = '-';
      label = 'SUB';
    }
    if (fn === 'mul') {
      next = prev * input;
      symbol = '×';
      label = 'MUL';
    }
    return { prev, next, symbol, label };
  }, [fn, input, value]);

  function doStep() {
    const steps: Array<typeof active> = ['input', 'decode', 'execute', 'memory', 'output', 'share'];
    const nextStep = (step + 1) as any;
    const current = steps[step];
    setActive(current);

    if (current === 'memory') {
      setValue(cmd.next);
    }

    if (step >= 5) {
      setStep(0);
      setActive('input');
      return;
    }
    setStep(nextStep);
  }

  function reset() {
    setValue(10);
    setInput(5);
    setFn('add');
    setStep(0);
    setActive('input');
  }

  const nodeCls = (k: typeof active) =>
    `rounded-2xl border px-4 py-3 transition ${
      active === k ? 'border-emerald-500/35 bg-emerald-500/10' : 'border-white/10 bg-white/5'
    }`;

  return (
    <div className={animFrame}>
      <div className={animLabel}>Animation</div>
      <div className={animTitle}>Computer Flow: input → decode → execute → memory → output → share</div>

      <div className="mt-3 flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <label className="text-xs text-slate-400">
            Input
            <input
              value={input}
              onChange={(e) => setInput(Number(e.target.value || 0))}
              type="number"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-200"
            />
          </label>
          <label className="text-xs text-slate-400">
            Function
            <select
              value={fn}
              onChange={(e) => setFn(e.target.value as Fn)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-200"
            >
              <option value="add">add (+)</option>
              <option value="sub">subtract (-)</option>
              <option value="mul">multiply (×)</option>
            </select>
          </label>
          <div className="flex gap-2">
            <button onClick={doStep} className="mt-5 rounded-full bg-emerald-500/90 hover:bg-emerald-500 text-white font-extrabold px-4 py-2 text-sm">
              Step
            </button>
            <button onClick={reset} className={animBtn + " mt-5 px-4 py-2 text-sm"}>
              Reset
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Current state value: <span className="font-mono font-bold text-slate-200">{value}</span>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-3">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-2 items-stretch">
          <div className={nodeCls('input')}>
            <div className="text-xs text-slate-400">Input</div>
            <div className="text-sm font-extrabold">{input}</div>
          </div>
          <div className={nodeCls('decode')}>
            <div className="text-xs text-slate-400">Decode</div>
            <div className="text-sm font-extrabold">{cmd.label} {input}</div>
          </div>
          <div className={nodeCls('execute')}>
            <div className="text-xs text-slate-400">Execute</div>
            <div className="text-sm font-extrabold">{cmd.prev} {cmd.symbol} {input}</div>
          </div>
          <div className={nodeCls('memory')}>
            <div className="text-xs text-slate-400">Memory</div>
            <div className="text-sm font-extrabold">{value}</div>
          </div>
          <div className={nodeCls('output')}>
            <div className="text-xs text-slate-400">Output</div>
            <div className="text-sm font-extrabold">{value}</div>
          </div>
          <div className={nodeCls('share')}>
            <div className="text-xs text-slate-400">Another computer</div>
            <div className="text-sm font-extrabold">reads {value}</div>
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-400">
        This mirrors the upstream “computer-flow” concept: inputs are processed; memory/state changes; others can read the result.
      </div>
    </div>
  );
}

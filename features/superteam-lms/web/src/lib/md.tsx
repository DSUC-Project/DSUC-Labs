import React from 'react';

// Minimal markdown renderer (headings + paragraphs + lists + code blocks).
// Keeps deps light for the MVP.

function renderInline(text: string): React.ReactNode {
  // Supports: **bold**, *italic*, `code`
  // Simple tokenizer, not a full markdown spec.
  const tokens: Array<{ type: 'text' | 'bold' | 'italic' | 'code'; value: string }> = [];

  let i = 0;
  while (i < text.length) {
    // code: `...`
    if (text[i] === '`') {
      const j = text.indexOf('`', i + 1);
      if (j !== -1) {
        tokens.push({ type: 'code', value: text.slice(i + 1, j) });
        i = j + 1;
        continue;
      }
    }

    // bold: **...**
    if (text[i] === '*' && text[i + 1] === '*') {
      const j = text.indexOf('**', i + 2);
      if (j !== -1) {
        tokens.push({ type: 'bold', value: text.slice(i + 2, j) });
        i = j + 2;
        continue;
      }
    }

    // italic: *...*
    if (text[i] === '*') {
      const j = text.indexOf('*', i + 1);
      if (j !== -1) {
        tokens.push({ type: 'italic', value: text.slice(i + 1, j) });
        i = j + 1;
        continue;
      }
    }

    // plain text chunk
    let j = i + 1;
    while (j < text.length && text[j] !== '`' && text[j] !== '*') j++;
    tokens.push({ type: 'text', value: text.slice(i, j) });
    i = j;
  }

  return (
    <>
      {tokens.map((t, idx) => {
        if (t.type === 'bold') return <strong key={idx} className="font-extrabold">{t.value}</strong>;
        if (t.type === 'italic') return <em key={idx} className="italic">{t.value}</em>;
        if (t.type === 'code') return <code key={idx} className="rounded-md border border-white/10 bg-white/5 px-1 py-0.5 font-mono text-[0.95em] text-indigo-200">{t.value}</code>;
        return <React.Fragment key={idx}>{t.value}</React.Fragment>;
      })}
    </>
  );
}

export function renderMd(md: string) {
  const lines = md.split(/\r?\n/);
  const out: React.ReactNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        buf.push(lines[i]);
        i++;
      }
      // consume closing ```
      i++;
      out.push(
        <pre key={`code-${out.length}`} className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-4 overflow-x-auto text-xs text-slate-200">
          <code>{buf.join('\n')}</code>
        </pre>
      );
      continue;
    }

    if (line.startsWith('# ')) {
      out.push(
        <h1 key={`h1-${out.length}`} className="text-2xl font-black tracking-tight text-white font-display">
          {renderInline(line.slice(2))}
        </h1>
      );
      i++;
      continue;
    }

    if (line.startsWith('## ')) {
      out.push(
        <h2 key={`h2-${out.length}`} className="mt-6 text-lg font-extrabold text-white font-display">
          {renderInline(line.slice(3))}
        </h2>
      );
      i++;
      continue;
    }

    if (line.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2));
        i++;
      }
      out.push(
        <ul key={`ul-${out.length}`} className="mt-3 list-disc pl-5 space-y-1 text-sm text-slate-300">
          {items.map((t, idx) => (
            <li key={`${idx}-${t}`}>{renderInline(t)}</li>
          ))}
        </ul>
      );
      continue;
    }

    if (!line.trim()) {
      i++;
      continue;
    }

    // paragraph
    const para: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !lines[i].startsWith('#') && !lines[i].startsWith('- ') && !lines[i].startsWith('```')) {
      para.push(lines[i]);
      i++;
    }

    out.push(
      <p key={`p-${out.length}`} className="mt-3 text-sm leading-6 text-slate-300">
        {renderInline(para.join(' '))}
      </p>
    );
  }

  return out;
}

import React, { useMemo, useRef } from 'react';

type CodeLanguage = 'typescript' | 'rust' | 'text';

const TS_KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'switch',
  'case', 'break', 'continue', 'import', 'from', 'export', 'default', 'class', 'extends',
  'new', 'async', 'await', 'try', 'catch', 'finally', 'throw', 'typeof', 'instanceof',
  'true', 'false', 'null', 'undefined', 'interface', 'type', 'public', 'private', 'protected',
]);

const RUST_KEYWORDS = new Set([
  'fn', 'let', 'mut', 'pub', 'impl', 'struct', 'enum', 'match', 'if', 'else', 'loop', 'for',
  'while', 'return', 'use', 'mod', 'trait', 'where', 'Self', 'self', 'Ok', 'Err', 'Result',
  'Some', 'None', 'true', 'false', 'as', 'in', 'move', 'crate',
]);

const VS_METHOD_NAMES = new Set([
  'map', 'filter', 'reduce', 'find', 'push', 'slice', 'split', 'trim', 'replace',
  'from', 'fromEntries', 'entries', 'keys', 'values', 'includes', 'open', 'log',
  'error', 'warn', 'then', 'catch', 'finally', 'test', 'exec', 'toString',
  'extend_from_slice', 'to_le_bytes', 'as_bytes',
]);

function normalizeLanguage(input?: string): CodeLanguage {
  if (input === 'typescript' || input === 'ts' || input === 'tsx' || input === 'javascript') {
    return 'typescript';
  }

  if (input === 'rust' || input === 'rs') {
    return 'rust';
  }

  return 'text';
}

function getKeywordSet(language: CodeLanguage) {
  if (language === 'rust') {
    return RUST_KEYWORDS;
  }

  if (language === 'typescript') {
    return TS_KEYWORDS;
  }

  return new Set<string>();
}

function tokenizeLine(line: string, language: CodeLanguage) {
  const keywordSet = getKeywordSet(language);
  const commentToken = language === 'rust' ? /\/\/.*/g : /\/\/.*/g;
  const tokenPattern =
    /\/\/.*|"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|`(?:\\.|[^`])*`|\b\d[\d_]*(?:\.\d+)?n?\b|[A-Za-z_][A-Za-z0-9_]*|[{}()[\].,;:+\-*/%=&|!<>?#]+|\s+|./g;

  const commentMatch = line.match(commentToken);
  const commentStart = commentMatch ? line.indexOf(commentMatch[0]) : -1;
  const safeLine = String(line || '');
  const pieces: Array<{ text: string; className: string }> = [];

  for (const match of safeLine.matchAll(tokenPattern)) {
    const text = match[0];
    const index = match.index ?? 0;

    if (commentStart >= 0 && index >= commentStart) {
      pieces.push({ text, className: 'text-[#6A9955]' });
      continue;
    }

    if (/^\s+$/.test(text)) {
      pieces.push({ text, className: '' });
      continue;
    }

    if (/^"(?:\\.|[^"])*"$|^'(?:\\.|[^'])*'$|^`(?:\\.|[^`])*`$/.test(text)) {
      pieces.push({ text, className: 'text-[#CE9178]' });
      continue;
    }

    if (/^\d/.test(text)) {
      pieces.push({ text, className: 'text-[#B5CEA8]' });
      continue;
    }

    if (keywordSet.has(text)) {
      pieces.push({ text, className: 'text-[#C586C0]' });
      continue;
    }

    if (/^[A-Z][A-Za-z0-9_]*$/.test(text)) {
      pieces.push({ text, className: 'text-[#4EC9B0]' });
      continue;
    }

    if (VS_METHOD_NAMES.has(text)) {
      pieces.push({ text, className: 'text-[#DCDCAA]' });
      continue;
    }

    if (/^(console|window|Math|JSON|Object|Array|Promise|Number|String|Boolean|Date|SystemProgram|Transaction|PublicKey|Connection)$/.test(text)) {
      pieces.push({ text, className: 'text-[#4FC1FF]' });
      continue;
    }

    if (/^(string|number|boolean|Vec|String|u8|u32|u64|i32|i64|Pubkey|Context|AccountInfo|Uint8Array|DataView|TextEncoder|TextDecoder)$/.test(text)) {
      pieces.push({ text, className: 'text-[#4EC9B0]' });
      continue;
    }

    if (/^[{}()[\].,;:+\-*/%=&|!<>?#]+$/.test(text)) {
      pieces.push({ text, className: 'text-[#D4D4D4]' });
      continue;
    }

    pieces.push({ text, className: 'text-[#D4D4D4]' });
  }

  return pieces;
}

function CodeLines({
  code,
  language,
}: {
  code: string;
  language: CodeLanguage;
}) {
  const lines = useMemo(() => String(code || '').replace(/\n$/, '').split('\n'), [code]);

  return (
    <>
      {lines.map((line, lineIndex) => {
        const tokens = tokenizeLine(line, language);

        return (
          <div key={`line-${lineIndex}`} className="flex min-h-[24px]">
            <span className="w-10 shrink-0 pr-4 text-right text-xs text-[#6E7681] select-none">
              {lineIndex + 1}
            </span>
            <span className="flex-1 whitespace-pre-wrap break-words">
              {tokens.length === 0 ? (
                <span className="text-[#D4D4D4]">&nbsp;</span>
              ) : (
                tokens.map((token, tokenIndex) => (
                  <span key={`token-${lineIndex}-${tokenIndex}`} className={token.className}>
                    {token.text}
                  </span>
                ))
              )}
            </span>
          </div>
        );
      })}
    </>
  );
}

export function CodeSurface({
  code,
  language,
  label,
  className = '',
  maxHeightClass = 'max-h-[500px]',
}: {
  code: string;
  language?: string;
  label?: string;
  className?: string;
  maxHeightClass?: string;
}) {
  const normalizedLanguage = normalizeLanguage(language);

  return (
    <div className={`overflow-hidden border-4 border-brutal-black bg-[#1e1e1e] shadow-neo-sm ${className}`}>
      <div className="flex items-center gap-2 border-b-4 border-brutal-black bg-[#252526] px-4 py-2">
        <div className="h-3 w-3 rounded-full border border-black/40 bg-[#F14C4C]" />
        <div className="h-3 w-3 rounded-full border border-black/40 bg-[#CCA700]" />
        <div className="h-3 w-3 rounded-full border border-black/40 bg-[#3BA55D]" />
        <div className="ml-auto text-[10px] font-black uppercase tracking-[0.2em] text-[#9DA5B4]">
          {label || normalizedLanguage}
        </div>
      </div>
      <div className={`overflow-auto brutal-scrollbar ${maxHeightClass}`}>
        <pre className="min-w-full bg-[#1e1e1e] px-4 py-4 font-mono text-[13px] leading-6">
          <CodeLines code={code} language={normalizedLanguage} />
        </pre>
      </div>
    </div>
  );
}

export function CodeEditorPane({
  value,
  onChange,
  language,
  placeholder,
  className = '',
}: {
  value: string;
  onChange: (next: string) => void;
  language?: string;
  placeholder?: string;
  className?: string;
}) {
  const normalizedLanguage = normalizeLanguage(language);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className={`overflow-hidden border-4 border-brutal-black bg-[#1e1e1e] shadow-neo ${className}`}>
      <div className="flex items-center gap-2 border-b-4 border-brutal-black bg-[#252526] px-4 py-2">
        <div className="h-3 w-3 rounded-full border border-black/40 bg-[#F14C4C]" />
        <div className="h-3 w-3 rounded-full border border-black/40 bg-[#CCA700]" />
        <div className="h-3 w-3 rounded-full border border-black/40 bg-[#3BA55D]" />
        <div className="ml-auto text-[10px] font-black uppercase tracking-[0.2em] text-[#9DA5B4]">
          {normalizedLanguage}
        </div>
      </div>
      <div className="relative h-[620px] bg-[#1e1e1e]">
        <div
          ref={overlayRef}
          className="pointer-events-none absolute inset-0 overflow-auto brutal-scrollbar"
        >
          <pre className="min-h-full min-w-full px-4 py-4 font-mono text-[13px] leading-6">
            {value ? (
              <CodeLines code={value} language={normalizedLanguage} />
            ) : (
              <div className="flex min-h-[24px]">
                <span className="w-10 shrink-0 pr-4 text-right text-xs text-[#6E7681] select-none">1</span>
                <span className="text-[#6E7681]">{placeholder || ''}</span>
              </div>
            )}
          </pre>
        </div>
        <textarea
          value={value}
          spellCheck={false}
          onChange={(event) => onChange(event.target.value)}
          onScroll={(event) => {
            const target = event.currentTarget;
            if (overlayRef.current) {
              overlayRef.current.scrollTop = target.scrollTop;
              overlayRef.current.scrollLeft = target.scrollLeft;
            }
            if (gutterRef.current) {
              gutterRef.current.scrollTop = target.scrollTop;
            }
          }}
          className="absolute inset-0 h-full w-full resize-none bg-transparent px-4 py-4 font-mono text-[13px] leading-6 outline-none"
          style={{
            color: 'transparent',
            caretColor: '#D4D4D4',
            WebkitTextFillColor: 'transparent',
          }}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

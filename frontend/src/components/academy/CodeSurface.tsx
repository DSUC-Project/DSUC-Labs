import React, { useMemo, useRef } from "react";

type CodeLanguage = "typescript" | "rust" | "text";

const TS_KEYWORDS = new Set([
  "const",
  "let",
  "var",
  "function",
  "return",
  "if",
  "else",
  "for",
  "while",
  "switch",
  "case",
  "break",
  "continue",
  "import",
  "from",
  "export",
  "default",
  "class",
  "extends",
  "new",
  "async",
  "await",
  "try",
  "catch",
  "finally",
  "throw",
  "typeof",
  "instanceof",
  "true",
  "false",
  "null",
  "undefined",
  "interface",
  "type",
  "public",
  "private",
  "protected",
]);

const RUST_KEYWORDS = new Set([
  "fn",
  "let",
  "mut",
  "pub",
  "impl",
  "struct",
  "enum",
  "match",
  "if",
  "else",
  "loop",
  "for",
  "while",
  "return",
  "use",
  "mod",
  "trait",
  "where",
  "Self",
  "self",
  "Ok",
  "Err",
  "Result",
  "Some",
  "None",
  "true",
  "false",
  "as",
  "in",
  "move",
  "crate",
]);

const VS_METHOD_NAMES = new Set([
  "map",
  "filter",
  "reduce",
  "find",
  "push",
  "slice",
  "split",
  "trim",
  "replace",
  "from",
  "fromEntries",
  "entries",
  "keys",
  "values",
  "includes",
  "open",
  "log",
  "error",
  "warn",
  "then",
  "catch",
  "finally",
  "test",
  "exec",
  "toString",
  "extend_from_slice",
  "to_le_bytes",
  "as_bytes",
]);

function normalizeLanguage(input?: string): CodeLanguage {
  if (
    input === "typescript" ||
    input === "ts" ||
    input === "tsx" ||
    input === "javascript"
  ) {
    return "typescript";
  }

  if (input === "rust" || input === "rs") {
    return "rust";
  }

  return "text";
}

function getKeywordSet(language: CodeLanguage) {
  if (language === "rust") {
    return RUST_KEYWORDS;
  }

  if (language === "typescript") {
    return TS_KEYWORDS;
  }

  return new Set<string>();
}

function tokenizeLine(line: string, language: CodeLanguage) {
  const keywordSet = getKeywordSet(language);
  const commentToken = language === "rust" ? /\/\/.*/g : /\/\/.*/g;
  const tokenPattern =
    /\/\/.*|"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|`(?:\\.|[^`])*`|\b\d[\d_]*(?:\.\d+)?n?\b|[A-Za-z_][A-Za-z0-9_]*|[{}()[\].,;:+\-*/%=&|!<>?#]+|\s+|./g;

  const commentMatch = line.match(commentToken);
  const commentStart = commentMatch ? line.indexOf(commentMatch[0]) : -1;
  const safeLine = String(line || "");
  const pieces: Array<{ text: string; className: string }> = [];

  for (const match of safeLine.matchAll(tokenPattern)) {
    const text = match[0];
    const index = match.index ?? 0;

    if (commentStart >= 0 && index >= commentStart) {
      pieces.push({ text, className: "syntax-token-comment" });
      continue;
    }

    if (/^\s+$/.test(text)) {
      pieces.push({ text, className: "" });
      continue;
    }

    if (/^"(?:\\.|[^"])*"$|^'(?:\\.|[^'])*'$|^`(?:\\.|[^`])*`$/.test(text)) {
      pieces.push({ text, className: "syntax-token-string" });
      continue;
    }

    if (/^\d/.test(text)) {
      pieces.push({ text, className: "syntax-token-number" });
      continue;
    }

    if (keywordSet.has(text)) {
      pieces.push({ text, className: "syntax-token-keyword" });
      continue;
    }

    if (/^[A-Z][A-Za-z0-9_]*$/.test(text)) {
      pieces.push({ text, className: "syntax-token-type" });
      continue;
    }

    if (VS_METHOD_NAMES.has(text)) {
      pieces.push({ text, className: "syntax-token-method" });
      continue;
    }

    if (
      /^(console|window|Math|JSON|Object|Array|Promise|Number|String|Boolean|Date|SystemProgram|Transaction|PublicKey|Connection)$/.test(
        text,
      )
    ) {
      pieces.push({ text, className: "syntax-token-builtin" });
      continue;
    }

    if (
      /^(string|number|boolean|Vec|String|u8|u32|u64|i32|i64|Pubkey|Context|AccountInfo|Uint8Array|DataView|TextEncoder|TextDecoder)$/.test(
        text,
      )
    ) {
      pieces.push({ text, className: "syntax-token-type" });
      continue;
    }

    if (/^[{}()[\].,;:+\-*/%=&|!<>?#]+$/.test(text)) {
      pieces.push({ text, className: "syntax-token-punctuation" });
      continue;
    }

    pieces.push({ text, className: "syntax-token-plain" });
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
  const lines = useMemo(
    () =>
      String(code || "")
        .replace(/\n$/, "")
        .split("\n"),
    [code],
  );

  return (
    <>
      {lines.map((line, lineIndex) => {
        const tokens = tokenizeLine(line, language);

        return (
          <div key={`line-${lineIndex}`} className="min-h-[24px]">
            <span className="whitespace-pre">
              {tokens.length === 0 ? (
                <span className="syntax-token-plain">&nbsp;</span>
              ) : (
                tokens.map((token, tokenIndex) => (
                  <span
                    key={`token-${lineIndex}-${tokenIndex}`}
                    className={token.className}
                  >
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
  className = "",
  maxHeightClass = "max-h-[500px]",
}: {
  code: string;
  language?: string;
  label?: string;
  className?: string;
  maxHeightClass?: string;
}) {
  const normalizedLanguage = normalizeLanguage(language);
  const linesCount = useMemo(
    () =>
      String(code || "")
        .replace(/\n$/, "")
        .split("\n").length,
    [code],
  );

  return (
    <div
      className={`overflow-hidden border-[3px] border-text-main bg-[#fffdf8] shadow-[6px_6px_0_0_rgba(63,44,14,0.14)] dark:bg-[#0B0F17] dark:shadow-[6px_6px_0_0_rgba(0,0,0,0.48)] flex flex-col ${className}`}
    >
      <div className="flex items-center gap-2 border-b-[3px] border-text-main bg-[#efe5d6] px-4 py-3 shrink-0 dark:bg-[#151B26]">
        <div className="h-3 w-3 rounded-full bg-[#F14C4C]" />
        <div className="h-3 w-3 rounded-full bg-[#CCA700]" />
        <div className="h-3 w-3 rounded-full bg-[#3BA55D]" />
        <div className="ml-auto font-mono text-[10px] font-black uppercase tracking-widest text-text-main dark:text-[#E8E4DC]">
          {label || normalizedLanguage}
        </div>
      </div>
      <div
        className={`relative flex-1 overflow-auto bg-[#fffdf8] dark:bg-[#0B0F17] ${maxHeightClass}`}
      >
        <div className="absolute bottom-0 left-0 top-0 w-[48px] border-r border-[#d7cab6] bg-[#f6efe3] py-4 pr-4 text-right font-mono text-xs leading-[24px] text-[#81725f] select-none dark:border-slate-800 dark:bg-[#0B0F17] dark:text-[#6E7681]">
          {Array.from({ length: linesCount }).map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <pre className="min-w-full m-0 bg-transparent p-0 py-4 pl-[48px] pr-4 font-mono text-[13px] leading-[24px]">
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
  className = "",
}: {
  value: string;
  onChange: (next: string) => void;
  language?: string;
  placeholder?: string;
  className?: string;
}) {
  const normalizedLanguage = normalizeLanguage(language);
  const gutterRef = useRef<HTMLDivElement | null>(null);
  const highlightRef = useRef<HTMLDivElement | null>(null);
  const linesCount = useMemo(
    () =>
      String(value || placeholder || "")
        .replace(/\n$/, "")
        .split("\n").length,
    [value, placeholder],
  );

  return (
    <div
      className={`overflow-hidden border-[3px] border-text-main bg-[#fffdf8] shadow-[6px_6px_0_0_rgba(63,44,14,0.14)] dark:bg-[#0B0F17] dark:shadow-[6px_6px_0_0_rgba(0,0,0,0.48)] flex min-h-[340px] flex-1 flex-col sm:min-h-[460px] ${className}`}
    >
      <div className="flex items-center gap-2 border-b-[3px] border-text-main bg-[#efe5d6] px-4 py-3 shrink-0 dark:bg-[#151B26]">
        <div className="h-3 w-3 rounded-full bg-[#F14C4C]" />
        <div className="h-3 w-3 rounded-full bg-[#CCA700]" />
        <div className="h-3 w-3 rounded-full bg-[#3BA55D]" />
        <div className="ml-auto font-mono text-[10px] font-black uppercase tracking-widest text-text-main dark:text-[#E8E4DC]">
          {normalizedLanguage}
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[56px_minmax(0,1fr)] bg-[#fffdf8] dark:bg-[#0B0F17]">
        <div
          ref={gutterRef}
          className="overflow-hidden border-r border-[#d7cab6] bg-[#f6efe3] py-4 pr-3 text-right font-mono text-xs leading-[24px] text-[#81725f] select-none dark:border-slate-800 dark:bg-[#0B0F17] dark:text-[#6E7681]"
        >
          {Array.from({ length: Math.max(1, linesCount) }).map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        <div className="relative min-h-[300px] sm:min-h-[420px]">
          <div
            ref={highlightRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <pre className="min-h-full min-w-full bg-transparent px-4 py-4 font-mono text-[13px] leading-[24px] whitespace-pre">
              <CodeLines
                code={value || placeholder || ""}
                language={normalizedLanguage}
              />
            </pre>
          </div>

          <textarea
            value={value}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Tab") {
                return;
              }

              event.preventDefault();
              const textarea = event.currentTarget;
              const selectionStart = textarea.selectionStart;
              const selectionEnd = textarea.selectionEnd;
              const indent = "  ";
              const nextValue =
                value.slice(0, selectionStart) +
                indent +
                value.slice(selectionEnd);

              onChange(nextValue);

              requestAnimationFrame(() => {
                textarea.selectionStart = selectionStart + indent.length;
                textarea.selectionEnd = selectionStart + indent.length;
              });
            }}
            onScroll={(event) => {
              if (gutterRef.current) {
                gutterRef.current.scrollTop = event.currentTarget.scrollTop;
              }
              if (highlightRef.current) {
                highlightRef.current.scrollTop = event.currentTarget.scrollTop;
                highlightRef.current.scrollLeft = event.currentTarget.scrollLeft;
              }
            }}
            className="relative min-h-[300px] w-full resize-none overflow-auto bg-transparent px-4 py-4 font-mono text-[13px] leading-[24px] whitespace-pre outline-none selection:bg-primary/20 sm:min-h-[420px]"
            style={{
              color: "transparent",
              WebkitTextFillColor: "transparent",
              caretColor: "var(--text-main)",
              tabSize: 4,
            }}
            placeholder={placeholder}
            wrap="off"
          />
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mt-8 text-3xl font-display font-black uppercase tracking-[0.14em] text-cyber-yellow first:mt-0 sm:text-4xl">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-8 border-l-4 border-cyber-blue pl-4 text-2xl font-display font-bold uppercase tracking-[0.12em] text-white first:mt-0 sm:text-3xl">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-6 text-xl font-display font-bold uppercase tracking-[0.08em] text-cyber-blue sm:text-2xl">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-5 text-lg font-display font-semibold uppercase tracking-[0.08em] text-white sm:text-xl">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="mt-4 text-base leading-8 text-white/84 first:mt-0 sm:text-[1.05rem]">
      {children}
    </p>
  ),
  strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic text-cyber-yellow/90">{children}</em>,
  ul: ({ children }) => (
    <ul className="mt-4 list-disc space-y-3 pl-6 text-base leading-8 text-white/82 marker:text-cyber-blue sm:text-[1.02rem]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-4 list-decimal space-y-3 pl-6 text-base leading-8 text-white/82 marker:font-bold marker:text-cyber-yellow sm:text-[1.02rem]">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="mt-5 border-l-4 border-cyber-yellow/70 bg-cyber-yellow/6 px-5 py-4 text-base italic leading-8 text-white/82">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-semibold text-cyber-blue underline decoration-cyber-blue/35 underline-offset-4 transition-colors hover:text-white"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-8 border-white/12" />,
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto rounded-xl border border-white/12 bg-black/28">
      <table className="min-w-full border-collapse text-left text-sm text-white/86">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-cyber-blue/12">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-white/8">{children}</tbody>,
  tr: ({ children }) => <tr className="align-top">{children}</tr>,
  th: ({ children }) => (
    <th className="border-b border-cyber-blue/20 px-4 py-3 font-display text-xs font-bold uppercase tracking-[0.18em] text-cyber-blue">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="px-4 py-3 leading-7 text-white/82">{children}</td>,
  pre: ({ children }) => (
    <pre className="my-6 overflow-x-auto rounded-xl border border-cyber-blue/18 bg-black/62 p-5 text-sm leading-7 text-cyan-100 shadow-[0_0_18px_rgba(41,121,255,0.08)]">
      {children}
    </pre>
  ),
  code: ({ inline, className, children }) => {
    const content = String(children).replace(/\n$/, '');
    if (inline) {
      return (
        <code className="rounded-md border border-white/10 bg-white/6 px-1.5 py-0.5 font-mono text-[0.92em] text-cyber-yellow">
          {content}
        </code>
      );
    }

    return (
      <code className={`font-mono text-[0.92em] text-cyan-100 ${className || ''}`.trim()}>
        {content}
      </code>
    );
  },
  input: ({ type, checked }) => {
    if (type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={checked}
          readOnly
          disabled
          className="mr-2 h-4 w-4 accent-cyber-blue"
        />
      );
    }

    return <input type={type} checked={checked} readOnly disabled />;
  },
};

export function renderMd(md: string) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {md}
    </ReactMarkdown>
  );
}

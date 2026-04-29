import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

function textFromChildren(children: React.ReactNode): string {
  return React.Children.toArray(children)
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number') {
        return String(child);
      }

      if (React.isValidElement(child)) {
        return textFromChildren((child.props as { children?: React.ReactNode }).children);
      }

      return '';
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function slugifyMarkdownHeading(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[`*_~]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function heading<Tag extends 'h1' | 'h2' | 'h3' | 'h4'>(tag: Tag, className: string) {
  return function Heading({ children }: { children?: React.ReactNode }) {
    const id = slugifyMarkdownHeading(textFromChildren(children));
    return React.createElement(tag, { id, className }, children);
  };
}

const markdownComponents: Components = {
  h1: heading(
    'h1',
    'mt-8 scroll-mt-28 text-3xl font-display font-black uppercase tracking-[0.14em] text-brutal-black first:mt-0 sm:text-4xl'
  ),
  h2: heading(
    'h2',
    'mt-8 scroll-mt-28 border-l-4 border-brutal-blue pl-4 text-2xl font-display font-black uppercase tracking-[0.12em] text-brutal-black first:mt-0 sm:text-3xl'
  ),
  h3: heading(
    'h3',
    'mt-6 scroll-mt-28 text-xl font-display font-black uppercase tracking-[0.08em] text-brutal-blue sm:text-2xl'
  ),
  h4: heading(
    'h4',
    'mt-5 scroll-mt-28 text-lg font-display font-black uppercase tracking-[0.08em] text-brutal-black sm:text-xl'
  ),
  p: ({ children }) => (
    <p className="mt-4 text-base leading-8 text-gray-900 first:mt-0 sm:text-[1.05rem]">
      {children}
    </p>
  ),
  strong: ({ children }) => <strong className="font-black text-brutal-black">{children}</strong>,
  em: ({ children }) => <em className="italic text-brutal-blue">{children}</em>,
  ul: ({ children }) => (
    <ul className="mt-4 list-disc space-y-3 pl-6 text-base leading-8 text-gray-900 marker:text-brutal-blue sm:text-[1.02rem]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-4 list-decimal space-y-3 pl-6 text-base leading-8 text-gray-900 marker:font-bold marker:text-brutal-pink sm:text-[1.02rem]">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="mt-5 border-4 border-brutal-black bg-[#fff1b8] px-5 py-4 text-base italic leading-8 text-brutal-black shadow-neo-sm">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-black text-brutal-blue underline decoration-brutal-blue underline-offset-4 transition-colors hover:text-brutal-black"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-8 border-t-4 border-brutal-black" />,
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto border-4 border-brutal-black bg-white shadow-neo-sm">
      <table className="min-w-full border-collapse text-left text-sm text-brutal-black">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-brutal-yellow">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y-4 divide-brutal-black">{children}</tbody>,
  tr: ({ children }) => <tr className="align-top">{children}</tr>,
  th: ({ children }) => (
    <th className="border-b-4 border-brutal-black px-4 py-3 font-display text-xs font-black uppercase tracking-[0.18em] text-brutal-black">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="px-4 py-3 leading-7 text-gray-900">{children}</td>,
  pre: ({ children }) => (
    <pre className="my-6 overflow-x-auto border-4 border-brutal-black bg-slate-950 p-5 text-sm leading-7 text-slate-100 shadow-neo-sm">
      {children}
    </pre>
  ),
  code: ({ className, children, ...props }: any) => {
    const content = String(children).replace(/\n$/, '');
    if (props.inline) {
      return (
        <code className="border-2 border-brutal-black bg-[#fff1b8] px-1.5 py-0.5 font-mono text-[0.92em] font-bold text-brutal-black">
          {content}
        </code>
      );
    }

    return (
      <code className={`font-mono text-[0.92em] text-slate-100 ${className || ''}`.trim()}>
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
          className="mr-2 h-4 w-4 accent-brutal-blue"
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

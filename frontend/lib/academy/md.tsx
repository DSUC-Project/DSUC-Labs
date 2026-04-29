import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeSurface } from '@/components/academy/CodeSurface';

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

function rawTextFromChildren(children: React.ReactNode): string {
  return React.Children.toArray(children)
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number') {
        return String(child);
      }

      if (React.isValidElement(child)) {
        return rawTextFromChildren((child.props as { children?: React.ReactNode }).children);
      }

      return '';
    })
    .join('');
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
    'mt-8 mb-4 decoration-brutal-yellow underline decoration-4 underline-offset-8 text-3xl font-display font-black uppercase tracking-widest text-brutal-black first:mt-0 sm:text-4xl'
  ),
  h2: heading(
    'h2',
    'mt-8 mb-4 border-l-8 border-brutal-black bg-brutal-blue px-4 py-2 text-2xl font-display font-black uppercase tracking-wider text-brutal-black first:mt-0 sm:text-3xl shadow-neo-sm'
  ),
  h3: heading(
    'h3',
    'mt-6 mb-3 text-xl font-display font-black uppercase tracking-wide text-brutal-black sm:text-2xl flex items-center gap-2 before:content-[""] before:w-3 before:h-3 before:bg-brutal-pink before:border-2 before:border-brutal-black'
  ),
  h4: heading(
    'h4',
    'mt-5 mb-2 text-lg font-display font-black uppercase tracking-wide text-brutal-black sm:text-xl'
  ),
  p: ({ children }) => (
    <p className="mt-4 mb-4 text-base font-bold text-gray-800 first:mt-0 sm:text-lg">
      {children}
    </p>
  ),
  strong: ({ children }) => <strong className="font-black text-brutal-black bg-brutal-yellow px-1 border-2 border-brutal-black">{children}</strong>,
  em: ({ children }) => <em className="italic font-bold text-brutal-blue">{children}</em>,
  ul: ({ children }) => (
    <ul className="mt-4 mb-4 list-none space-y-2 pl-4 text-base font-bold text-gray-800 sm:text-lg border-l-4 border-brutal-black">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            className: `${(child.props as any).className || ''} relative before:content-[""] before:absolute before:-left-[18px] before:top-2.5 before:w-2 before:h-2 before:bg-brutal-black`
          } as any);
        }
        return child;
      })}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-4 mb-4 list-decimal space-y-2 pl-6 text-base font-bold text-gray-800 marker:font-black marker:text-brutal-black sm:text-lg">
      {children}
    </ol>
  ),
  li: ({ children, className }) => <li className={`pl-2 ${className || ''}`}>{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="mt-5 mb-5 border-4 border-brutal-black bg-brutal-yellow p-5 text-lg font-black text-brutal-black shadow-neo-sm">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-black text-white bg-brutal-blue border-b-4 border-brutal-black hover:bg-brutal-pink px-1 transition-colors hover:-translate-y-1 inline-block"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-8 border-[2px] border-brutal-black border-dashed" />,
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto border-4 border-brutal-black bg-white shadow-neo">
      <table className="min-w-full border-collapse text-left text-sm font-bold text-brutal-black">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-brutal-blue border-b-4 border-brutal-black">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y-4 divide-brutal-black">{children}</tbody>,
  tr: ({ children }) => <tr className="align-top hover:bg-brutal-yellow/50 transition-colors">{children}</tr>,
  th: ({ children }) => (
    <th className="border-r-4 border-brutal-black last:border-r-0 px-4 py-3 font-display text-sm font-black uppercase tracking-wider text-white">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="px-4 py-3 border-r-4 border-brutal-black last:border-r-0 text-base">{children}</td>,
  pre: ({ children }) => (
    <div className="my-6">
      <CodeSurface code={rawTextFromChildren(children)} label="lesson code" />
    </div>
  ),
  code: ({ className, children, ...props }: any) => {
    const content = String(children).replace(/\n$/, '');
    if (props.inline) {
      return (
        <code className="border-2 border-brutal-black bg-gray-200 px-1.5 py-0.5 font-mono text-sm font-bold text-brutal-pink">
          {content}
        </code>
      );
    }

    return <code className={className || ''}>{content}</code>;
  },
  input: ({ type, checked }) => {
    if (type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={checked}
          readOnly
          disabled
          className="mr-2 h-4 w-4 appearance-none border-2 border-brutal-black checked:bg-brutal-blue checked:focus:bg-brutal-blue relative checked:before:content-['✓'] checked:before:absolute checked:before:text-white checked:before:text-xs checked:before:font-black checked:before:left-0.5 checked:before:-top-0.5"
        />
      );
    }

    return <input type={type} checked={checked} readOnly disabled className="border-2 border-brutal-black" />;
  },
};

export function renderMd(md: string) {
  return (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {md}
      </ReactMarkdown>
    </div>
  );
}

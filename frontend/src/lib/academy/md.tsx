import React from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeSurface } from "@/components/academy/CodeSurface";

function textFromChildren(children: React.ReactNode): string {
  return React.Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }

      if (React.isValidElement(child)) {
        return textFromChildren(
          (child.props as { children?: React.ReactNode }).children,
        );
      }

      return "";
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function rawTextFromChildren(children: React.ReactNode): string {
  return React.Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }

      if (React.isValidElement(child)) {
        return rawTextFromChildren(
          (child.props as { children?: React.ReactNode }).children,
        );
      }

      return "";
    })
    .join("");
}

export function slugifyMarkdownHeading(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function heading<Tag extends "h1" | "h2" | "h3" | "h4">(
  tag: Tag,
  className: string,
) {
  return function Heading({ children }: { children?: React.ReactNode }) {
    const id = slugifyMarkdownHeading(textFromChildren(children));
    return React.createElement(tag, { id, className }, children);
  };
}

const markdownComponents: Components = {
  h1: heading(
    "h1",
    "mt-8 mb-4  pb-2 text-3xl font-heading font-bold uppercase tracking-tight text-text-main first:mt-0 sm:text-4xl",
  ),
  h2: heading(
    "h2",
    "mt-8 mb-4 border-b border-border-main pb-2 text-2xl font-heading font-bold text-text-main first:mt-0 sm:text-3xl",
  ),
  h3: heading(
    "h3",
    "mt-6 mb-3 text-xl font-heading font-bold text-text-main sm:text-2xl",
  ),
  h4: heading(
    "h4",
    "mt-5 mb-2 text-lg font-heading font-bold text-text-main sm:text-xl",
  ),
  p: ({ children }) => (
    <p className="mt-4 mb-4 text-base leading-relaxed text-text-muted first:mt-0 sm:text-lg">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-bold text-text-main">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-text-muted">{children}</em>,
  ul: ({ children }) => (
    <ul className="mt-4 mb-4 list-disc space-y-2 pl-6 text-base text-text-muted sm:text-lg">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-4 mb-4 list-decimal space-y-2 pl-6 text-base text-text-muted marker:font-bold marker:text-text-muted sm:text-lg">
      {children}
    </ol>
  ),
  li: ({ children, className }) => (
    <li className={`pl-2 ${className || ""}`}>{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mt-5 mb-5 border-l-4 border-primary bg-surface p-5 text-lg italic text-text-muted">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-8 " />,
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto rounded-lg  bg-surface shadow-sm">
      <table className="min-w-full border-collapse text-left text-sm text-text-main">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-main-bg border-b border-border-main">{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-border-main">{children}</tbody>
  ),
  tr: ({ children }) => (
    <tr className="align-top hover:bg-main-bg/50 transition-colors">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider text-text-muted">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="px-4 py-3 text-base">{children}</td>,
  pre: ({ children }) => (
    <div className="my-6">
      <CodeSurface code={rawTextFromChildren(children)} label="lesson code" />
    </div>
  ),
  code: ({ className, children, ...props }: any) => {
    const content = String(children).replace(/\n$/, "");
    if (props.inline) {
      return (
        <code className="rounded border border-border-main bg-surface px-1.5 py-0.5 font-mono text-sm text-text-main">
          {content}
        </code>
      );
    }

    return <code className={className || ""}>{content}</code>;
  },
  input: ({ type, checked }) => {
    if (type === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={checked}
          readOnly
          disabled
          className="mr-2 h-4 w-4 rounded border-border-main text-primary focus:ring-primary"
        />
      );
    }

    return (
      <input
        type={type}
        checked={checked}
        readOnly
        disabled
        className="border-border-main rounded"
      />
    );
  },
};

export function renderMd(md: string) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {md}
      </ReactMarkdown>
    </div>
  );
}

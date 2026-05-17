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

function normalizeFenceLanguage(input?: string) {
  if (!input) return "text";
  if (input === "ts" || input === "tsx" || input === "javascript") {
    return "typescript";
  }
  if (input === "rs") {
    return "rust";
  }
  return input;
}

function getCodeBlockProps(children: React.ReactNode) {
  const items = React.Children.toArray(children);
  const first = items[0];

  if (React.isValidElement(first)) {
    const props = first.props as {
      className?: string;
      children?: React.ReactNode;
    };
    const className = props.className || "";
    const match = /language-([a-z0-9]+)/i.exec(className);
    const language = normalizeFenceLanguage(match?.[1]);

    return {
      language,
      label: language === "text" ? "code" : language,
      code: rawTextFromChildren(props.children),
    };
  }

  return {
    language: "text",
    label: "code",
    code: rawTextFromChildren(children),
  };
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
    "mt-10 mb-4 font-display text-4xl font-black uppercase tracking-tighter text-text-main first:mt-0 sm:text-5xl",
  ),
  h2: heading(
    "h2",
    "mt-10 mb-4 font-display text-3xl font-black uppercase tracking-tight text-text-main first:mt-0 sm:text-4xl",
  ),
  h3: heading(
    "h3",
    "mt-8 mb-3 font-display text-2xl font-black uppercase tracking-tight text-text-main sm:text-3xl",
  ),
  h4: heading(
    "h4",
    "mt-6 mb-2 font-heading text-lg font-bold uppercase tracking-tight text-text-main sm:text-xl",
  ),
  p: ({ children }) => (
    <p className="mt-4 mb-4 max-w-[74ch] font-sans text-[15px] leading-7 text-text-main/85 first:mt-0 sm:text-base sm:leading-8">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-text-main">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-text-main/80">{children}</em>,
  ul: ({ children }) => (
    <ul className="mt-4 mb-5 max-w-[74ch] list-disc space-y-2 pl-6 font-sans text-[15px] leading-7 text-text-main/85 sm:text-base sm:leading-8">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-4 mb-5 max-w-[74ch] list-decimal space-y-2 pl-6 font-sans text-[15px] leading-7 text-text-main/85 marker:font-mono marker:text-text-muted sm:text-base sm:leading-8">
      {children}
    </ol>
  ),
  li: ({ children, className }) => (
    <li className={`pl-2 ${className || ""}`}>{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mt-6 mb-6 max-w-[74ch] border-l-4 border-primary bg-main-bg/70 px-5 py-4 font-sans text-[15px] leading-7 text-text-main shadow-sm sm:text-base sm:leading-8">
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
  hr: () => <hr className="my-10 border-t border-border-main" />,
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto border border-border-main bg-surface shadow-sm">
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
  td: ({ children }) => (
    <td className="px-4 py-3 font-sans text-sm leading-6 text-text-main/85">
      {children}
    </td>
  ),
  pre: ({ children }) => {
    const block = getCodeBlockProps(children);
    return (
      <div className="my-6">
        <CodeSurface
          code={block.code}
          language={block.language}
          label={block.label}
        />
      </div>
    );
  },
  code: ({ className, children, ...props }: any) => {
    const content = String(children).replace(/\n$/, "");
    if (props.inline) {
      return (
        <code className="bg-main-bg px-1.5 py-0.5 font-mono text-[13px] text-primary">
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

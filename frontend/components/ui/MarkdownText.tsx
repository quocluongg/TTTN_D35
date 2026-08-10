"use client";

import React from "react";

interface MarkdownTextProps {
  content: string;
  className?: string;
}

export default function MarkdownText({ content, className = "" }: MarkdownTextProps) {
  if (!content) return null;

  // Process inline markdown elements (**bold**, *italic*, `code`, [link](url))
  const renderInline = (text: string): React.ReactNode[] => {
    // Regex for inline code, bold, italic, and links
    const regex = /(\*\*.*?\*\*|\*.*?\*|__.*?__|`.*?`|\[.*?\]\(.*?\))/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;

      // Bold (**text** or __text__)
      if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
        return (
          <strong key={index} className="font-bold text-current">
            {part.slice(2, -2)}
          </strong>
        );
      }

      // Italic (*text*)
      if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
        return (
          <em key={index} className="italic">
            {part.slice(1, -1)}
          </em>
        );
      }

      // Inline code (`code`)
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono text-xs"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      // Links ([text](url))
      if (part.startsWith("[") && part.includes("](") && part.endsWith(")")) {
        const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) {
          return (
            <a
              key={index}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 font-semibold underline hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              {linkMatch[1]}
            </a>
          );
        }
      }

      return part;
    });
  };

  // Split lines into blocks
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let currentList: { type: "ul" | "ol"; items: React.ReactNode[] } | null = null;
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  const flushList = () => {
    if (!currentList) return;
    if (currentList.type === "ul") {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="my-2 space-y-1 pl-1 list-none">
          {currentList.items}
        </ul>
      );
    } else {
      blocks.push(
        <ol key={`ol-${blocks.length}`} className="my-2 space-y-1 pl-1 list-none">
          {currentList.items}
        </ol>
      );
    }
    currentList = null;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Code block toggle (```)
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        // End code block
        blocks.push(
          <pre
            key={`code-${idx}`}
            className="my-3 p-3 rounded-xl bg-zinc-900 text-zinc-100 font-mono text-xs overflow-x-auto border border-zinc-800"
          >
            <code>{codeBlockLines.join("\n")}</code>
          </pre>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    // Empty line
    if (!trimmed) {
      flushList();
      return;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      flushList();
      blocks.push(
        <h3 key={idx} className="text-sm font-bold text-current mt-3 mb-1 tracking-tight">
          {renderInline(trimmed.replace(/^###\s+/, ""))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      flushList();
      blocks.push(
        <h2 key={idx} className="text-base font-bold text-current mt-4 mb-1.5 tracking-tight">
          {renderInline(trimmed.replace(/^##\s+/, ""))}
        </h2>
      );
      return;
    }

    if (trimmed.startsWith("# ")) {
      flushList();
      blocks.push(
        <h1 key={idx} className="text-lg font-extrabold text-current mt-4 mb-2 tracking-tight">
          {renderInline(trimmed.replace(/^#\s+/, ""))}
        </h1>
      );
      return;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      flushList();
      blocks.push(
        <blockquote
          key={idx}
          className="my-2 border-l-3 border-blue-500 pl-3 py-0.5 text-current opacity-90 italic text-xs bg-blue-50/50 dark:bg-blue-950/30 rounded-r-md"
        >
          {renderInline(trimmed.replace(/^>\s+/, ""))}
        </blockquote>
      );
      return;
    }

    // Unordered List (- Item, * Item, • Item)
    const isUnordered = /^[-*•]\s+/.test(trimmed);
    if (isUnordered) {
      const itemText = trimmed.replace(/^[-*•]\s+/, "");
      const itemNode = (
        <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed">
          <span className="text-blue-500 font-bold select-none shrink-0 mt-0.5">•</span>
          <span className="flex-1">{renderInline(itemText)}</span>
        </li>
      );

      if (currentList && currentList.type === "ul") {
        currentList.items.push(itemNode);
      } else {
        flushList();
        currentList = { type: "ul", items: [itemNode] };
      }
      return;
    }

    // Ordered List (1. Item)
    const isOrdered = /^\d+\.\s+/.test(trimmed);
    if (isOrdered) {
      const match = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (match) {
        const num = match[1];
        const itemText = match[2];
        const itemNode = (
          <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed">
            <span className="font-bold text-blue-500 shrink-0 mt-0.5">{num}.</span>
            <span className="flex-1">{renderInline(itemText)}</span>
          </li>
        );

        if (currentList && currentList.type === "ol") {
          currentList.items.push(itemNode);
        } else {
          flushList();
          currentList = { type: "ol", items: [itemNode] };
        }
        return;
      }
    }

    // Regular Paragraph
    flushList();
    blocks.push(
      <p key={idx} className="text-xs sm:text-sm leading-relaxed my-1">
        {renderInline(trimmed)}
      </p>
    );
  });

  flushList();

  return <div className={`space-y-1 text-inherit ${className}`}>{blocks}</div>;
}

import React from "react";
import Link from "next/link";

/**
 * Renderer Markdown ringan untuk balasan AI. Tidak memakai
 * dangerouslySetInnerHTML: semua teks dirender sebagai node React sehingga
 * aman dari injeksi HTML. Mendukung heading, daftar, kutipan, **tebal**,
 * *miring*, `kode`, dan tautan [teks](url) dengan protokol aman.
 */

const INLINE_PATTERN =
  /(`[^`\n]+`)|(\*\*(?:[^*]|\*(?!\*))+?\*\*|__[^_\n]+?__)|(\*[^*\s](?:[^*\n]*[^*\s])?\*|(?<![\w])_[^_\s](?:[^_\n]*[^_\s])?_(?![\w]))|(\[[^\]\n]+\]\((?:https?:\/\/|\/)[^)\s]+\))/g;

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = new RegExp(INLINE_PATTERN.source, "g");
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const key = `${keyPrefix}-${i++}`;
    const [token, code, bold, italic, link] = match;

    if (code) {
      nodes.push(
        <code
          key={key}
          className="px-1.5 py-0.5 rounded bg-[#eceef0] text-[#012d1d] text-[0.85em] font-mono"
        >
          {code.slice(1, -1)}
        </code>,
      );
    } else if (bold) {
      nodes.push(
        <strong key={key} className="font-semibold text-[#012d1d]">
          {renderInline(bold.slice(2, -2), key)}
        </strong>,
      );
    } else if (italic) {
      nodes.push(<em key={key}>{renderInline(italic.slice(1, -1), key)}</em>);
    } else if (link) {
      const parts = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(link);
      if (parts) {
        const [, label, href] = parts;
        const className =
          "text-[#006c48] font-medium underline underline-offset-2 hover:text-[#012d1d]";
        nodes.push(
          href.startsWith("/") && !href.startsWith("//") ? (
            <Link key={key} href={href} className={className}>
              {label}
            </Link>
          ) : (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={className}
            >
              {label}
            </a>
          ),
        );
      } else {
        nodes.push(token);
      }
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; lines: string[] }
  | { type: "hr" }
  | { type: "p"; lines: string[] };

const HEADING = /^\s{0,3}(#{1,6})\s+(.*\S)\s*$/;
const UL_ITEM = /^\s*[-*•]\s+(.*)$/;
const OL_ITEM = /^\s*\d+[.)]\s+(.*)$/;
const QUOTE = /^\s*>\s?(.*)$/;
const HR = /^\s*([-*_])(\s*\1){2,}\s*$/;

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1].length,
        text: heading[2],
      });
      i += 1;
      continue;
    }

    if (HR.test(line)) {
      blocks.push({ type: "hr" });
      i += 1;
      continue;
    }

    if (UL_ITEM.test(line)) {
      const items: string[] = [];
      while (i < lines.length && UL_ITEM.test(lines[i])) {
        items.push(UL_ITEM.exec(lines[i])![1]);
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (OL_ITEM.test(line)) {
      const items: string[] = [];
      while (i < lines.length && OL_ITEM.test(lines[i])) {
        items.push(OL_ITEM.exec(lines[i])![1]);
        i += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    if (QUOTE.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && QUOTE.test(lines[i])) {
        quoteLines.push(QUOTE.exec(lines[i])![1]);
        i += 1;
      }
      blocks.push({ type: "quote", lines: quoteLines });
      continue;
    }

    const paragraph: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !HEADING.test(lines[i]) &&
      !UL_ITEM.test(lines[i]) &&
      !OL_ITEM.test(lines[i]) &&
      !QUOTE.test(lines[i]) &&
      !HR.test(lines[i])
    ) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: "p", lines: paragraph });
  }

  return blocks;
}

function renderLines(lines: string[], keyPrefix: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  lines.forEach((line, idx) => {
    if (idx > 0) out.push(<br key={`${keyPrefix}-br-${idx}`} />);
    out.push(...renderInline(line, `${keyPrefix}-l${idx}`));
  });
  return out;
}

export default function RichText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const blocks = parseBlocks(text);

  return (
    <div className={`flex flex-col gap-3 leading-relaxed ${className}`}>
      {blocks.map((block, idx) => {
        const key = `b${idx}`;
        switch (block.type) {
          case "heading":
            return (
              <p
                key={key}
                className="font-headline-sm text-base font-bold text-[#012d1d] mt-1"
              >
                {renderInline(block.text, key)}
              </p>
            );
          case "ul":
            return (
              <ul key={key} className="list-disc list-outside pl-5 space-y-1.5">
                {block.items.map((item, j) => (
                  <li key={`${key}-${j}`} className="pl-1 marker:text-[#006c48]">
                    {renderInline(item, `${key}-${j}`)}
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol
                key={key}
                className="list-decimal list-outside pl-5 space-y-1.5"
              >
                {block.items.map((item, j) => (
                  <li
                    key={`${key}-${j}`}
                    className="pl-1 marker:text-[#006c48] marker:font-semibold"
                  >
                    {renderInline(item, `${key}-${j}`)}
                  </li>
                ))}
              </ol>
            );
          case "quote":
            return (
              <blockquote
                key={key}
                className="border-l-4 border-[#92f7c3] bg-[#f2f4f6] rounded-r-lg px-3.5 py-2 italic text-[#414844]"
              >
                {renderLines(block.lines, key)}
              </blockquote>
            );
          case "hr":
            return <hr key={key} className="border-slate-200" />;
          default:
            return <p key={key}>{renderLines(block.lines, key)}</p>;
        }
      })}
    </div>
  );
}

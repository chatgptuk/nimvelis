import { Fragment, type ReactNode } from 'react';
import './markdown-content.css';

interface MarkdownContentProps {
  text: string;
  className?: string;
  ariaLabel?: string;
  emptyMessage?: string;
}

export function MarkdownContent({
  text,
  className = '',
  ariaLabel = 'Markdown content',
  emptyMessage,
}: MarkdownContentProps) {
  const blocks = renderBlocks(text);

  return (
    <article
      className={`markdown-content ${className}`.trim()}
      aria-label={ariaLabel}
      data-markdown-content
    >
      {blocks.length ? (
        blocks
      ) : emptyMessage ? (
        <span className="markdown-content__empty">{emptyMessage}</span>
      ) : null}
    </article>
  );
}

function renderBlocks(text: string): ReactNode[] {
  const lines = text.replace(/\r\n?/gu, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? '';
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = /^```([\w+-]*)\s*$/u.exec(line.trim());
    if (fence) {
      const language = fence[1];
      const code: string[] = [];
      const start = index;
      index += 1;
      while (index < lines.length && !/^```\s*$/u.test((lines[index] ?? '').trim())) {
        code.push(lines[index] ?? '');
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push(
        <pre key={`code-${start}`}>
          <code data-language={language || undefined}>{code.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/u.exec(line);
    if (heading) {
      const content = renderInline(heading[2], `heading-${index}`);
      const level = heading[1].length;
      if (level === 1) blocks.push(<h1 key={`heading-${index}`}>{content}</h1>);
      else if (level === 2) blocks.push(<h2 key={`heading-${index}`}>{content}</h2>);
      else if (level === 3) blocks.push(<h3 key={`heading-${index}`}>{content}</h3>);
      else blocks.push(<h4 key={`heading-${index}`}>{content}</h4>);
      index += 1;
      continue;
    }

    if (/^\s*(?:-{3,}|\*{3,})\s*$/u.test(line)) {
      blocks.push(<hr key={`rule-${index}`} />);
      index += 1;
      continue;
    }

    if (/^\s*>\s?/u.test(line)) {
      const quoteLines: string[] = [];
      const start = index;
      while (index < lines.length && /^\s*>\s?/u.test(lines[index] ?? '')) {
        quoteLines.push((lines[index] ?? '').replace(/^\s*>\s?/u, ''));
        index += 1;
      }
      blocks.push(
        <blockquote key={`quote-${start}`}>
          <p>{renderInlineLines(quoteLines, `quote-${start}`)}</p>
        </blockquote>,
      );
      continue;
    }

    const unordered = /^\s*[-*+]\s+(.+)$/u.exec(line);
    if (unordered) {
      const items: string[] = [];
      const start = index;
      while (index < lines.length) {
        const item = /^\s*[-*+]\s+(.+)$/u.exec(lines[index] ?? '');
        if (!item) break;
        items.push(item[1]);
        index += 1;
      }
      blocks.push(
        <ul key={`list-${start}`}>
          {items.map((item, itemIndex) => (
            <li key={`${start}-${itemIndex}`}>
              {renderInline(item, `list-${start}-${itemIndex}`)}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    const ordered = /^\s*\d+[.)]\s+(.+)$/u.exec(line);
    if (ordered) {
      const items: string[] = [];
      const start = index;
      while (index < lines.length) {
        const item = /^\s*\d+[.)]\s+(.+)$/u.exec(lines[index] ?? '');
        if (!item) break;
        items.push(item[1]);
        index += 1;
      }
      blocks.push(
        <ol key={`list-${start}`}>
          {items.map((item, itemIndex) => (
            <li key={`${start}-${itemIndex}`}>
              {renderInline(item, `list-${start}-${itemIndex}`)}
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    const paragraph: string[] = [];
    const start = index;
    while (index < lines.length && (lines[index] ?? '').trim()) {
      if (index !== start && isBlockStart(lines[index] ?? '')) break;
      paragraph.push(lines[index] ?? '');
      index += 1;
    }
    blocks.push(
      <p key={`paragraph-${start}`}>{renderInlineLines(paragraph, `paragraph-${start}`)}</p>,
    );
  }

  return blocks;
}

function isBlockStart(line: string): boolean {
  return (
    /^```/u.test(line.trim()) ||
    /^(#{1,4})\s+/u.test(line) ||
    /^\s*(?:-{3,}|\*{3,})\s*$/u.test(line) ||
    /^\s*>\s?/u.test(line) ||
    /^\s*[-*+]\s+/u.test(line) ||
    /^\s*\d+[.)]\s+/u.test(line)
  );
}

function renderInlineLines(lines: string[], key: string): ReactNode[] {
  return lines.flatMap((line, lineIndex) => [
    ...(lineIndex ? [<br key={`${key}-break-${lineIndex}`} />] : []),
    ...renderInline(line, `${key}-${lineIndex}`),
  ]);
}

function renderInline(text: string, key: string): ReactNode[] {
  const pattern = /(`[^`\n]+`|\*\*[^*\n]+\*\*|~~[^~\n]+~~|\[[^\]\n]+\]\([^\s)]+\)|\*[^*\n]+\*)/gu;
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let tokenIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const offset = match.index;
    const token = match[0];
    if (offset > cursor) {
      nodes.push(
        <Fragment key={`${key}-text-${tokenIndex}`}>{text.slice(cursor, offset)}</Fragment>,
      );
    }

    if (token.startsWith('`')) {
      nodes.push(<code key={`${key}-token-${tokenIndex}`}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith('**')) {
      nodes.push(<strong key={`${key}-token-${tokenIndex}`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('~~')) {
      nodes.push(<del key={`${key}-token-${tokenIndex}`}>{token.slice(2, -2)}</del>);
    } else if (token.startsWith('*')) {
      nodes.push(<em key={`${key}-token-${tokenIndex}`}>{token.slice(1, -1)}</em>);
    } else {
      const link = /^\[([^\]\n]+)\]\(([^\s)]+)\)$/u.exec(token);
      const href = link ? safeLink(link[2]) : null;
      nodes.push(
        href ? (
          <a
            key={`${key}-token-${tokenIndex}`}
            href={href}
            target="_blank"
            rel="noreferrer noopener"
          >
            {link?.[1]}
          </a>
        ) : (
          <Fragment key={`${key}-token-${tokenIndex}`}>{token}</Fragment>
        ),
      );
    }

    cursor = offset + token.length;
    tokenIndex += 1;
  }

  if (cursor < text.length) {
    nodes.push(<Fragment key={`${key}-tail`}>{text.slice(cursor)}</Fragment>);
  }
  return nodes;
}

function safeLink(value: string): string | null {
  try {
    const url = new URL(value);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

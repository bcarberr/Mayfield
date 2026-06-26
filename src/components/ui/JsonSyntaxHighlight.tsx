import { Fragment, type ReactNode } from "react";

const JSON_TOKEN =
  /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false)\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}\[\],:]|(\s+)/g;

const TOKEN_CLASS = {
  key: "text-datavis-data-pop-teal-20",
  string: "text-datavis-data-smalt-green-40",
  number: "text-datavis-data-peanut-orange",
  boolean: "text-datavis-data-rouge-40",
  null: "text-datavis-data-weak-red-30",
  punctuation: "text-text-tertiary",
} as const;

function highlightJsonLine(line: string, lineKey: number): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let tokenIndex = 0;
  const pattern = new RegExp(JSON_TOKEN.source, "g");

  for (const match of line.matchAll(pattern)) {
    const full = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      nodes.push(
        <Fragment key={`${lineKey}-plain-${tokenIndex++}`}>{line.slice(lastIndex, index)}</Fragment>,
      );
    }

    const quoted = match[1];
    const colonSuffix = match[2];

    if (quoted) {
      if (colonSuffix) {
        nodes.push(
          <span key={`${lineKey}-key-${tokenIndex++}`} className={TOKEN_CLASS.key}>
            {quoted}
          </span>,
        );
        nodes.push(
          <span key={`${lineKey}-colon-${tokenIndex++}`} className={TOKEN_CLASS.punctuation}>
            {colonSuffix}
          </span>,
        );
      } else {
        nodes.push(
          <span key={`${lineKey}-string-${tokenIndex++}`} className={TOKEN_CLASS.string}>
            {quoted}
          </span>,
        );
      }
    } else if (full === "true" || full === "false") {
      nodes.push(
        <span key={`${lineKey}-bool-${tokenIndex++}`} className={TOKEN_CLASS.boolean}>
          {full}
        </span>,
      );
    } else if (full === "null") {
      nodes.push(
        <span key={`${lineKey}-null-${tokenIndex++}`} className={TOKEN_CLASS.null}>
          {full}
        </span>,
      );
    } else if (/^-?\d/.test(full)) {
      nodes.push(
        <span key={`${lineKey}-num-${tokenIndex++}`} className={TOKEN_CLASS.number}>
          {full}
        </span>,
      );
    } else if (/^[{}\[\],:]$/.test(full)) {
      nodes.push(
        <span key={`${lineKey}-punct-${tokenIndex++}`} className={TOKEN_CLASS.punctuation}>
          {full}
        </span>,
      );
    } else {
      nodes.push(<Fragment key={`${lineKey}-ws-${tokenIndex++}`}>{full}</Fragment>);
    }

    lastIndex = index + full.length;
  }

  if (lastIndex < line.length) {
    nodes.push(<Fragment key={`${lineKey}-tail-${tokenIndex}`}>{line.slice(lastIndex)}</Fragment>);
  }

  return nodes;
}

export function JsonSyntaxHighlight({
  json,
  className = "",
}: {
  json: string;
  className?: string;
}) {
  const lines = json.split("\n");

  return (
    <pre
      className={`overflow-x-auto font-mono text-xs leading-relaxed text-text-secondary ${className}`.trim()}
    >
      <code>
        {lines.map((line, lineIndex) => (
          <span key={lineIndex} className="block whitespace-pre">
            {highlightJsonLine(line, lineIndex)}
          </span>
        ))}
      </code>
    </pre>
  );
}

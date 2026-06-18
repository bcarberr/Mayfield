import { normalizeTimeframeRange, type TimeframeRange } from "../context/TimeframeContext";

const CLAUSE_STOP_PATTERN =
  /\b(?:UNTIL|SINCE|FROM|WITH|SHOW|ORDER\s+BY|LIMIT|GROUP\s+BY|QUERY|SUMMARIZE|STATS|EXPLAIN|VALIDATE)\b/i;

const RELATIVE_TIME_PATTERN =
  /^(\d+)\s*(m|min|mins|minutes?|h|hr|hrs|hours?|d|day|days?|w|wk|weeks?|mo|months?)?$/i;

const DEFAULT_WINDOW_MS = 30 * 60 * 1000;

function unitToMilliseconds(unit: string): number {
  const normalized = unit.toLowerCase();
  if (normalized.startsWith("m")) return 60_000;
  if (normalized.startsWith("h")) return 3_600_000;
  if (normalized.startsWith("d")) return 86_400_000;
  if (normalized.startsWith("w")) return 7 * 86_400_000;
  return 30 * 86_400_000;
}

function parseFsqlTimeToken(token: string, reference: Date): Date | null {
  const trimmed = token.trim();
  if (!trimmed) return null;

  const quoted = trimmed.match(/^(['"])(.+)\1$/);
  if (quoted) {
    const parsed = new Date(quoted[2]);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (/^\d{10,13}$/.test(trimmed)) {
    const ms = trimmed.length === 10 ? Number(trimmed) * 1000 : Number(trimmed);
    const parsed = new Date(ms);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const relative = trimmed.match(RELATIVE_TIME_PATTERN);
  if (relative) {
    const amount = Number(relative[1]);
    const unit = relative[2] ?? "h";
    return new Date(reference.getTime() - amount * unitToMilliseconds(unit));
  }

  const absolute = new Date(trimmed);
  return Number.isNaN(absolute.getTime()) ? null : absolute;
}

function extractClause(query: string, keyword: "SINCE" | "UNTIL"): string | null {
  const pattern = new RegExp(`\\b${keyword}\\s+`, "i");
  const match = pattern.exec(query);
  if (!match) return null;

  const rest = query.slice(match.index + match[0].length);
  const stopMatch = CLAUSE_STOP_PATTERN.exec(rest);
  const rawValue = (stopMatch ? rest.slice(0, stopMatch.index) : rest).trim();
  return rawValue || null;
}

/** Map FSQL `SINCE` / `UNTIL` clauses to an absolute timeframe range. */
export function parseFsqlTimeframe(query: string, reference = new Date()): TimeframeRange | null {
  const sinceToken = extractClause(query, "SINCE");
  const untilToken = extractClause(query, "UNTIL");
  if (!sinceToken && !untilToken) return null;

  let from: Date | null = null;
  let to: Date | null = null;

  if (sinceToken) {
    from = parseFsqlTimeToken(sinceToken, reference);
    if (!from) return null;
  }

  if (untilToken) {
    to = parseFsqlTimeToken(untilToken, reference);
    if (!to) return null;
  }

  if (from && !to) {
    to = reference;
  }

  if (!from && to) {
    from = new Date(to.getTime() - DEFAULT_WINDOW_MS);
  }

  if (!from || !to) return null;

  return normalizeTimeframeRange(from, to);
}

function removeClause(query: string, keyword: "SINCE" | "UNTIL"): string {
  const pattern = new RegExp(`\\s*\\b${keyword}\\s+[^\\n]*`, "gi");
  return query.replace(pattern, "");
}

function formatRelativeDuration(ms: number): string {
  const safeMs = Math.max(ms, 60_000);
  const minutes = Math.round(safeMs / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(safeMs / 3_600_000);
  if (hours < 48) return `${hours}hrs`;
  const days = Math.round(safeMs / 86_400_000);
  if (days < 14) return `${days}d`;
  const weeks = Math.round(days / 7);
  return `${weeks}w`;
}

/** Rewrite `SINCE` / `UNTIL` clauses so the query matches the header timeframe picker. */
export function applyTimeframeToFsqlQuery(
  query: string,
  range: TimeframeRange,
  reference = new Date(),
): string {
  const trimmed = removeClause(removeClause(query.trim(), "SINCE"), "UNTIL").replace(/\n{3,}/g, "\n\n").trim();
  const now = reference.getTime();
  const sinceMs = now - range.from.getTime();
  const untilMs = now - range.to.getTime();
  const sinceClause = `SINCE ${formatRelativeDuration(sinceMs)}`;
  const needsUntil = untilMs > 5 * 60_000;
  const untilClause = needsUntil ? `\nUNTIL ${formatRelativeDuration(untilMs)}` : "";
  return `${trimmed}\n${sinceClause}${untilClause}`.trim();
}

export function timeframeRangesEqual(a: TimeframeRange, b: TimeframeRange): boolean {
  return a.from.getTime() === b.from.getTime() && a.to.getTime() === b.to.getTime();
}

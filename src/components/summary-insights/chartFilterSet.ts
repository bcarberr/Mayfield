/** Toggle an id in a chart legend / widget multi-filter set. */
export function toggleChartFilter(current: ReadonlySet<string>, id: string): ReadonlySet<string> {
  const next = new Set(current);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export function chartFiltersActive(filters: ReadonlySet<string>): boolean {
  return filters.size > 0;
}

export function formatChartFilterLabels(filters: ReadonlySet<string>): string {
  return [...filters].join(", ");
}

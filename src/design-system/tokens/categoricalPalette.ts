/**
 * Categorical chart palette — base swatches only (no hover/pressed variants).
 * CSS source of truth: `--color-datavis-data-*` in `src/styles/tokens.css`.
 */

export const CATEGORICAL_PALETTE = [
  { id: "rouge-40", label: "Rouge 40", cssVar: "--color-datavis-data-rouge-40" },
  { id: "pop-teal-20", label: "Pop Teal 20", cssVar: "--color-datavis-data-pop-teal-20" },
  { id: "smalt-green-40", label: "Smalt Green 40", cssVar: "--color-datavis-data-smalt-green-40" },
  { id: "weak-red-30", label: "Weak Red 30", cssVar: "--color-datavis-data-weak-red-30" },
  { id: "peanut-orange", label: "Peanut Orange", cssVar: "--color-datavis-data-peanut-orange" },
  { id: "smalt-green-20", label: "Smalt Green 20", cssVar: "--color-datavis-data-smalt-green-20" },
] as const;

export type CategoricalPaletteId = (typeof CATEGORICAL_PALETTE)[number]["id"];

/** Resolve a categorical swatch for charts (SVG fill, inline styles). */
export function getCategoricalPaletteColor(index: number): string {
  const length = CATEGORICAL_PALETTE.length;
  const normalized = ((index % length) + length) % length;
  return `var(${CATEGORICAL_PALETTE[normalized].cssVar})`;
}

/** Assign palette colors to chart segments in display order. */
export function withCategoricalColors<T extends { label: string; value: number }>(
  segments: readonly T[],
): (T & { color: string })[] {
  return segments.map((segment, index) => ({
    ...segment,
    color: getCategoricalPaletteColor(index),
  }));
}

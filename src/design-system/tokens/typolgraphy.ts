/**
 * Typography tokens extracted from Figma → Color Guidelines page.
 * NOTE: filename keeps the existing spelling. The correctly-spelled
 * `typography.ts` re-exports the same values for convenience.
 */

export const fontFamily = {
  base: `"Lato", system-ui, -apple-system, sans-serif`,
} as const;

export const fontWeight = {
  regular: 400,
  semibold: 600,
  bold: 700,
} as const;

export const typography = {
  sectionTitle: {
    size: "20px",
    weight: fontWeight.bold,
    lineHeight: "24px",
    letterSpacing: "0.6px",
  },
  body: {
    size: "14px",
    weight: fontWeight.regular,
    lineHeight: "18px",
    letterSpacing: "0",
  },
  bodySemibold: {
    size: "14px",
    weight: fontWeight.semibold,
    lineHeight: "18px",
    letterSpacing: "0",
  },
  /** Figma “Base/Semibold”: Lato 14 semibold (same metrics as `bodySemibold`). */
  baseSemibold: {
    size: "14px",
    weight: fontWeight.semibold,
    lineHeight: "18px",
    letterSpacing: "0",
  },
  labelSmall: {
    size: "12px",
    weight: fontWeight.semibold,
    lineHeight: "16px",
    letterSpacing: "0.4px",
  },
  tableHead: {
    size: "12px",
    weight: fontWeight.bold,
    lineHeight: "14px",
    letterSpacing: "0.4px",
  },
} as const;

export type Typography = typeof typography;

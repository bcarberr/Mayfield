/**
 * Color tokens — TS mirror of `src/styles/tokens.css`.
 * Source of truth for runtime themes is the CSS; these constants are useful
 * for non-CSS contexts (canvas/SVG fill, JS-driven inline styles, charts).
 */

export const darkPalette = {
  surface: {
    pageBg: "#121212",
    containerBg: "#1e1e1e",
    containerBorders: "#424242",
    rulesLines: "#737373",
    tableRowHeader: "#292929",
    modalBg: "#2e2e2e",
    tooltipBg: "#424242",
    scrimOverlay: "#121212",
  },
  text: {
    primary: "#f5f5f5",
    secondary: "#e0e0e0",
    tertiary: "#9e9e9e",
    button: "#121212",
    tooltip: "#f5f5f5",
    disabled: "#737373",
    negative: "#ff604a",
    caution: "#fac354",
    positive: "#35a151",
  },
  interactive: {
    active: "#1ec1dd",
    primaryHover: "#39daf5",
    secondaryHover: "#0d404b",
    secondaryPressed: "#2a6b79",
    destructive: "#ff604a",
    destructiveHover: "#ff847b",
    destructivePressed: "#ff9995",
  },
  feedback: {
    negative: "#ff604a",
    caution: "#fac354",
    positive: "#17ae81",
    info: "#817cf6",
    neutral: "#9e9e9e",
    bg: {
      negative: "#592923",
      caution: "#60502e",
      positive: "#1b5845",
      info: "#464474",
      neutral: "#515151",
    },
  },
  datavis: {
    cardBg: "#1e1e1e",
    gridlines: "#424242",
    titlesValues: "#f5f5f5",
    axis: "#9e9e9e",
    dataPeanutOrange: "#f0a060",
  },
} as const;

export const lightPalette = {
  surface: {
    pageBg: "#fafafa",
    containerBg: "#ffffff",
    containerBorders: "#eaeaea",
    rulesLines: "#c9c9c9",
    tableRowHeader: "#f5f5f5",
    modalBg: "#f6f6f6",
    tooltipBg: "#424242",
    scrimOverlay: "#121212",
  },
  text: {
    primary: "#212121",
    secondary: "#505050",
    tertiary: "#737373",
    button: "#fafafa",
    tooltip: "#f5f5f5",
    disabled: "#9e9e9e",
    negative: "#da0711",
    caution: "#ab8a17",
    positive: "#2f7b43",
  },
  interactive: {
    active: "#13afca",
    primaryHover: "#118a9e",
    primaryPressed: "#146c7b",
    secondaryHover: "#e6fbff",
    secondaryPressed: "#b8eeff",
    selected: "#f3fdff",
    destructive: "#da0711",
    destructiveHover: "#8e0217",
    destructivePressed: "#670015",
  },
  feedback: {
    negative: "#da0711",
    caution: "#ab8a17",
    positive: "#35a151",
    info: "#5a068e",
    neutral: "#737373",
    bg: {
      negative: "#f8cdcf",
      caution: "#f4efc1",
      positive: "#d7ecdc",
      info: "#decde8",
      neutral: "#e3e3e3",
    },
  },
  datavis: {
    cardBg: "#ffffff",
    gridlines: "#e0e0e0",
    titlesValues: "#212121",
    axis: "#737373",
    dataPeanutOrange: "#b85c2e",
  },
} as const;

export type Palette = typeof darkPalette;

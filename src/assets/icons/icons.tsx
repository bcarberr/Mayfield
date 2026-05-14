import type { ReactElement, ReactNode, SVGProps } from "react";

/**
 * Inline SVG glyphs from the Figma frame “Misc Technology” (node 1172:3420),
 * Query DS Library — Foundations / Basic Components. Paths are taken from the
 * Figma Dev Mode MCP SVG exports; each symbol is centered in a 24×24 slot with
 * `currentColor` so `className="text-…"` from the parent applies.
 */

function Fit24({
  vw,
  vh,
  children,
}: {
  vw: number;
  vh: number;
  children: ReactNode;
}) {
  const s = Math.min(24 / vw, 24 / vh);
  const x = (24 - vw * s) / 2;
  const y = (24 - vh * s) / 2;
  return <g transform={`translate(${x} ${y}) scale(${s})`}>{children}</g>;
}

export const MISC_TECHNOLOGY_ICON_NAMES = [
  "category",
  "device-hub",
  "dns",
  "flag",
  "map",
  "play-arrow",
  "play-arrow-outline",
  "playlist-add",
  "repeat",
  "schema",
  "swap-horiz",
  "email-open",
] as const;

export type MiscTechnologyIconName = (typeof MISC_TECHNOLOGY_ICON_NAMES)[number];

export function IconGlyphCategory(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden {...props}>
      <Fit24 vw={19} vh={20}>
        <path
          d="M9 0L3.5 9H14.5L9 0ZM9 3.84L10.93 7H7.06L9 3.84ZM14.5 11C12.01 11 10 13.01 10 15.5C10 17.99 12.01 20 14.5 20C16.99 20 19 17.99 19 15.5C19 13.01 16.99 11 14.5 11ZM14.5 18C13.12 18 12 16.88 12 15.5C12 14.12 13.12 13 14.5 13C15.88 13 17 14.12 17 15.5C17 16.88 15.88 18 14.5 18ZM0 19.5H8V11.5H0V19.5ZM2 13.5H6V17.5H2V13.5Z"
          fill="currentColor"
        />
      </Fit24>
    </svg>
  );
}

export function IconGlyphDeviceHub(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden {...props}>
      <Fit24 vw={18} vh={18}>
        <path
          d="M14 13L10 9V5.82C11.16 5.4 12 4.3 12 3C12 1.34 10.66 0 9 0C7.34 0 6 1.34 6 3C6 4.3 6.84 5.4 8 5.82V9L4 13H0V18H5V14.95L9 10.75L13 14.95V18H18V13H14Z"
          fill="currentColor"
        />
      </Fit24>
    </svg>
  );
}

export function IconGlyphDns(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden {...props}>
      <Fit24 vw={18} vh={18}>
        <path
          d="M16 12V16H2V12H16ZM17 10H1C0.45 10 0 10.45 0 11V17C0 17.55 0.45 18 1 18H17C17.55 18 18 17.55 18 17V11C18 10.45 17.55 10 17 10ZM4 15.5C3.18 15.5 2.5 14.83 2.5 14C2.5 13.17 3.18 12.5 4 12.5C4.82 12.5 5.5 13.17 5.5 14C5.5 14.83 4.83 15.5 4 15.5ZM16 2V6H2V2H16ZM17 0H1C0.45 0 0 0.45 0 1V7C0 7.55 0.45 8 1 8H17C17.55 8 18 7.55 18 7V1C18 0.45 17.55 0 17 0ZM4 5.5C3.18 5.5 2.5 4.83 2.5 4C2.5 3.17 3.18 2.5 4 2.5C4.82 2.5 5.5 3.18 5.5 4C5.5 4.82 4.83 5.5 4 5.5Z"
          fill="currentColor"
        />
      </Fit24>
    </svg>
  );
}

export function IconGlyphFlag(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden {...props}>
      <Fit24 vw={15} vh={17}>
        <path
          d="M7.36 2L7.76 4H13V10H9.64L9.24 8H2V2H7.36ZM9 0H0V17H2V10H7.6L8 12H15V2H9.4L9 0Z"
          fill="currentColor"
        />
      </Fit24>
    </svg>
  );
}

export function IconGlyphMap(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden {...props}>
      <Fit24 vw={18} vh={18}>
        <path
          d="M17.5 0L17.34 0.03L12 2.1L6 0L0.36 1.9C0.15 1.97 0 2.15 0 2.38V17.5C0 17.78 0.22 18 0.5 18L0.66 17.97L6 15.9L12 18L17.64 16.1C17.85 16.03 18 15.85 18 15.62V0.5C18 0.22 17.78 0 17.5 0ZM7 2.47L11 3.87V15.53L7 14.13V2.47ZM2 3.46L5 2.45V14.15L2 15.31V3.46ZM16 14.54L13 15.55V3.86L16 2.7V14.54Z"
          fill="currentColor"
        />
      </Fit24>
    </svg>
  );
}

export function IconGlyphPlayArrow(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden {...props}>
      <Fit24 vw={11} vh={14}>
        <path d="M0 0V14L11 7L0 0Z" fill="currentColor" />
      </Fit24>
    </svg>
  );
}

export function IconGlyphPlayArrowOutline(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden {...props}>
      <Fit24 vw={11} vh={14}>
        <path d="M2 3.64L7.27 7L2 10.36V3.64ZM0 0V14L11 7L0 0Z" fill="currentColor" />
      </Fit24>
    </svg>
  );
}

export function IconGlyphPlaylistAdd(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden {...props}>
      <Fit24 vw={19} vh={14}>
        <path
          d="M11 4H0V6H11V4ZM11 0H0V2H11V0ZM15 8V4H13V8H9V10H13V14H15V10H19V8H15ZM0 10H7V8H0V10Z"
          fill="currentColor"
        />
      </Fit24>
    </svg>
  );
}

export function IconGlyphRepeat(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden {...props}>
      <Fit24 vw={18} vh={20}>
        <path
          d="M4 5H14V8L18 4L14 0V3H2V9H4V5ZM14 15H4V12L0 16L4 20V17H16V11H14V15Z"
          fill="currentColor"
        />
      </Fit24>
    </svg>
  );
}

/** Schema symbol is built from filled rectangles in Figma (no single vector export). */
export function IconGlyphSchema(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden {...props}>
      <g fill="currentColor">
        <rect x="4" y="3" width="6" height="6" />
        <rect x="14" y="3" width="6" height="6" />
        <rect x="14" y="14" width="6" height="6" />
        <rect x="9" y="5" width="9" height="2" />
        <rect x="7" y="16" width="11" height="2" />
        <rect x="6" y="9" width="2" height="9" />
      </g>
    </svg>
  );
}

export function IconGlyphSwapHoriz(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden {...props}>
      <Fit24 vw={18} vh={14}>
        <path
          d="M3.99 6L0 10L3.99 14V11H11V9H3.99V6ZM18 4L14.01 0V3H7V5H14.01V8L18 4Z"
          fill="currentColor"
        />
      </Fit24>
    </svg>
  );
}

export function IconGlyphEmailOpen(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden {...props}>
      <Fit24 vw={20} vh={19.0078}>
        <path
          d="M10 0L0.992188 5.25586C0.378863 5.61346 0 6.27249 0 6.98242V17.0078C0 18.1009 0.906937 19.0078 2 19.0078H18C19.0931 19.0078 20 18.1009 20 17.0078V6.98242C20 6.27249 19.6211 5.61346 19.0078 5.25586L10 0ZM10 2.31641L18 6.98242V7.03125L10 12.0078L2 7.03125V6.98242L10 2.31641Z"
          fill="currentColor"
        />
      </Fit24>
    </svg>
  );
}

export const MISC_TECHNOLOGY_ICON_COMPONENTS: Record<
  MiscTechnologyIconName,
  (props: SVGProps<SVGSVGElement>) => ReactElement
> = {
  category: IconGlyphCategory,
  "device-hub": IconGlyphDeviceHub,
  dns: IconGlyphDns,
  flag: IconGlyphFlag,
  map: IconGlyphMap,
  "play-arrow": IconGlyphPlayArrow,
  "play-arrow-outline": IconGlyphPlayArrowOutline,
  "playlist-add": IconGlyphPlaylistAdd,
  repeat: IconGlyphRepeat,
  schema: IconGlyphSchema,
  "swap-horiz": IconGlyphSwapHoriz,
  "email-open": IconGlyphEmailOpen,
};

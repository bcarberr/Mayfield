import severityCritical from "./severity-critical.svg?raw";
import severityFatal from "./severity-fatal.svg?raw";
import severityHigh from "./severity-high.svg?raw";
import severityInfo from "./severity-info.svg?raw";
import severityLow from "./severity-low.svg?raw";
import severityMedium from "./severity-medium.svg?raw";
import severityOther from "./severity-other.svg?raw";
import severityUnknown from "./severity-unknown.svg?raw";

/**
 * Severity shape icons from Figma frame “Severity Shapes” (node 2784:28997), v1 Query DS Library.
 * MCP exports for singles; `severity-fatal` composites six sub-assets; `severity-high` applies 45° rotation to match Figma.
 */
export const SEVERITY_SHAPE_ICON_NAMES = [
  "severity-critical",
  "severity-fatal",
  "severity-high",
  "severity-info",
  "severity-low",
  "severity-medium",
  "severity-other",
  "severity-unknown",
] as const;

export type SeverityShapeIconName = (typeof SEVERITY_SHAPE_ICON_NAMES)[number];

export const SEVERITY_SHAPE_RAW_BY_NAME: Record<SeverityShapeIconName, string> = {
  "severity-critical": severityCritical,
  "severity-fatal": severityFatal,
  "severity-high": severityHigh,
  "severity-info": severityInfo,
  "severity-low": severityLow,
  "severity-medium": severityMedium,
  "severity-other": severityOther,
  "severity-unknown": severityUnknown,
};

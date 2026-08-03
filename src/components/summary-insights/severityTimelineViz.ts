export type SeverityTimelineViz = "stacked-bar" | "area";

export const SEVERITY_TIMELINE_VIZ_OPTIONS = [
  { id: "stacked-bar", label: "Stacked bar" },
  { id: "area", label: "Stacked area" },
] as const;

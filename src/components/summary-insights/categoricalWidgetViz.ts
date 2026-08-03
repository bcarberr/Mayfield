export type CategoricalWidgetViz = "bar" | "donut";

export const CATEGORICAL_WIDGET_VIZ_OPTIONS = [
  { id: "bar", label: "Horizontal bar" },
  { id: "donut", label: "Donut" },
] as const;

import type { DetectionSeverity } from "./detectionQueue";

export type DetectionRow = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: DetectionSeverity;
  lastRun: string;
  recurrence: string;
  findings: number | "error" | "none";
  /** Pre-configured detection from the Query library — read-only except copy. */
  source?: "library";
  connectorsActive?: number;
  connectorsTotal?: number;
};

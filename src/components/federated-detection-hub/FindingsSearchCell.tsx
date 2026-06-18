import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../../design-system";
import { ROUTES } from "../../app/routes";
import { useCopilot } from "../../context/CopilotContext";
import { getDetectionFsqlQuery } from "./detectionFsqlQueries";

export type DetectionFindings = number | "error" | "none";

type FindingsSearchCellProps = {
  findings: DetectionFindings;
  detectionId: string;
  detectionName: string;
  enabled?: boolean;
};

export function FindingsSearchCell({
  findings,
  detectionId,
  detectionName,
  enabled = true,
}: FindingsSearchCellProps) {
  const navigate = useNavigate();
  const { setPendingFsqlSearch } = useCopilot();

  const openFsqlSearch = useCallback(() => {
    const query = getDetectionFsqlQuery(detectionId, detectionName);
    setPendingFsqlSearch({ query, autoExecute: true, detectionName });
    navigate(ROUTES.search);
  }, [detectionId, detectionName, navigate, setPendingFsqlSearch]);

  if (findings === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-feedback-negative">
        <Icon name="error-outline" size={16} aria-hidden />
        Error
      </span>
    );
  }

  if (findings === "none") {
    return <span className="text-sm text-text-secondary">—</span>;
  }

  return (
    <button
      type="button"
      onClick={openFsqlSearch}
      className={[
        "inline-flex items-center gap-1.5 text-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active",
        enabled ? "font-semibold text-interactive-active" : "text-inherit",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={`Search ${findings} findings for ${detectionName} in FSQL`}
    >
      <Icon name="search" size={14} aria-hidden />
      <span className="tabular-nums">{findings}</span>
    </button>
  );
}

import { useCallback, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Icon } from "../../design-system";
import { ROUTES } from "../../app/routes";
import { useCopilot } from "../../context/CopilotContext";
import { getDetectionFsqlQuery } from "./detectionFsqlQueries";

export type DetectionFindings = number | "error" | "none";

type FindingsSearchCellProps = {
  findings: DetectionFindings;
  detectionId: string;
  detectionName: string;
};

const LINK_CLASS =
  "inline-flex items-center gap-1.5 text-sm font-semibold text-interactive-active hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active";

function FindingsSearchLink({
  detectionId,
  detectionName,
  ariaLabel,
  children,
}: {
  detectionId: string;
  detectionName: string;
  ariaLabel: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const { setPendingFsqlSearch } = useCopilot();

  const openFsqlSearch = useCallback(() => {
    const query = getDetectionFsqlQuery(detectionId, detectionName);
    setPendingFsqlSearch({ query, autoExecute: false, detectionName });
    navigate(ROUTES.search);
  }, [detectionId, detectionName, navigate, setPendingFsqlSearch]);

  return (
    <button type="button" onClick={openFsqlSearch} className={LINK_CLASS} aria-label={ariaLabel}>
      {children}
    </button>
  );
}

export function FindingsSearchCell({ findings, detectionId, detectionName }: FindingsSearchCellProps) {
  const ariaBase = `Open FSQL search for ${detectionName}`;

  if (findings === "error") {
    return (
      <FindingsSearchLink detectionId={detectionId} detectionName={detectionName} ariaLabel={ariaBase}>
        <Icon name="error-outline" size={16} className="text-feedback-negative" aria-hidden />
        <span className="text-feedback-negative">Error</span>
      </FindingsSearchLink>
    );
  }

  if (findings === "none") {
    return (
      <FindingsSearchLink detectionId={detectionId} detectionName={detectionName} ariaLabel={ariaBase}>
        <Search size={14} strokeWidth={1.5} aria-hidden />
        <span>—</span>
      </FindingsSearchLink>
    );
  }

  return (
    <FindingsSearchLink
      detectionId={detectionId}
      detectionName={detectionName}
      ariaLabel={`${ariaBase} (${findings} findings)`}
    >
      <Search size={14} strokeWidth={1.5} aria-hidden />
      <span className="tabular-nums">{findings}</span>
    </FindingsSearchLink>
  );
}

import { createContext, useContext, useState, type ReactNode } from "react";

export type PendingFsqlSearchRequest = {
  query: string;
  autoExecute?: boolean;
  /** Set when opening search from Federated Detection Hub findings. */
  detectionName?: string;
};

export const DEFAULT_COPILOT_PANEL_WIDTH = 360;

type CopilotContextValue = {
  open: boolean;
  setOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  /** Resizable copilot rail width — used to inset page-level slide-overs when open. */
  panelWidth: number;
  setPanelWidth: (width: number) => void;
  /** True while the user is actively dragging the copilot resize handle. */
  isResizingCopilot: boolean;
  setIsResizingCopilot: (resizing: boolean) => void;
  /** Non-null when navigating to search with a prefilled FSQL query. SearchLandingPage consumes and clears it. */
  pendingFsqlSearch: PendingFsqlSearchRequest | null;
  setPendingFsqlSearch: (request: PendingFsqlSearchRequest | null) => void;
};

const CopilotContext = createContext<CopilotContextValue | null>(null);

export function CopilotProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_COPILOT_PANEL_WIDTH);
  const [isResizingCopilot, setIsResizingCopilot] = useState(false);
  const [pendingFsqlSearch, setPendingFsqlSearch] = useState<PendingFsqlSearchRequest | null>(null);
  return (
    <CopilotContext.Provider
      value={{ open, setOpen, panelWidth, setPanelWidth, isResizingCopilot, setIsResizingCopilot, pendingFsqlSearch, setPendingFsqlSearch }}
    >
      {children}
    </CopilotContext.Provider>
  );
}

/** Right inset (px) for full-viewport overlays when the copilot rail is open. */
export function useCopilotLayoutInset(): number {
  const { open, panelWidth } = useCopilot();
  return open ? panelWidth : 0;
}

export function useCopilot(): CopilotContextValue {
  const ctx = useContext(CopilotContext);
  if (!ctx) throw new Error("useCopilot must be used within CopilotProvider");
  return ctx;
}

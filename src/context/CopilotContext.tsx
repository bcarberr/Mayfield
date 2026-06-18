import { createContext, useContext, useState, type ReactNode } from "react";

export type PendingFsqlSearchRequest = {
  query: string;
  autoExecute?: boolean;
  /** Set when opening search from Federated Detection Hub findings. */
  detectionName?: string;
};

type CopilotContextValue = {
  open: boolean;
  setOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  /** Non-null when navigating to search with a prefilled FSQL query. SearchLandingPage consumes and clears it. */
  pendingFsqlSearch: PendingFsqlSearchRequest | null;
  setPendingFsqlSearch: (request: PendingFsqlSearchRequest | null) => void;
};

const CopilotContext = createContext<CopilotContextValue | null>(null);

export function CopilotProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pendingFsqlSearch, setPendingFsqlSearch] = useState<PendingFsqlSearchRequest | null>(null);
  return (
    <CopilotContext.Provider value={{ open, setOpen, pendingFsqlSearch, setPendingFsqlSearch }}>
      {children}
    </CopilotContext.Provider>
  );
}

export function useCopilot(): CopilotContextValue {
  const ctx = useContext(CopilotContext);
  if (!ctx) throw new Error("useCopilot must be used within CopilotProvider");
  return ctx;
}

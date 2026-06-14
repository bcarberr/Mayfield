import { createContext, useContext, useState, type ReactNode } from "react";

type CopilotContextValue = {
  open: boolean;
  setOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  /** Non-null when the copilot has sent an FSQL query to the search page. SearchLandingPage consumes and clears it. */
  pendingFsqlQuery: string | null;
  setPendingFsqlQuery: (query: string | null) => void;
};

const CopilotContext = createContext<CopilotContextValue | null>(null);

export function CopilotProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pendingFsqlQuery, setPendingFsqlQuery] = useState<string | null>(null);
  return (
    <CopilotContext.Provider value={{ open, setOpen, pendingFsqlQuery, setPendingFsqlQuery }}>
      {children}
    </CopilotContext.Provider>
  );
}

export function useCopilot(): CopilotContextValue {
  const ctx = useContext(CopilotContext);
  if (!ctx) throw new Error("useCopilot must be used within CopilotProvider");
  return ctx;
}

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import connectionAbstractUrl from "../../assets/connection-abstract.svg";

const LOADING_MESSAGES = [
  "Hang tight — almost there…",
  "Sweeping every connector…",
  "Following the telemetry crumbs…",
  "Crunching federated results…",
  "Still vibing with your query…",
] as const;

export function FsqlSearchLoadingPanel() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length);
    }, 1800);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center px-5 py-10 sm:py-14"
      role="status"
      aria-live="polite"
      aria-label="FSQL search in progress"
    >
      <div className="relative mb-8 size-44 sm:size-52">
        <img
          src={connectionAbstractUrl}
          alt=""
          className="h-full w-full object-contain opacity-70 motion-safe:animate-[fsql-search-float_3s_ease-in-out_infinite]"
          draggable={false}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-surface-container/90 shadow-[0_0_24px_rgba(0,196,179,0.35)] ring-1 ring-interactive-active/40 motion-safe:animate-[fsql-search-pulse_1.6s_ease-in-out_infinite]">
            <Search size={28} strokeWidth={1.5} className="text-interactive-active" aria-hidden />
          </div>
        </div>
      </div>

      <div className="flex max-w-md items-center gap-3">
        <span
          className="inline-block size-5 shrink-0 animate-spin rounded-full border-2 border-interactive-active border-t-transparent"
          aria-hidden
        />
        <p className="text-base font-semibold tracking-[0.2px] text-text-primary">
          {LOADING_MESSAGES[messageIndex]}
        </p>
      </div>
      <p className="mt-2 text-sm text-text-tertiary">Federated search in progress</p>
    </div>
  );
}

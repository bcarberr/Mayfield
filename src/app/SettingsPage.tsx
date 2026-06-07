import { useEffect } from "react";
import { SearchTopHeader } from "../components/SearchTopHeader";
import { V4NavThinner } from "../components/V4NavThinner";
import { NAV_RAIL_TARGETS } from "./navRailTargets";

/**
 * Settings workspace — nav destination from Figma `4462:1204` (Settings).
 */
export function SettingsPage() {
  useEffect(() => {
    const previous = document.title;
    document.title = "Settings";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 bg-surface-page text-text-primary">
      <V4NavThinner variant="federated-search" activeSection="settings" navTargets={NAV_RAIL_TARGETS} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <SearchTopHeader title="Settings" chromeSurface="page" />
        <main className="flex flex-1 flex-col items-center justify-center gap-1 px-6 py-12">
          <p className="text-base-semibold text-text-primary">Settings</p>
          <p className="text-sm text-text-tertiary">Content coming soon.</p>
        </main>
      </div>
    </div>
  );
}

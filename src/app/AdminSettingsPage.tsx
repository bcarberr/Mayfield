import { useEffect } from "react";
import { SearchTopHeader } from "../components/SearchTopHeader";
import { V4NavThinner } from "../components/V4NavThinner";
import { AdminSettingsDashboard } from "../components/admin-settings/AdminSettingsDashboard";
import { NAV_RAIL_TARGETS } from "./navRailTargets";

/** Admin Settings workspace — tenants, teams, and role permissions. */
export function AdminSettingsPage() {
  useEffect(() => {
    const previous = document.title;
    document.title = "Admin Settings";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 bg-surface-page text-text-primary">
      <V4NavThinner variant="federated-search" activeSection="adminSettings" navTargets={NAV_RAIL_TARGETS} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <SearchTopHeader title="Admin Settings" chromeSurface="page" />
        <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
          <AdminSettingsDashboard />
        </main>
      </div>
    </div>
  );
}

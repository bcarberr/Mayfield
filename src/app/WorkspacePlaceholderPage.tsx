import { SearchTopHeader } from "../components/SearchTopHeader";
import { V4NavThinner, type V4NavActiveSection } from "../components/V4NavThinner";
import { NAV_RAIL_TARGETS } from "./navRailTargets";

type WorkspacePlaceholderPageProps = {
  activeSection: V4NavActiveSection;
  title: string;
};

/**
 * Minimal shell for nav destinations that are not built yet.
 */
export function WorkspacePlaceholderPage({ activeSection, title }: WorkspacePlaceholderPageProps) {
  return (
    <div className="flex h-full min-h-0 bg-surface-page text-text-primary">
      <V4NavThinner variant="federated-search" activeSection={activeSection} navTargets={NAV_RAIL_TARGETS} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <SearchTopHeader title={title} chromeSurface="page" />
        <main className="flex flex-1 flex-col items-center justify-center gap-1 px-6 py-12">
          <p className="text-base-semibold text-text-primary">{title}</p>
          <p className="text-sm text-text-tertiary">Content coming soon.</p>
        </main>
      </div>
    </div>
  );
}

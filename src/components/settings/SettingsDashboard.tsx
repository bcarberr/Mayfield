import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { TooltipProvider } from "@/components/shadcn/tooltip";
import { SETTINGS_ROLE_TYPE } from "./settingsData";
import { PreferencesTab } from "./PreferencesTab";
import { ProfileOverviewTab } from "./ProfileOverviewTab";

const SETTINGS_TABS = [
  { id: "profile", label: "Profile Overview" },
  { id: "preferences", label: "Preferences" },
] as const;

type SettingsTab = (typeof SETTINGS_TABS)[number]["id"];

const DASHBOARD_LINE_TAB_TRIGGER_CLASS =
  "h-auto flex-none rounded-none border-0 px-0 pb-3 text-sm font-semibold text-text-tertiary transition-colors hover:text-text-secondary [&::after]:hidden before:absolute before:inset-x-0 before:bottom-0 before:h-[2px] before:bg-transparent before:transition-colors data-active:!bg-transparent data-active:before:bg-interactive-active data-active:text-text-primary data-active:shadow-none";

export function SettingsDashboard() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  return (
    <TooltipProvider>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as SettingsTab)}
        className="flex flex-col"
      >
        <div className="sticky top-0 z-20 flex shrink-0 items-end justify-between gap-4 bg-surface-page px-6 pt-4">
          <TabsList
            variant="line"
            className="h-auto w-auto gap-6 rounded-none bg-transparent p-0"
            aria-label="Settings views"
          >
            {SETTINGS_TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className={DASHBOARD_LINE_TAB_TRIGGER_CLASS}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
            <span>
              Role Type:{" "}
              <span className="font-semibold text-text-primary">{SETTINGS_ROLE_TYPE}</span>
            </span>
            <span className="hidden h-4 w-px bg-border-rule sm:block" aria-hidden />
            <Button type="button" variant="link" className="h-auto gap-1 px-0 font-semibold text-interactive-active">
              Audit Logs
              <ExternalLink size={14} strokeWidth={1.5} aria-hidden />
            </Button>
          </div>
        </div>

        <TabsContent value="profile" className="mt-0 max-w-3xl px-6 pt-2 pb-4 outline-none sm:pt-3 sm:pb-5">
          <ProfileOverviewTab />
        </TabsContent>
        <TabsContent value="preferences" className="mt-0 px-6 pt-2 pb-4 outline-none sm:pt-3 sm:pb-5">
          <PreferencesTab />
        </TabsContent>
      </Tabs>
    </TooltipProvider>
  );
}

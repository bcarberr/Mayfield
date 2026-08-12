import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { TooltipProvider } from "@/components/shadcn/tooltip";
import { RolePermissionsTabContent } from "./RolePermissionsTabContent";
import { TeamsTabContent } from "./TeamsTabContent";
import { TenantsTabContent } from "./TenantsTabContent";

const ADMIN_SETTINGS_TABS = [
  { id: "tenants", label: "Tenants" },
  { id: "teams", label: "Teams" },
  { id: "role-permissions", label: "Role Permissions" },
] as const;

type AdminSettingsTab = (typeof ADMIN_SETTINGS_TABS)[number]["id"];

const ADD_ACTION_LABEL: Record<AdminSettingsTab, string> = {
  tenants: "Add Tenant",
  teams: "Add Team",
  "role-permissions": "Add Role",
};

const DASHBOARD_LINE_TAB_TRIGGER_CLASS =
  "h-auto flex-none rounded-none border-0 px-0 pb-3 text-sm font-semibold text-text-tertiary transition-colors hover:text-text-secondary [&::after]:hidden before:absolute before:inset-x-0 before:bottom-0 before:h-[2px] before:bg-transparent before:transition-colors data-active:!bg-transparent data-active:before:bg-interactive-active data-active:text-text-primary data-active:shadow-none";

export function AdminSettingsDashboard() {
  const [activeTab, setActiveTab] = useState<AdminSettingsTab>("tenants");

  return (
    <TooltipProvider>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as AdminSettingsTab)}
        className="flex flex-col"
      >
        <div className="sticky top-0 z-20 flex shrink-0 items-end justify-between gap-4 bg-surface-page px-6 pt-4">
          <TabsList
            variant="line"
            className="h-auto w-auto gap-6 rounded-none bg-transparent p-0"
            aria-label="Admin settings views"
          >
            {ADMIN_SETTINGS_TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className={DASHBOARD_LINE_TAB_TRIGGER_CLASS}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <Button type="button" variant="secondary-outline" className="mb-3 h-8 shrink-0">
            <Plus size={12} strokeWidth={1.5} className="size-3 shrink-0 text-current" aria-hidden />
            {ADD_ACTION_LABEL[activeTab]}
          </Button>
        </div>

        <TabsContent value="tenants" className="mt-0 px-6 pt-2 pb-4 outline-none sm:pt-3 sm:pb-5">
          <TenantsTabContent />
        </TabsContent>
        <TabsContent value="teams" className="mt-0 px-6 pt-2 pb-4 outline-none sm:pt-3 sm:pb-5">
          <TeamsTabContent />
        </TabsContent>
        <TabsContent value="role-permissions" className="mt-0 px-6 pt-2 pb-4 outline-none sm:pt-3 sm:pb-5">
          <RolePermissionsTabContent />
        </TabsContent>
      </Tabs>
    </TooltipProvider>
  );
}

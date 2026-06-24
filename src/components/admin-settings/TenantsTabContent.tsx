import { useState } from "react";
import { Collapsible, CollapsibleContent } from "@/components/shadcn/collapsible";
import { ADMIN_TENANTS } from "./adminSettingsData";
import {
  ADMIN_CARD_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  AdminExpandTrigger,
  AdminIconActions,
  MemberAvatarStack,
  TeamIcon,
  TenantIcon,
} from "./AdminSettingsShared";

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

function TenantRow({ tenantId, name }: { tenantId: string; name: string }) {
  const [open, setOpen] = useState(true);
  const tenant = ADMIN_TENANTS.find((item) => item.id === tenantId)!;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={ADMIN_CARD_CLASS}>
      <div className="flex items-center gap-3 border-b border-datavis-gridlines px-4 py-3">
        <AdminExpandTrigger expanded={open} label={name} />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <TenantIcon />
          <span className="truncate text-sm font-semibold text-text-primary">{name}</span>
        </div>
        <AdminIconActions actions={["edit", "delete", "add"]} addLabel="Add team" />
      </div>

      <CollapsibleContent>
        <div className="border-b border-datavis-gridlines bg-surface-modal px-4 py-2">
          <span className="text-xs font-bold uppercase tracking-wide text-text-primary">Teams</span>
        </div>
        <ul>
          {tenant.teams.map((team) => (
            <li
              key={team.id}
              className={cx(
                "flex items-center gap-3 px-4 py-3",
                ADMIN_TABLE_ROW_CLASS,
                "border-b border-datavis-gridlines last:border-b-0",
              )}
            >
              <TeamIcon className="ml-5" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-secondary">{team.name}</span>
              <MemberAvatarStack members={team.members} />
              <AdminIconActions actions={["edit", "delete"]} />
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function TenantsTabContent() {
  return (
    <div className="flex flex-col gap-3">
      {ADMIN_TENANTS.map((tenant) => (
        <TenantRow key={tenant.id} tenantId={tenant.id} name={tenant.name} />
      ))}
    </div>
  );
}

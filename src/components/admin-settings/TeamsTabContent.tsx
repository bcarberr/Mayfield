import { useMemo, useState } from "react";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Collapsible, CollapsibleContent } from "@/components/shadcn/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { ADMIN_TENANTS, ROLE_TYPE_OPTIONS, type AdminMember, type AdminTeam } from "./adminSettingsData";
import {
  ADMIN_CARD_CLASS,
  ADMIN_TABLE_CELL_CLASS,
  ADMIN_TABLE_CELL_INNER_CLASS,
  ADMIN_TABLE_CLASS,
  ADMIN_TABLE_HEAD_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  AdminExpandTrigger,
  AdminIconActions,
  MemberAvatarStack,
  TeamIcon,
} from "./AdminSettingsShared";

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

function TeamMembersTable({
  team,
  memberRoles,
  onRoleChange,
}: {
  team: AdminTeam;
  memberRoles: Record<string, string>;
  onRoleChange: (memberId: string, role: string) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const allSelected = team.members.length > 0 && selected.size === team.members.length;
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(team.members.map((member) => member.id)) : new Set());
  };

  const toggleRow = (memberId: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(memberId);
      else next.delete(memberId);
      return next;
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className={ADMIN_TABLE_CLASS}>
        <thead className={ADMIN_TABLE_HEAD_CLASS}>
          <tr>
            <th scope="col" className={cx(ADMIN_TABLE_CELL_CLASS, "w-10")}>
              <div className={ADMIN_TABLE_CELL_INNER_CLASS}>
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={(value) => toggleAll(value === true)}
                  aria-label="Select all members"
                />
              </div>
            </th>
            <th scope="col" className={ADMIN_TABLE_CELL_CLASS}>
              Members
            </th>
            <th scope="col" className={ADMIN_TABLE_CELL_CLASS}>
              Role Type
            </th>
            <th scope="col" className={cx(ADMIN_TABLE_CELL_CLASS, "w-20")}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {team.members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              role={memberRoles[member.id] ?? member.role}
              selected={selected.has(member.id)}
              onSelectedChange={(checked) => toggleRow(member.id, checked)}
              onRoleChange={(role) => onRoleChange(member.id, role)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MemberRow({
  member,
  role,
  selected,
  onSelectedChange,
  onRoleChange,
}: {
  member: AdminMember;
  role: string;
  selected: boolean;
  onSelectedChange: (checked: boolean) => void;
  onRoleChange: (role: string) => void;
}) {
  return (
    <tr className={ADMIN_TABLE_ROW_CLASS}>
      <td className={cx(ADMIN_TABLE_CELL_CLASS, "w-10")}>
        <div className={ADMIN_TABLE_CELL_INNER_CLASS}>
          <Checkbox
            checked={selected}
            onCheckedChange={(value) => onSelectedChange(value === true)}
            aria-label={`Select ${member.name}`}
          />
        </div>
      </td>
      <td className={ADMIN_TABLE_CELL_CLASS}>
        <div className={ADMIN_TABLE_CELL_INNER_CLASS}>
          <span className="text-sm font-semibold text-text-secondary">{member.name}</span>
        </div>
      </td>
      <td className={ADMIN_TABLE_CELL_CLASS}>
        <div className={ADMIN_TABLE_CELL_INNER_CLASS}>
          <Select value={role} onValueChange={onRoleChange}>
            <SelectTrigger
              size="sm"
              className="h-8 min-w-[11rem] border-border-container bg-surface-modal text-sm font-semibold text-text-secondary"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-border-container bg-surface-modal">
              {ROLE_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option} className="text-sm">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </td>
      <td className={cx(ADMIN_TABLE_CELL_CLASS, "w-20")}>
        <div className={ADMIN_TABLE_CELL_INNER_CLASS}>
          <AdminIconActions actions={["edit", "delete"]} />
        </div>
      </td>
    </tr>
  );
}

function TeamPanel({
  team,
  memberRoles,
  onRoleChange,
}: {
  team: AdminTeam;
  memberRoles: Record<string, string>;
  onRoleChange: (memberId: string, role: string) => void;
}) {
  const [open, setOpen] = useState(team.id === "team-kopolowsk");

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={ADMIN_CARD_CLASS}>
      <div className="flex items-center gap-3 px-4 py-3">
        <AdminExpandTrigger expanded={open} label={team.name} />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <TeamIcon />
          <span className="truncate text-sm font-semibold text-text-primary">{team.name}</span>
        </div>
        <MemberAvatarStack members={team.members} />
        <AdminIconActions actions={["edit", "delete", "add"]} addLabel="Add member" />
      </div>
      <CollapsibleContent>
        <TeamMembersTable team={team} memberRoles={memberRoles} onRoleChange={onRoleChange} />
      </CollapsibleContent>
    </Collapsible>
  );
}

export function TeamsTabContent() {
  const teams = useMemo(() => ADMIN_TENANTS.flatMap((tenant) => tenant.teams), []);

  const initialRoles = useMemo(() => {
    const roles: Record<string, string> = {};
    for (const team of teams) {
      for (const member of team.members) {
        roles[member.id] = member.role;
      }
    }
    return roles;
  }, [teams]);

  const [memberRoles, setMemberRoles] = useState(initialRoles);

  const handleRoleChange = (memberId: string, role: string) => {
    setMemberRoles((prev) => ({ ...prev, [memberId]: role }));
  };

  return (
    <div className="flex flex-col gap-3">
      {teams.map((team) => (
        <TeamPanel key={team.id} team={team} memberRoles={memberRoles} onRoleChange={handleRoleChange} />
      ))}
    </div>
  );
}

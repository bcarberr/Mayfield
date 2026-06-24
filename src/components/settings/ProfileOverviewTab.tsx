import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import { Collapsible, CollapsibleContent } from "@/components/shadcn/collapsible";
import {
  SLIDE_OVER_FOOTER_BUTTON_CLASS,
  SLIDE_OVER_FOOTER_GHOST_BUTTON_CLASS,
} from "../ui/SlideOver";
import {
  ADMIN_CARD_CLASS,
  ADMIN_TABLE_CELL_CLASS,
  ADMIN_TABLE_CELL_INNER_CLASS,
  ADMIN_TABLE_CLASS,
  ADMIN_TABLE_HEAD_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  AdminExpandTrigger,
  MemberAvatarStack,
  TeamIcon,
} from "../admin-settings/AdminSettingsShared";
import { DEFAULT_PROFILE_VALUES, PROFILE_TEAM, type ProfileFormValues } from "./settingsData";
import { FieldGroup, SettingsFormField } from "./SettingsFormFields";

function ProfileTeamMembersTable({ members }: { members: typeof PROFILE_TEAM.members }) {
  return (
    <div className="overflow-x-auto">
      <table className={ADMIN_TABLE_CLASS}>
        <thead className={ADMIN_TABLE_HEAD_CLASS}>
          <tr>
            <th scope="col" className={ADMIN_TABLE_CELL_CLASS}>
              Members
            </th>
            <th scope="col" className={ADMIN_TABLE_CELL_CLASS}>
              Role Type
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className={ADMIN_TABLE_ROW_CLASS}>
              <td className={ADMIN_TABLE_CELL_CLASS}>
                <div className={ADMIN_TABLE_CELL_INNER_CLASS}>
                  <span className="text-sm font-semibold text-text-secondary">{member.name}</span>
                </div>
              </td>
              <td className={ADMIN_TABLE_CELL_CLASS}>
                <div className={ADMIN_TABLE_CELL_INNER_CLASS}>
                  <span className="text-sm font-semibold text-text-secondary">{member.role}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProfileTeamPanel() {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={ADMIN_CARD_CLASS}>
      <div className="flex items-center gap-3 px-4 py-3">
        <AdminExpandTrigger expanded={open} label={PROFILE_TEAM.name} />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <TeamIcon />
          <span className="truncate text-sm font-semibold text-text-primary">{PROFILE_TEAM.name}</span>
        </div>
        <MemberAvatarStack members={PROFILE_TEAM.members} />
      </div>
      <CollapsibleContent>
        <ProfileTeamMembersTable members={PROFILE_TEAM.members} />
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ProfileOverviewTab() {
  const [savedValues, setSavedValues] = useState<ProfileFormValues>(DEFAULT_PROFILE_VALUES);
  const [draft, setDraft] = useState<ProfileFormValues>(DEFAULT_PROFILE_VALUES);

  const isDirty =
    draft.name !== savedValues.name ||
    draft.email !== savedValues.email ||
    draft.company !== savedValues.company ||
    draft.title !== savedValues.title ||
    draft.organization !== savedValues.organization;

  const updateField = (field: keyof ProfileFormValues, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => setDraft(savedValues);

  const handleSave = () => setSavedValues(draft);

  return (
    <div className="flex flex-col gap-8">
      <FieldGroup className="gap-5">
        <SettingsFormField label="Name" value={draft.name} onChange={(value) => updateField("name", value)} />
        <SettingsFormField
          label="Email"
          type="email"
          value={draft.email}
          onChange={(value) => updateField("email", value)}
        />
        <SettingsFormField
          label="Company"
          value={draft.company}
          onChange={(value) => updateField("company", value)}
        />
        <SettingsFormField label="Title" value={draft.title} onChange={(value) => updateField("title", value)} />
        <SettingsFormField
          label="Organization"
          value={draft.organization}
          onChange={(value) => updateField("organization", value)}
        />

        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            className={SLIDE_OVER_FOOTER_GHOST_BUTTON_CLASS}
            disabled={!isDirty}
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            className={SLIDE_OVER_FOOTER_BUTTON_CLASS}
            disabled={!isDirty}
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </FieldGroup>

      <ProfileTeamPanel />
    </div>
  );
}

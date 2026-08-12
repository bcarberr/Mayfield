import type { AdminMember } from "../admin-settings/adminSettingsData";

export type ProfileFormValues = {
  name: string;
  email: string;
  company: string;
  title: string;
  organization: string;
};

export const DEFAULT_PROFILE_VALUES: ProfileFormValues = {
  name: "Chanice Kopolowski",
  email: "CKopolowski@brquary.com",
  company: "Bedrock Quarry",
  title: "Dog wrangler, Product Designer",
  organization: "Bedrock Quarry",
};

export const SETTINGS_ROLE_TYPE = "Organization Admin";

export const PROFILE_TEAM = {
  id: "team-kopolowsk",
  name: "Kopolowsk Carrots",
  members: [
    { id: "p1", name: "Chanice Kopolowski", initials: "CK", avatarColor: "#4a9eff", role: "Tenant Admin" },
    { id: "p2", name: "Brian Tiddley", initials: "BT", avatarColor: "#57969e", role: "Default Team Member" },
    { id: "p3", name: "Tim Kurgesmayer", initials: "TK", avatarColor: "#f28830", role: "Default Team Member" },
    { id: "p4", name: "Jeanine Smithers", initials: "JS", avatarColor: "#e8a598", role: "Onboarding Team" },
  ] satisfies AdminMember[],
};

export type ExperimentPreferences = {
  includeRawDataInSearch: boolean;
  streamingIncrementalResults: boolean;
};

export const DEFAULT_EXPERIMENT_PREFERENCES: ExperimentPreferences = {
  includeRawDataInSearch: false,
  streamingIncrementalResults: true,
};

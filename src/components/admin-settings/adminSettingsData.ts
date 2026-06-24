export type AdminMember = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  role: string;
};

export type AdminTeam = {
  id: string;
  name: string;
  members: AdminMember[];
};

export type AdminTenant = {
  id: string;
  name: string;
  teams: AdminTeam[];
};

export const ROLE_TYPE_OPTIONS = [
  "Tenant Admin",
  "Team Admin",
  "Default Team Member",
  "Onboarding Team",
] as const;

export type RoleType = (typeof ROLE_TYPE_OPTIONS)[number];

export type PermissionItem = {
  id: string;
  label: string;
  checked: boolean;
  children?: readonly PermissionItem[];
};

export type PermissionColumn = {
  groups: readonly PermissionItem[];
};

export type RolePermissionSet = {
  id: string;
  title: string;
  columns: readonly PermissionColumn[];
};

export const ADMIN_TENANTS: AdminTenant[] = [
  {
    id: "tenant-quary",
    name: "Quary Electronics",
    teams: [
      {
        id: "team-kopolowsk",
        name: "Kopolowsk Carrots",
        members: [
          { id: "m1", name: "Bonnie Kopolowsk", initials: "CK", avatarColor: "#4a9eff", role: "Tenant Admin" },
          { id: "m2", name: "Brian Tiddley", initials: "BT", avatarColor: "#57969e", role: "Default Team Member" },
          { id: "m3", name: "Tom Kearns", initials: "TK", avatarColor: "#f28830", role: "Team Admin" },
          { id: "m4", name: "Jane Smith", initials: "JS", avatarColor: "#9b6bac", role: "Default Team Member" },
        ],
      },
      {
        id: "team-spacely",
        name: "Spacely Sprockets",
        members: [
          { id: "m5", name: "George Jetson", initials: "GJ", avatarColor: "#57969e", role: "Team Admin" },
          { id: "m6", name: "Jane Smith", initials: "JS", avatarColor: "#9b6bac", role: "Default Team Member" },
          { id: "m7", name: "Tom Kearns", initials: "TK", avatarColor: "#f28830", role: "Default Team Member" },
        ],
      },
      {
        id: "team-tiny-tot",
        name: "Tiny Tot Toys",
        members: [
          { id: "m8", name: "Brian Tiddley", initials: "BT", avatarColor: "#57969e", role: "Team Admin" },
          { id: "m9", name: "Bonnie Kopolowsk", initials: "CK", avatarColor: "#4a9eff", role: "Default Team Member" },
        ],
      },
    ],
  },
];

const tenantAdminSubPermissions = (prefix: string, checked: boolean): PermissionItem[] => [
  { id: `${prefix}-add`, label: "Can add", checked },
  { id: `${prefix}-remove`, label: "Can remove", checked },
  { id: `${prefix}-modify`, label: "Can modify", checked },
];

const connectorSubPermissions = (prefix: string, checked: boolean): PermissionItem[] => [
  { id: `${prefix}-add`, label: "Can add", checked },
  { id: `${prefix}-remove`, label: "Can remove", checked },
  { id: `${prefix}-modify`, label: "Can modify", checked },
];

const teamMemberSubPermissions = (
  prefix: string,
  allChecked: boolean,
  modifyChecked: boolean,
  addGroupChecked: boolean,
): PermissionItem[] => [
  {
    id: `${prefix}-all-perms`,
    label: "Has all permissions to the group: default team members",
    checked: allChecked,
  },
  {
    id: `${prefix}-modify-perms`,
    label: "Can modify the group: default team members permissions",
    checked: modifyChecked,
  },
  {
    id: `${prefix}-add-groups`,
    label: "Can add additional groups for team members with specific permissions",
    checked: addGroupChecked,
  },
];

export const ROLE_PERMISSION_SETS: RolePermissionSet[] = [
  {
    id: "org-admin",
    title: "Organization Admin",
    columns: [
      {
        groups: [
          {
            id: "manage-tenant-admins",
            label: "Can manage additional Tenant Admins",
            checked: true,
            children: tenantAdminSubPermissions("org-tenant-admins", true),
          },
          {
            id: "manage-connectors",
            label: "Can manage Connectors",
            checked: true,
            children: connectorSubPermissions("org-connectors", true),
          },
        ],
      },
      {
        groups: [
          {
            id: "manage-team-admins",
            label: "Can manage Team Admins",
            checked: true,
            children: tenantAdminSubPermissions("org-team-admins", true),
          },
          {
            id: "manage-federated-joins",
            label: "Can manage Federated Joins",
            checked: true,
            children: connectorSubPermissions("org-federated-joins", true),
          },
        ],
      },
      {
        groups: [
          {
            id: "manage-team-members",
            label: "Can manage Team Members",
            checked: true,
            children: teamMemberSubPermissions("org-team-members", true, true, true),
          },
          { id: "audit-logs", label: "Access to Audit Logs", checked: true },
          { id: "experiments", label: "Access to Experiments", checked: true },
        ],
      },
    ],
  },
  {
    id: "team-admin",
    title: "Team Admin",
    columns: [
      {
        groups: [
          {
            id: "manage-additional-team-admins",
            label: "Can Manage Additional Team Admins",
            checked: true,
            children: [
              { id: "team-admin-create", label: "Can Create", checked: true },
              { id: "team-admin-remove", label: "Can Remove", checked: true },
              { id: "team-admin-modify", label: "Can Modify Additional Team Admins", checked: true },
            ],
          },
          {
            id: "manage-federated-joins",
            label: "Can manage Federated Joins",
            checked: true,
            children: connectorSubPermissions("team-admin-federated-joins", true),
          },
        ],
      },
      {
        groups: [
          {
            id: "manage-team-members",
            label: "Can Manage Team Members",
            checked: true,
            children: teamMemberSubPermissions("team-admin-team-members", false, false, true),
          },
          { id: "audit-logs", label: "Access to Audit Logs", checked: true },
          { id: "experiments", label: "Access to Experiments", checked: true },
        ],
      },
      {
        groups: [
          {
            id: "manage-connectors",
            label: "Can manage Connectors",
            checked: true,
            children: connectorSubPermissions("team-admin-connectors", true),
          },
        ],
      },
    ],
  },
  {
    id: "default-team-member",
    title: "Default Team Member",
    columns: [
      {
        groups: [
          {
            id: "manage-additional-team-admins",
            label: "Can Manage Additional Team Admins",
            checked: true,
            children: [
              { id: "default-member-create", label: "Can Create", checked: true },
              { id: "default-member-remove", label: "Can Remove", checked: true },
              { id: "default-member-modify", label: "Can Modify Additional Team Admins", checked: true },
            ],
          },
        ],
      },
      {
        groups: [
          {
            id: "manage-team-members",
            label: "Can Manage Team Members",
            checked: true,
            children: teamMemberSubPermissions("default-member-team-members", true, false, true),
          },
        ],
      },
      { groups: [] },
    ],
  },
];

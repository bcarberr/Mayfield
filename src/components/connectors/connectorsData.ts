import type { ConnectorLargeIconName } from "../../design-system";

export type ConnectorCategoryId =
  | "cloud-infrastructure"
  | "data-lakes"
  | "email"
  | "endpoint"
  | "identity-hr"
  | "it-services"
  | "mobile-device"
  | "siem"
  | "threat-intel";

export type ConnectorCategory = {
  id: ConnectorCategoryId;
  /** Section heading in the card grid */
  title: string;
  /** Label on the filter tag chip */
  filterLabel: string;
};

export type ConnectorInstance = {
  id: string;
  categoryId: ConnectorCategoryId;
  instanceName: string;
  connectorType: string;
  icon: ConnectorLargeIconName;
  enabled: boolean;
};

/** Figma `6582:59192` — 06a Connectors category + instance data. */
export const CONNECTOR_CATEGORIES: readonly ConnectorCategory[] = [
  {
    id: "cloud-infrastructure",
    title: "Cloud Infrastructure and Security",
    filterLabel: "Cloud Infrastructure and Security",
  },
  {
    id: "data-lakes",
    title: "Data Lakes and Data Warehouses",
    filterLabel: "Data Lakes and Warehouses",
  },
  {
    id: "email",
    title: "Email Security and Communications",
    filterLabel: "Email and Communications",
  },
  { id: "endpoint", title: "Endpoint", filterLabel: "Endpoint" },
  { id: "identity-hr", title: "Identity and HR", filterLabel: "Identity and HR" },
  { id: "it-services", title: "IT Services", filterLabel: "IT Service Management" },
  {
    id: "mobile-device",
    title: "Mobile Device Management",
    filterLabel: "Mobile Device Management",
  },
  {
    id: "siem",
    title: "SIEM and Log Management",
    filterLabel: "SEIM and Log Management",
  },
  {
    id: "threat-intel",
    title: "Threat Intelligence and Enrichment",
    filterLabel: "Threat Intelligent and Enrichment",
  },
] as const;

export const CONNECTOR_INSTANCES: ConnectorInstance[] = [
  {
    id: "bonnie-ms-graph",
    categoryId: "cloud-infrastructure",
    instanceName: "Bonnie’s MS Graph",
    connectorType: "Microsoft Graph",
    icon: "connector-large-microsoftgraph",
    enabled: true,
  },
  {
    id: "qsesb-honeypot-waf",
    categoryId: "cloud-infrastructure",
    instanceName: "QSESB Honeypot WAF",
    connectorType: "Amazon Cloudwatch Logs (for AWS WAFv2)",
    icon: "connector-large-amazon-cloudwatch",
    enabled: true,
  },
  {
    id: "bc-okta-logs",
    categoryId: "data-lakes",
    instanceName: "BC Okta Logs",
    connectorType: "Amazon Athena (for Amazon S3)",
    icon: "connector-large-aws-athena",
    enabled: true,
  },
  {
    id: "bcv2-rt53-dns",
    categoryId: "data-lakes",
    instanceName: "BCv2-Rt53-DNS",
    connectorType: "Amazon Security Lake",
    icon: "connector-large-aws-sec-lake",
    enabled: true,
  },
  {
    id: "bc-synthetic-dhcp",
    categoryId: "data-lakes",
    instanceName: "BC Synthetic DHCP Logs",
    connectorType: "Amazon Athena (for Amazon S3)",
    icon: "connector-large-aws-athena",
    enabled: true,
  },
  {
    id: "seclake-vpcflows",
    categoryId: "data-lakes",
    instanceName: "SecLake-VPCFlows",
    connectorType: "Amazon Security Lake",
    icon: "connector-large-aws-sec-lake",
    enabled: true,
  },
  {
    id: "sehub-vuln-view",
    categoryId: "data-lakes",
    instanceName: "SeHub-Vuln-View",
    connectorType: "Amazon Athena (for Amazon S3)",
    icon: "connector-large-aws-athena",
    enabled: true,
  },
  {
    id: "seclake-ct",
    categoryId: "data-lakes",
    instanceName: "SecLake-CT",
    connectorType: "Amazon Security Lake",
    icon: "connector-large-aws-sec-lake",
    enabled: true,
  },
  {
    id: "lancet3-dspm",
    categoryId: "data-lakes",
    instanceName: "Lancet3 DSPM",
    connectorType: "ClickHouse Cloud",
    icon: "connector-large-clickhouse",
    enabled: true,
  },
  {
    id: "tos1a-auth-logs",
    categoryId: "data-lakes",
    instanceName: "TOS1A Auth Logs",
    connectorType: "Snowflake",
    icon: "connector-large-snowflake",
    enabled: true,
  },
  {
    id: "query-test-ms365",
    categoryId: "email",
    instanceName: "Query-Test-MS365",
    connectorType: "Microsoft Defender for Office 365",
    icon: "connector-large-ms-defender-office365",
    enabled: true,
  },
  {
    id: "q4q-gmail-audit",
    categoryId: "email",
    instanceName: "Q4Q Gmail Audit",
    connectorType: "Gmail Messages API",
    icon: "connector-large-google-mail",
    enabled: true,
  },
  {
    id: "atb-mde",
    categoryId: "endpoint",
    instanceName: "ATB-MDE",
    connectorType: "Microsoft Defender for Endpoint",
    icon: "connector-large-ms-defender-endpoint",
    enabled: true,
  },
  {
    id: "s1-nfr",
    categoryId: "endpoint",
    instanceName: "S1 NFR",
    connectorType: "SentinelOne Singularity Platform",
    icon: "connector-large-sentinelone",
    enabled: true,
  },
  {
    id: "crowdstrike",
    categoryId: "endpoint",
    instanceName: "Crowdstrike",
    connectorType: "Crowdstrike Falcon",
    icon: "connector-large-crowdstrike",
    enabled: true,
  },
  {
    id: "q4q-cbc",
    categoryId: "endpoint",
    instanceName: "Q4Q CBC",
    connectorType: "Carbon Black Cloud",
    icon: "connector-large-vm-carbon-black",
    enabled: true,
  },
  {
    id: "bc-active-directory",
    categoryId: "identity-hr",
    instanceName: "BC Active Directory",
    connectorType: "Microsoft Active Directory",
    icon: "connector-large-ms-active-directory",
    enabled: true,
  },
  {
    id: "okta-new",
    categoryId: "identity-hr",
    instanceName: "Okta - New",
    connectorType: "Okta",
    icon: "connector-large-okta",
    enabled: true,
  },
  {
    id: "query-okta",
    categoryId: "identity-hr",
    instanceName: "Query Okta",
    connectorType: "Okta",
    icon: "connector-large-okta",
    enabled: true,
  },
  {
    id: "ms-directory-2",
    categoryId: "identity-hr",
    instanceName: "MS Directory 2",
    connectorType: "Microsoft Active Directory",
    icon: "connector-large-ms-active-directory",
    enabled: true,
  },
  {
    id: "atb-entra",
    categoryId: "identity-hr",
    instanceName: "ATB | Entra",
    connectorType: "Microsoft Entra ID (Azure AD)",
    icon: "connector-large-ms-entra-id",
    enabled: true,
  },
  {
    id: "q4q-directory",
    categoryId: "identity-hr",
    instanceName: "Q4Q Directory",
    connectorType: "Google Workspace - Directory API",
    icon: "connector-large-google-workspace",
    enabled: true,
  },
  {
    id: "q4q-stage",
    categoryId: "identity-hr",
    instanceName: "Q4Q STAGE",
    connectorType: "Auth0",
    icon: "connector-large-auth0",
    enabled: true,
  },
  {
    id: "snow-incidents",
    categoryId: "it-services",
    instanceName: "SNOW - Incidents",
    connectorType: "Servicenow",
    icon: "connector-large-servicenow",
    enabled: true,
  },
  {
    id: "atb-intune",
    categoryId: "mobile-device",
    instanceName: "ATB - Intune",
    connectorType: "Microsoft Intune",
    icon: "connector-large-ms-intune",
    enabled: true,
  },
  {
    id: "q4q-jamf",
    categoryId: "mobile-device",
    instanceName: "Q4Q JAMF Pro",
    connectorType: "JAMF Pro",
    icon: "connector-large-jamf",
    enabled: true,
  },
  {
    id: "bc-test-splunk",
    categoryId: "siem",
    instanceName: "BC test splunk",
    connectorType: "Splunk",
    icon: "connector-large-splunk",
    enabled: true,
  },
  {
    id: "cribl-internally",
    categoryId: "siem",
    instanceName: "Cribl internally",
    connectorType: "Cribl Search",
    icon: "connector-large-cribl-search",
    enabled: true,
  },
  {
    id: "q4q-reports",
    categoryId: "siem",
    instanceName: "Q4Q Reports",
    connectorType: "Amazon Athena (for Amazon S3)",
    icon: "connector-large-aws-athena",
    enabled: true,
  },
  {
    id: "avanti",
    categoryId: "siem",
    instanceName: "Avanti",
    connectorType: "Amazon Security Lake",
    icon: "connector-large-aws-sec-lake",
    enabled: true,
  },
  {
    id: "cribl-xyz",
    categoryId: "siem",
    instanceName: "Cribl - xyz",
    connectorType: "Cribl Stream",
    icon: "connector-large-cribl-stream",
    enabled: true,
  },
  {
    id: "avanti-repo",
    categoryId: "siem",
    instanceName: "Avanti Repo",
    connectorType: "Amazon Security Lake",
    icon: "connector-large-aws-sec-lake",
    enabled: true,
  },
  {
    id: "alienvault",
    categoryId: "threat-intel",
    instanceName: "AlienVault",
    connectorType: "AlienVault",
    icon: "connector-large-alienvault-otx",
    enabled: true,
  },
  {
    id: "query-shodan",
    categoryId: "threat-intel",
    instanceName: "Query Shodan",
    connectorType: "Shodan",
    icon: "connector-large-shodan",
    enabled: true,
  },
  {
    id: "whoisxml-api",
    categoryId: "threat-intel",
    instanceName: "Whoisxml API",
    connectorType: "WhoisXML API",
    icon: "connector-large-whoisxmlapi",
    enabled: true,
  },
  {
    id: "virustotal",
    categoryId: "threat-intel",
    instanceName: "Virustotal",
    connectorType: "Virus Total",
    icon: "connector-large-virus-total",
    enabled: true,
  },
];

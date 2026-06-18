/** Demo connector instance names — each resolves to a distinct connector-large icon. */
export const DEMO_TABLE_CONNECTOR_NAMES = [
  "S1 NFR",
  "Crowdstrike",
  "ATB-MDE",
  "Q4Q CBC",
  "BC Okta Logs",
  "Bonnie’s MS Graph",
  "BC test splunk",
  "TOS1A Auth Logs",
  "Lancet3 DSPM",
  "AlienVault",
] as const;

export function demoTableConnector(index: number): (typeof DEMO_TABLE_CONNECTOR_NAMES)[number] {
  return DEMO_TABLE_CONNECTOR_NAMES[index % DEMO_TABLE_CONNECTOR_NAMES.length];
}

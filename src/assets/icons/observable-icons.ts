import observableAccountId from "./observable-account-id.svg?raw";
import observableAccountName from "./observable-account-name.svg?raw";
import observableAdvisoryId from "./observable-advisory-id.svg?raw";
import observableCommandLine from "./observable-command-line.svg?raw";
import observableCountry from "./observable-country.svg?raw";
import observableCredentialId from "./observable-credential-id.svg?raw";
import observableCve from "./observable-cve.svg?raw";
import observableCwe from "./observable-cwe.svg?raw";
import observableDomain from "./observable-domain.svg?raw";
import observableEmailAddress from "./observable-email-address.svg?raw";
import observableFilename from "./observable-filename.svg?raw";
import observableFileHash from "./observable-file-hash.svg?raw";
import observableGroupId from "./observable-group-id.svg?raw";
import observableGroupName from "./observable-group-name.svg?raw";
import observableHostname from "./observable-hostname.svg?raw";
import observableIpAddress from "./observable-ip-address.svg?raw";
import observableMacAddress from "./observable-mac-address.svg?raw";
import observablePort from "./observable-port.svg?raw";
import observableProcessId from "./observable-process-id.svg?raw";
import observableProcessName from "./observable-process-name.svg?raw";
import observableRegistryValueName from "./observable-registry-value-name.svg?raw";
import observableResourceId from "./observable-resource-id.svg?raw";
import observableResourceName from "./observable-resource-name.svg?raw";
import observableScriptContent from "./observable-script-content.svg?raw";
import observableSerialNumber from "./observable-serial-number.svg?raw";
import observableSubnet from "./observable-subnet.svg?raw";
import observableUrl from "./observable-url.svg?raw";
import observableUserAgent from "./observable-user-agent.svg?raw";
import observableUserId from "./observable-user-id.svg?raw";
import observableUsername from "./observable-username.svg?raw";

/**
 * Icons from Figma frame “Entities (Observables)” (node 1136:3721), v1 Query DS Library.
 * SVGs exported via Figma Dev Mode MCP; `observable-cwe` / `observable-serial-number` are
 * geometry-matched where Figma used only vector rectangles; composites approximate multi-layer symbols.
 */
export const OBSERVABLE_ENTITY_ICON_NAMES = [
  "observable-account-id",
  "observable-account-name",
  "observable-advisory-id",
  "observable-command-line",
  "observable-country",
  "observable-credential-id",
  "observable-cve",
  "observable-cwe",
  "observable-domain",
  "observable-email-address",
  "observable-filename",
  "observable-file-hash",
  "observable-group-id",
  "observable-group-name",
  "observable-hostname",
  "observable-ip-address",
  "observable-mac-address",
  "observable-port",
  "observable-process-id",
  "observable-process-name",
  "observable-registry-value-name",
  "observable-resource-id",
  "observable-resource-name",
  "observable-script-content",
  "observable-serial-number",
  "observable-subnet",
  "observable-url",
  "observable-user-agent",
  "observable-user-id",
  "observable-username",
] as const;

export type ObservableEntityIconName = (typeof OBSERVABLE_ENTITY_ICON_NAMES)[number];

export const OBSERVABLE_ENTITY_RAW_BY_NAME: Record<ObservableEntityIconName, string> = {
  "observable-account-id": observableAccountId,
  "observable-account-name": observableAccountName,
  "observable-advisory-id": observableAdvisoryId,
  "observable-command-line": observableCommandLine,
  "observable-country": observableCountry,
  "observable-credential-id": observableCredentialId,
  "observable-cve": observableCve,
  "observable-cwe": observableCwe,
  "observable-domain": observableDomain,
  "observable-email-address": observableEmailAddress,
  "observable-filename": observableFilename,
  "observable-file-hash": observableFileHash,
  "observable-group-id": observableGroupId,
  "observable-group-name": observableGroupName,
  "observable-hostname": observableHostname,
  "observable-ip-address": observableIpAddress,
  "observable-mac-address": observableMacAddress,
  "observable-port": observablePort,
  "observable-process-id": observableProcessId,
  "observable-process-name": observableProcessName,
  "observable-registry-value-name": observableRegistryValueName,
  "observable-resource-id": observableResourceId,
  "observable-resource-name": observableResourceName,
  "observable-script-content": observableScriptContent,
  "observable-serial-number": observableSerialNumber,
  "observable-subnet": observableSubnet,
  "observable-url": observableUrl,
  "observable-user-agent": observableUserAgent,
  "observable-user-id": observableUserId,
  "observable-username": observableUsername,
};

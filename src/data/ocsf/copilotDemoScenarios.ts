/**
 * Curated Copilot demo scenarios — 10 event classes with vendor-looking source
 * fields and explicit OCSF mappings so Suggest Event Class + mappings look real.
 */

import {
  HTTP_ACTIVITY_DEMO_INITIAL_ROWS,
  HTTP_ACTIVITY_DEMO_MAPPED_ROWS,
  type HttpActivityDemoSourceRow,
} from "../httpActivityDemoSourceFields";
import { ocsfFieldMappingTag } from "../ocsfFieldDescriptions";

export type CopilotDemoField = {
  source: string;
  sample: string;
};

export type CopilotDemoScenario = {
  id: string;
  eventClassId: string;
  /** Short pitch for why Copilot picked this class. */
  rationale: string;
  fields: readonly CopilotDemoField[];
  /** source → one or more OCSF mapping tags (path labels with `_`). */
  mappings: Readonly<Record<string, readonly string[]>>;
};

function tag(path: string): string {
  return ocsfFieldMappingTag(path);
}

function fields(...rows: CopilotDemoField[]): readonly CopilotDemoField[] {
  return rows;
}

/** Rotate index for successive Suggest clicks in a session. */
let suggestRotation = 0;

export function peekNextCopilotDemoScenarioIndex(): number {
  return suggestRotation % COPILOT_DEMO_SCENARIOS.length;
}

export function takeNextCopilotDemoScenario(): CopilotDemoScenario {
  const scenario = COPILOT_DEMO_SCENARIOS[suggestRotation % COPILOT_DEMO_SCENARIOS.length]!;
  suggestRotation += 1;
  return scenario;
}

/** Sticky scenario per connector so different connectors demo different classes. */
export function copilotDemoScenarioForConnector(connectorId: string): CopilotDemoScenario {
  let hash = 0;
  for (let i = 0; i < connectorId.length; i += 1) {
    hash = (hash * 31 + connectorId.charCodeAt(i)) >>> 0;
  }
  return COPILOT_DEMO_SCENARIOS[hash % COPILOT_DEMO_SCENARIOS.length]!;
}

export function buildCopilotDemoMappedRows(
  scenario: CopilotDemoScenario,
): Array<CopilotDemoField & { mapped: boolean; tags?: string[] }> {
  return scenario.fields.map((field) => {
    const tags = scenario.mappings[field.source];
    if (!tags?.length) return { ...field, mapped: false };
    return { ...field, mapped: true, tags: [...tags] };
  });
}

export function buildCopilotDemoUnmappedRows(
  scenario: CopilotDemoScenario,
): Array<CopilotDemoField & { mapped: boolean }> {
  return scenario.fields.map((field) => ({ ...field, mapped: false }));
}

const HTTP_ACTIVITY_FIELDS: readonly CopilotDemoField[] = HTTP_ACTIVITY_DEMO_INITIAL_ROWS.map(
  ({ source, sample }) => ({ source, sample }),
);

const HTTP_ACTIVITY_MAPPINGS: Readonly<Record<string, readonly string[]>> = Object.fromEntries(
  HTTP_ACTIVITY_DEMO_MAPPED_ROWS.filter((row) => row.mapped && row.tags?.length).map((row) => [
    row.source,
    row.tags as readonly string[],
  ]),
);

/**
 * Ten diverse, demo-friendly event classes spanning network, identity, endpoint,
 * email, findings, and cloud.
 */
export const COPILOT_DEMO_SCENARIOS: readonly CopilotDemoScenario[] = [
  {
    id: "http-proxy",
    eventClassId: "http_activity",
    rationale: "Proxy / web gateway columns (cs_method, cs_uri, sc_status) match HTTP Activity.",
    fields: HTTP_ACTIVITY_FIELDS,
    mappings: HTTP_ACTIVITY_MAPPINGS,
  },
  {
    id: "okta-auth",
    eventClassId: "authentication",
    rationale: "Okta / IdP login fields (user, outcome, client IP, MFA) match Authentication.",
    fields: fields(
      { source: "actor_alternateId", sample: "jdoe@acme.com" },
      { source: "actor_displayName", sample: "Jane Doe" },
      { source: "actor_id", sample: "00u1abcXYZ" },
      { source: "client_ip", sample: "76.95.243.98" },
      { source: "client_userAgent", sample: "Mozilla/5.0 (Macintosh; Intel Mac OS X)" },
      { source: "client_geographicalContext_country", sample: "United States" },
      { source: "client_geographicalContext_city", sample: "Austin" },
      { source: "displayMessage", sample: "User login to Okta" },
      { source: "eventType", sample: "user.session.start" },
      { source: "outcome_result", sample: "SUCCESS" },
      { source: "outcome_reason", sample: "VERIFICATION_ERROR" },
      { source: "authenticationContext_credentialProvider", sample: "OKTA_CREDENTIAL_PROVIDER" },
      { source: "authenticationContext_credentialType", sample: "PASSWORD" },
      { source: "securityContext_asNumber", sample: "7922" },
      { source: "securityContext_isProxy", sample: "false" },
      { source: "device_name", sample: "JDOE-MBP" },
      { source: "device_os_name", sample: "Mac OS X" },
      { source: "legacyEventType", sample: "core.user_auth.login_success" },
      { source: "severity", sample: "INFO" },
      { source: "published", sample: "2024-06-01T12:00:00.128Z" },
      { source: "uuid", sample: "f3a91c2e-4b7d-4e1a-9c0f-12ab34cd56ef" },
      { source: "transaction_id", sample: "Yx9kLm2NpQ" },
      { source: "request_ipChain_0_ip", sample: "76.95.243.98" },
      { source: "target_0_alternateId", sample: "jdoe@acme.com" },
      { source: "target_0_type", sample: "User" },
      { source: "mfa_factor", sample: "OKTA_VERIFY" },
      { source: "session_id", sample: "idxSession123" },
      { source: "app_name", sample: "Okta Dashboard" },
    ),
    mappings: {
      actor_alternateId: [tag("actor.user.email_addr"), tag("user.email_addr")],
      actor_displayName: [tag("actor.user.name"), tag("user.name")],
      actor_id: [tag("actor.user.uid"), tag("user.uid")],
      client_ip: [tag("src_endpoint.ip")],
      client_userAgent: [tag("http_request.user_agent")],
      client_geographicalContext_country: [tag("src_endpoint.location.country")],
      client_geographicalContext_city: [tag("src_endpoint.location.city")],
      displayMessage: [tag("message")],
      eventType: [tag("activity_name")],
      outcome_result: [tag("status")],
      published: [tag("time")],
      device_name: [tag("device.hostname"), tag("src_endpoint.hostname")],
      device_os_name: [tag("device.os.name")],
      severity: [tag("severity")],
      session_id: [tag("actor.session.uid")],
      app_name: [tag("actor.app_name")],
      mfa_factor: [tag("auth_factors.factor_type")],
      uuid: [tag("metadata.uid")],
    },
  },
  {
    id: "dns-resolver",
    eventClassId: "dns_activity",
    rationale: "DNS query/response columns (qname, qtype, rcode) match DNS Activity.",
    fields: fields(
      { source: "query_name", sample: "api.example.com" },
      { source: "query_type", sample: "A" },
      { source: "query_class", sample: "IN" },
      { source: "response_code", sample: "NOERROR" },
      { source: "answers_0", sample: "52.84.12.10" },
      { source: "answers_1", sample: "52.84.12.11" },
      { source: "src_ip", sample: "10.20.30.40" },
      { source: "src_port", sample: "53122" },
      { source: "dst_ip", sample: "8.8.8.8" },
      { source: "dst_port", sample: "53" },
      { source: "protocol", sample: "UDP" },
      { source: "transport", sample: "udp" },
      { source: "duration_ms", sample: "12" },
      { source: "bytes_in", sample: "64" },
      { source: "bytes_out", sample: "128" },
      { source: "sensor_name", sample: "dns-edge-01" },
      { source: "vendor", sample: "Infoblox" },
      { source: "event_time", sample: "2024-06-01T12:00:00.128Z" },
      { source: "severity", sample: "Informational" },
      { source: "action", sample: "allowed" },
      { source: "user", sample: "jdoe" },
      { source: "hostname", sample: "workstation-42" },
      { source: "ttl", sample: "300" },
      { source: "flags", sample: "RD,RA" },
      { source: "message", sample: "DNS query resolved" },
    ),
    mappings: {
      query_name: [tag("query.hostname")],
      query_type: [tag("query.type")],
      response_code: [tag("rcode"), tag("status")],
      answers_0: [tag("answers.rdata")],
      src_ip: [tag("src_endpoint.ip")],
      src_port: [tag("src_endpoint.port")],
      dst_ip: [tag("dst_endpoint.ip")],
      dst_port: [tag("dst_endpoint.port")],
      protocol: [tag("connection_info.protocol_name")],
      event_time: [tag("time")],
      duration_ms: [tag("duration")],
      sensor_name: [tag("metadata.product.name")],
      vendor: [tag("metadata.product.vendor_name")],
      severity: [tag("severity")],
      user: [tag("actor.user.name")],
      hostname: [tag("src_endpoint.hostname")],
      message: [tag("message")],
      action: [tag("action")],
    },
  },
  {
    id: "crowdstrike-process",
    eventClassId: "process_activity",
    rationale: "EDR process telemetry (ImageFileName, CommandLine, PID) match Process Activity.",
    fields: fields(
      { source: "ImageFileName", sample: "C:\\Windows\\System32\\powershell.exe" },
      { source: "CommandLine", sample: "powershell.exe -enc JABzA..." },
      { source: "ProcessId", sample: "4821" },
      { source: "ParentProcessId", sample: "880" },
      { source: "ParentBaseFileName", sample: "explorer.exe" },
      { source: "UserName", sample: "ACME\\jdoe" },
      { source: "UserSid", sample: "S-1-5-21-..." },
      { source: "SHA256HashData", sample: "e3b0c44298fc1c149afbf4c8996fb924..." },
      { source: "MD5HashData", sample: "d41d8cd98f00b204e9800998ecf8427e" },
      { source: "LocalAddressIP4", sample: "10.0.4.12" },
      { source: "RemoteAddressIP4", sample: "185.220.101.1" },
      { source: "RemotePort", sample: "443" },
      { source: "LocalPort", sample: "51882" },
      { source: "HostName", sample: "WIN-JDOE-01" },
      { source: "AID", sample: "a1b2c3d4e5f6" },
      { source: "event_simpleName", sample: "ProcessRollup2" },
      { source: "DetectName", sample: "SuspiciousPowerShell" },
      { source: "Severity", sample: "High" },
      { source: "Timestamp", sample: "2024-06-01T12:00:00.128Z" },
      { source: "FileName", sample: "powershell.exe" },
      { source: "FilePath", sample: "C:\\Windows\\System32\\" },
      { source: "CompanyName", sample: "Microsoft Corporation" },
      { source: "ProductName", sample: "Windows PowerShell" },
      { source: "RawProcessId", sample: "4821" },
    ),
    mappings: {
      ImageFileName: [tag("process.file.path"), tag("process.file.name")],
      CommandLine: [tag("process.cmd_line")],
      ProcessId: [tag("process.pid")],
      ParentProcessId: [tag("process.ancestry.pid")],
      ParentBaseFileName: [tag("process.ancestry.name")],
      UserName: [tag("actor.user.name")],
      UserSid: [tag("actor.user.uid")],
      SHA256HashData: [tag("process.file.hashes.value")],
      HostName: [tag("device.hostname")],
      LocalAddressIP4: [tag("device.ip")],
      Timestamp: [tag("time")],
      Severity: [tag("severity")],
      FileName: [tag("process.file.name")],
      DetectName: [tag("activity_name")],
      event_simpleName: [tag("type_name")],
    },
  },
  {
    id: "endpoint-file",
    eventClassId: "file_activity",
    rationale: "File create/modify/delete columns match File System Activity.",
    fields: fields(
      { source: "file_path", sample: "C:\\Users\\Public\\update.exe" },
      { source: "file_name", sample: "update.exe" },
      { source: "file_extension", sample: "exe" },
      { source: "file_size", sample: "245760" },
      { source: "file_hash_sha256", sample: "9f86d081884c7d659a2feaa0c55ad015..." },
      { source: "operation", sample: "Create" },
      { source: "process_name", sample: "chrome.exe" },
      { source: "process_id", sample: "2204" },
      { source: "process_cmd", sample: "chrome.exe --type=renderer" },
      { source: "user", sample: "jdoe" },
      { source: "user_domain", sample: "ACME" },
      { source: "device_hostname", sample: "LAPTOP-42" },
      { source: "device_ip", sample: "10.0.4.55" },
      { source: "event_time", sample: "2024-06-01T12:00:00.128Z" },
      { source: "severity", sample: "Medium" },
      { source: "vendor", sample: "CrowdStrike" },
      { source: "product", sample: "Falcon" },
      { source: "action", sample: "logged" },
      { source: "target_path", sample: "C:\\Users\\Public\\" },
      { source: "message", sample: "File created on disk" },
    ),
    mappings: {
      file_path: [tag("file.path"), tag("file.name")],
      file_name: [tag("file.name")],
      file_size: [tag("file.size")],
      file_hash_sha256: [tag("file.hashes.value")],
      operation: [tag("activity_name")],
      process_name: [tag("actor.process.name")],
      process_id: [tag("actor.process.pid")],
      process_cmd: [tag("actor.process.cmd_line")],
      user: [tag("actor.user.name")],
      device_hostname: [tag("device.hostname")],
      device_ip: [tag("device.ip")],
      event_time: [tag("time")],
      severity: [tag("severity")],
      vendor: [tag("metadata.product.vendor_name")],
      product: [tag("metadata.product.name")],
      message: [tag("message")],
      action: [tag("action")],
    },
  },
  {
    id: "firewall-flow",
    eventClassId: "network_activity",
    rationale: "Firewall / flow 5-tuple fields match Network Activity.",
    fields: fields(
      { source: "src_ip", sample: "10.1.2.30" },
      { source: "src_port", sample: "51882" },
      { source: "dst_ip", sample: "52.84.12.10" },
      { source: "dst_port", sample: "443" },
      { source: "protocol", sample: "TCP" },
      { source: "action", sample: "ALLOW" },
      { source: "bytes_sent", sample: "4096" },
      { source: "bytes_received", sample: "16384" },
      { source: "packets_sent", sample: "12" },
      { source: "packets_received", sample: "18" },
      { source: "duration_sec", sample: "2.4" },
      { source: "app_id", sample: "ssl" },
      { source: "rule_name", sample: "allow-outbound-web" },
      { source: "zone_from", sample: "trust" },
      { source: "zone_to", sample: "untrust" },
      { source: "device_name", sample: "fw-edge-01" },
      { source: "vendor", sample: "Palo Alto Networks" },
      { source: "event_time", sample: "2024-06-01T12:00:00.128Z" },
      { source: "session_id", sample: "48291033" },
      { source: "user", sample: "jdoe" },
      { source: "src_country", sample: "US" },
      { source: "dst_country", sample: "US" },
      { source: "severity", sample: "Informational" },
      { source: "message", sample: "Traffic allowed" },
    ),
    mappings: {
      src_ip: [tag("src_endpoint.ip")],
      src_port: [tag("src_endpoint.port")],
      dst_ip: [tag("dst_endpoint.ip")],
      dst_port: [tag("dst_endpoint.port")],
      protocol: [tag("connection_info.protocol_name")],
      action: [tag("action")],
      bytes_sent: [tag("traffic.bytes_out")],
      bytes_received: [tag("traffic.bytes_in")],
      duration_sec: [tag("duration")],
      rule_name: [tag("policy.name")],
      device_name: [tag("device.hostname")],
      vendor: [tag("metadata.product.vendor_name")],
      event_time: [tag("time")],
      session_id: [tag("connection_info.uid")],
      user: [tag("actor.user.name")],
      src_country: [tag("src_endpoint.location.country")],
      dst_country: [tag("dst_endpoint.location.country")],
      severity: [tag("severity")],
      message: [tag("message")],
    },
  },
  {
    id: "email-security",
    eventClassId: "email_activity",
    rationale: "Email security fields (from, to, subject, message_id) match Email Activity.",
    fields: fields(
      { source: "from_address", sample: "phish@evil.example" },
      { source: "to_address", sample: "jdoe@acme.com" },
      { source: "cc_address", sample: "security@acme.com" },
      { source: "subject", sample: "Invoice overdue — action required" },
      { source: "message_id", sample: "<abc123@evil.example>" },
      { source: "smtp_hello", sample: "mail.evil.example" },
      { source: "attachment_name", sample: "invoice.pdf.exe" },
      { source: "attachment_sha256", sample: "a591a6d40bf420404a011733cfb7b190..." },
      { source: "url_in_body", sample: "https://evil.example/pay" },
      { source: "direction", sample: "inbound" },
      { source: "action", sample: "quarantined" },
      { source: "verdict", sample: "malicious" },
      { source: "spam_score", sample: "9.8" },
      { source: "src_ip", sample: "185.220.101.45" },
      { source: "dst_ip", sample: "52.96.10.20" },
      { source: "event_time", sample: "2024-06-01T12:00:00.128Z" },
      { source: "vendor", sample: "Proofpoint" },
      { source: "product", sample: "Email Protection" },
      { source: "severity", sample: "High" },
      { source: "user", sample: "jdoe" },
      { source: "message", sample: "Malicious email quarantined" },
    ),
    mappings: {
      from_address: [tag("email.from")],
      to_address: [tag("email.to")],
      subject: [tag("email.subject")],
      message_id: [tag("email.message_uid")],
      attachment_name: [tag("email.files.name")],
      attachment_sha256: [tag("email.files.hashes.value")],
      url_in_body: [tag("email.urls.url_string")],
      direction: [tag("activity_name")],
      action: [tag("action")],
      src_ip: [tag("src_endpoint.ip")],
      dst_ip: [tag("dst_endpoint.ip")],
      event_time: [tag("time")],
      vendor: [tag("metadata.product.vendor_name")],
      product: [tag("metadata.product.name")],
      severity: [tag("severity")],
      user: [tag("actor.user.name")],
      message: [tag("message")],
      verdict: [tag("status")],
    },
  },
  {
    id: "siem-detection",
    eventClassId: "detection_finding",
    rationale: "SIEM alert / detection fields match Detection Finding.",
    fields: fields(
      { source: "alert_id", sample: "DET-10482" },
      { source: "alert_title", sample: "Suspicious lateral movement" },
      { source: "alert_description", sample: "Multiple failed logons followed by success" },
      { source: "severity", sample: "High" },
      { source: "confidence", sample: "Medium" },
      { source: "mitre_tactic", sample: "Lateral Movement" },
      { source: "mitre_technique", sample: "T1021" },
      { source: "src_ip", sample: "10.0.4.12" },
      { source: "dst_ip", sample: "10.0.5.88" },
      { source: "src_host", sample: "WIN-JDOE-01" },
      { source: "dst_host", sample: "DC01" },
      { source: "user", sample: "jdoe" },
      { source: "user_domain", sample: "ACME" },
      { source: "process_name", sample: "psexec.exe" },
      { source: "process_cmd", sample: "psexec.exe \\\\DC01 cmd" },
      { source: "file_hash", sample: "e3b0c44298fc1c149afbf4c8996fb924..." },
      { source: "status", sample: "New" },
      { source: "event_time", sample: "2024-06-01T12:00:00.128Z" },
      { source: "vendor", sample: "Splunk" },
      { source: "product", sample: "Enterprise Security" },
      { source: "rule_name", sample: "lateral_movement_psexec" },
      { source: "rule_id", sample: "ESCU-1042" },
      { source: "message", sample: "Detection triggered" },
    ),
    mappings: {
      alert_id: [tag("finding_info.uid")],
      alert_title: [tag("finding_info.title")],
      alert_description: [tag("finding_info.desc"), tag("message")],
      severity: [tag("severity")],
      confidence: [tag("confidence")],
      mitre_tactic: [tag("attacks.tactic.name")],
      mitre_technique: [tag("attacks.technique.uid")],
      src_ip: [tag("evidences.src_endpoint.ip")],
      dst_ip: [tag("evidences.dst_endpoint.ip")],
      src_host: [tag("evidences.src_endpoint.hostname")],
      dst_host: [tag("evidences.dst_endpoint.hostname")],
      user: [tag("actor.user.name")],
      process_name: [tag("actor.process.name")],
      process_cmd: [tag("actor.process.cmd_line")],
      file_hash: [tag("evidences.file.hashes.value")],
      status: [tag("status")],
      event_time: [tag("time")],
      vendor: [tag("metadata.product.vendor_name")],
      product: [tag("metadata.product.name")],
      rule_name: [tag("finding_info.analytic.name")],
      rule_id: [tag("finding_info.analytic.uid")],
    },
  },
  {
    id: "vuln-scan",
    eventClassId: "vulnerability_finding",
    rationale: "Vulnerability scanner columns (cve, cvss, asset) match Vulnerability Finding.",
    fields: fields(
      { source: "cve_id", sample: "CVE-2024-12345" },
      { source: "cve_title", sample: "Remote code execution in ExampleLib" },
      { source: "cvss_score", sample: "9.8" },
      { source: "cvss_vector", sample: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H" },
      { source: "severity", sample: "Critical" },
      { source: "asset_hostname", sample: "web-prod-03" },
      { source: "asset_ip", sample: "10.50.1.33" },
      { source: "asset_os", sample: "Ubuntu 22.04" },
      { source: "plugin_id", sample: "158432" },
      { source: "plugin_name", sample: "ExampleLib RCE Detection" },
      { source: "port", sample: "443" },
      { source: "protocol", sample: "tcp" },
      { source: "solution", sample: "Upgrade ExampleLib to 2.4.1 or later" },
      { source: "first_found", sample: "2024-05-20T08:00:00Z" },
      { source: "last_found", sample: "2024-06-01T12:00:00Z" },
      { source: "state", sample: "OPEN" },
      { source: "vendor", sample: "Tenable" },
      { source: "product", sample: "Nessus" },
      { source: "event_time", sample: "2024-06-01T12:00:00.128Z" },
      { source: "message", sample: "Critical vulnerability detected" },
      { source: "cwe_id", sample: "CWE-94" },
      { source: "exploit_available", sample: "true" },
    ),
    mappings: {
      cve_id: [tag("vulnerabilities.cve.uid")],
      cve_title: [tag("finding_info.title")],
      cvss_score: [tag("vulnerabilities.cve.cvss.base_score")],
      severity: [tag("severity")],
      asset_hostname: [tag("device.hostname"), tag("resource.hostname")],
      asset_ip: [tag("device.ip"), tag("resource.ip")],
      asset_os: [tag("device.os.name")],
      plugin_id: [tag("finding_info.analytic.uid")],
      plugin_name: [tag("finding_info.analytic.name")],
      port: [tag("device.network_interfaces.open_ports.port")],
      solution: [tag("vulnerabilities.remediation.desc")],
      first_found: [tag("finding_info.first_seen_time")],
      last_found: [tag("time")],
      state: [tag("status")],
      vendor: [tag("metadata.product.vendor_name")],
      product: [tag("metadata.product.name")],
      event_time: [tag("time")],
      message: [tag("message")],
      cwe_id: [tag("vulnerabilities.cwe.uid")],
    },
  },
  {
    id: "aws-api",
    eventClassId: "api_activity",
    rationale: "CloudTrail / API audit columns match API Activity.",
    fields: fields(
      { source: "eventName", sample: "AssumeRole" },
      { source: "eventSource", sample: "sts.amazonaws.com" },
      { source: "eventTime", sample: "2024-06-01T12:00:00Z" },
      { source: "awsRegion", sample: "us-east-1" },
      { source: "sourceIPAddress", sample: "76.95.243.98" },
      { source: "userAgent", sample: "aws-cli/2.15.0 Python/3.11.6" },
      { source: "userIdentity_type", sample: "IAMUser" },
      { source: "userIdentity_arn", sample: "arn:aws:iam::123456789012:user/jdoe" },
      { source: "userIdentity_userName", sample: "jdoe" },
      { source: "userIdentity_accountId", sample: "123456789012" },
      { source: "requestParameters_roleArn", sample: "arn:aws:iam::123456789012:role/Admin" },
      { source: "responseElements_assumedRoleUser_arn", sample: "arn:aws:sts::123456789012:assumed-role/Admin/jdoe" },
      { source: "errorCode", sample: "" },
      { source: "errorMessage", sample: "" },
      { source: "eventID", sample: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" },
      { source: "eventType", sample: "AwsApiCall" },
      { source: "recipientAccountId", sample: "123456789012" },
      { source: "readOnly", sample: "false" },
      { source: "managementEvent", sample: "true" },
      { source: "vpcEndpointId", sample: "" },
      { source: "tlsDetails_tlsVersion", sample: "TLSv1.3" },
      { source: "severity", sample: "Medium" },
      { source: "message", sample: "STS AssumeRole API call" },
    ),
    mappings: {
      eventName: [tag("api.operation"), tag("activity_name")],
      eventSource: [tag("api.service.name")],
      eventTime: [tag("time")],
      awsRegion: [tag("cloud.region")],
      sourceIPAddress: [tag("src_endpoint.ip")],
      userAgent: [tag("http_request.user_agent")],
      userIdentity_userName: [tag("actor.user.name")],
      userIdentity_arn: [tag("actor.user.uid")],
      userIdentity_accountId: [tag("cloud.account.uid")],
      requestParameters_roleArn: [tag("api.request.uid")],
      eventID: [tag("metadata.uid")],
      eventType: [tag("type_name")],
      severity: [tag("severity")],
      message: [tag("message")],
      recipientAccountId: [tag("cloud.account.uid")],
      tlsDetails_tlsVersion: [tag("api.version")],
    },
  },
];

export function findCopilotDemoScenarioByEventClass(
  eventClassId: string,
): CopilotDemoScenario | undefined {
  return COPILOT_DEMO_SCENARIOS.find((scenario) => scenario.eventClassId === eventClassId);
}

/** Preserve http_activity enum metadata when applying that scenario. */
export function buildHttpActivityRowsFromScenario(
  mapped: boolean,
): HttpActivityDemoSourceRow[] {
  if (mapped) {
    return HTTP_ACTIVITY_DEMO_MAPPED_ROWS.map((row) => ({ ...row }));
  }
  return HTTP_ACTIVITY_DEMO_INITIAL_ROWS.map((row) => ({ ...row, mapped: false, tags: undefined }));
}

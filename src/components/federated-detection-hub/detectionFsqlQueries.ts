const DETECTION_FSQL_BY_ID: Record<string, string> = {
  "lib-1": `QUERY
SHOW dns_activity.**
WITH dns_activity.query.hostname LENGTH > 50
AND dns_activity.query.entropy > 4.5
SINCE 7d
LIMIT 500`,
  "managed-lib-1": `QUERY
SHOW dns_activity.**
WITH dns_activity.query.hostname LENGTH > 50
AND dns_activity.query.entropy > 4.5
SINCE 7d
LIMIT 500`,
  "lib-2": `QUERY
SHOW authentication.**
WITH authentication.auth_protocol = 'kerberos'
AND authentication.ticket.encryption_type = '0x17'
SINCE 7d
LIMIT 500`,
  "managed-lib-2": `QUERY
SHOW authentication.**
WITH authentication.auth_protocol = 'kerberos'
AND authentication.ticket.encryption_type = '0x17'
SINCE 7d
LIMIT 500`,
};

const DEFAULT_DETECTION_FSQL = `QUERY
SHOW event.**
SINCE 7d
LIMIT 500`;

function fsqlFromKeywords(name: string): string | null {
  const normalized = name.toLowerCase();

  if (/\b(powershell|cmd\.exe)\b/.test(normalized)) {
    return `QUERY
SHOW process_activity.**
WITH process_activity.process.name IN 'powershell.exe', 'cmd.exe'
AND process_activity.process.cmd_line CONTAINS 'hidden'
SINCE 7d
LIMIT 1000`;
  }

  if (/\b(dns|tunneling|beaconing|apt28)\b/.test(normalized)) {
    return `QUERY
SHOW dns_activity.**
WITH dns_activity.query.hostname CONTAINS '.'
AND dns_activity.query.entropy > 4.0
SINCE 7d
LIMIT 500`;
  }

  if (/\b(kerberos|kerberoast|tgt)\b/.test(normalized)) {
    return `QUERY
SHOW authentication.**
WITH authentication.auth_protocol = 'kerberos'
SINCE 7d
LIMIT 500`;
  }

  if (/\b(ransomware|encryption burst)\b/.test(normalized)) {
    return `QUERY
SHOW file_activity.**
WITH file_activity.file.type = 'file'
AND file_activity.activity_name IN 'rename', 'modify'
SINCE 24hrs
LIMIT 1000`;
  }

  if (/\b(smb|lateral movement)\b/.test(normalized)) {
    return `QUERY
SHOW network_activity.**
WITH network_activity.protocol = 'smb'
AND network_activity.connection_info.direction = 'outbound'
SINCE 7d
LIMIT 500`;
  }

  if (/\b(credential|lsass|dumping|mimikatz)\b/.test(normalized)) {
    return `QUERY
SHOW process_activity.**
WITH process_activity.process.name CONTAINS 'lsass'
OR process_activity.process.cmd_line CONTAINS 'sekurlsa'
SINCE 7d
LIMIT 500`;
  }

  if (/\b(oauth|saas)\b/.test(normalized)) {
    return `QUERY
SHOW identity_activity.**
WITH identity_activity.activity_name = 'oauth_consent'
SINCE 30d
LIMIT 500`;
  }

  if (/\b(impossible travel|travel login|travel sign)\b/.test(normalized)) {
    return `QUERY
SHOW authentication.**
WITH authentication.logon_type = 'interactive'
SINCE 30d
LIMIT 500`;
  }

  if (/\b(sql injection)\b/.test(normalized)) {
    return `QUERY
SHOW web_activity.**
WITH web_activity.http_request.url CONTAINS 'union'
OR web_activity.http_request.url CONTAINS 'select'
SINCE 7d
LIMIT 500`;
  }

  if (/\b(s3|bucket|cloud storage|public exposure)\b/.test(normalized)) {
    return `QUERY
SHOW cloud_activity.**
WITH cloud_activity.resource.type = 'storage_bucket'
AND cloud_activity.activity_name = 'policy_change'
SINCE 30d
LIMIT 500`;
  }

  if (/\b(phishing|email)\b/.test(normalized)) {
    return `QUERY
SHOW email_activity.**
WITH email_activity.url.domain REPUTATION 'suspicious'
SINCE 7d
LIMIT 500`;
  }

  if (/\b(web shell)\b/.test(normalized)) {
    return `QUERY
SHOW web_activity.**
WITH web_activity.http_request.method = 'POST'
AND web_activity.file.type = 'script'
SINCE 7d
LIMIT 500`;
  }

  if (/\b(gcp|service account)\b/.test(normalized)) {
    return `QUERY
SHOW cloud_activity.**
WITH cloud_activity.resource.type = 'service_account'
AND cloud_activity.activity_name = 'key_create'
SINCE 30d
LIMIT 500`;
  }

  if (/\b(database|bulk export|table export)\b/.test(normalized)) {
    return `QUERY
SHOW database_activity.**
WITH database_activity.activity_name = 'query'
AND database_activity.query.rows_returned > 10000
SINCE 7d
LIMIT 500`;
  }

  if (/\b(privilege escalation|privileged)\b/.test(normalized)) {
    return `QUERY
SHOW process_activity.**
WITH process_activity.privileges CONTAINS 'admin'
SINCE 7d
LIMIT 500`;
  }

  if (/\b(av tampering|endpoint protection)\b/.test(normalized)) {
    return `QUERY
SHOW process_activity.**
WITH process_activity.process.name CONTAINS 'defender'
OR process_activity.activity_name = 'service_stop'
SINCE 7d
LIMIT 500`;
  }

  if (/\b(network traffic|outbound)\b/.test(normalized)) {
    return `QUERY
SHOW network_activity.**
WITH network_activity.connection_info.direction = 'outbound'
SINCE 24hrs
LIMIT 500`;
  }

  if (/\b(failed auth|authentication)\b/.test(normalized)) {
    return `QUERY
SHOW authentication.**
WITH authentication.status = 'failure'
SINCE 24hrs
LIMIT 500`;
  }

  return null;
}

/** FSQL query to prefill federated search when opening findings from a detection row. */
export function getDetectionFsqlQuery(detectionId: string, detectionName: string): string {
  return DETECTION_FSQL_BY_ID[detectionId] ?? fsqlFromKeywords(detectionName) ?? DEFAULT_DETECTION_FSQL;
}

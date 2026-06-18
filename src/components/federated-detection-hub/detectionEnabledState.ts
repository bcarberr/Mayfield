export function detectionEnabledKey(name: string): string {
  return name.trim().toLowerCase();
}

export function getDetectionEnabled(
  name: string,
  defaultEnabled: boolean,
  enabledByName: Record<string, boolean>,
): boolean {
  const key = detectionEnabledKey(name);
  return key in enabledByName ? enabledByName[key]! : defaultEnabled;
}

export function buildInitialEnabledByName(
  rows: readonly { name: string; enabled: boolean }[],
): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const row of rows) {
    const key = detectionEnabledKey(row.name);
    if (!(key in result)) {
      result[key] = row.enabled;
    }
  }
  return result;
}

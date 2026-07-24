export const DEFAULT_SHELF_APP_IDS = [
  'files',
  'text',
  'view',
  'tasks',
  'calendar',
  'clock',
  'connections',
  'terminal',
  'calculator',
  'luma',
  'memo',
  'vela',
  'settings',
] as const;

export function normalizeShelfAppIds(
  value: unknown,
  validAppIds: readonly string[] = DEFAULT_SHELF_APP_IDS,
): string[] {
  if (!Array.isArray(value)) return [...validAppIds];

  const validIds = new Set(validAppIds);
  const normalized: string[] = [];
  for (const candidate of value) {
    if (
      typeof candidate === 'string' &&
      validIds.has(candidate) &&
      !normalized.includes(candidate)
    ) {
      normalized.push(candidate);
    }
  }

  return value.length > 0 && normalized.length === 0 ? [...validAppIds] : normalized;
}

export function reorderShelfAppIds(
  appIds: readonly string[],
  movingAppId: string,
  targetAppId: string,
): string[] {
  const fromIndex = appIds.indexOf(movingAppId);
  const targetIndex = appIds.indexOf(targetAppId);
  if (fromIndex < 0 || targetIndex < 0 || fromIndex === targetIndex) return [...appIds];

  const next = [...appIds];
  const [moving] = next.splice(fromIndex, 1);
  if (!moving) return [...appIds];
  next.splice(targetIndex, 0, moving);
  return next;
}

export function removeShelfAppId(appIds: readonly string[], appId: string): string[] {
  return appIds.filter((candidate) => candidate !== appId);
}

export function addShelfAppId(
  appIds: readonly string[],
  appId: string,
  validAppIds: readonly string[] = DEFAULT_SHELF_APP_IDS,
): string[] {
  if (!validAppIds.includes(appId) || appIds.includes(appId)) return [...appIds];
  return [...appIds, appId];
}

/**
 * i18n helper — safely reads from window.i18nResources with a fallback.
 * Prevents TypeError when the global is missing or a key is absent.
 */
export function i18n(key: string, fallback: string): string {
  const resources = (
    window as unknown as Record<string, unknown>
  ).i18nResources as Record<string, string> | undefined;
  return resources?.[key] ?? fallback;
}

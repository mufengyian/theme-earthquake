/**
 * Resolves a value from a function parameter or falls back to dataset attribute(s)
 * on the Alpine $el element.
 *
 * @param state - Alpine component state (must contain $el)
 * @param datasetKeys - Single dataset key or array of keys to try in order
 * @param paramValue - Optional explicit parameter value (takes highest priority)
 * @returns The resolved value, or undefined if nothing is found
 */
export function resolveDataAttribute(
  state: Record<string, unknown>,
  datasetKeys: string | string[],
  paramValue?: string,
): string | undefined {
  if (paramValue !== undefined && paramValue !== "") {
    return paramValue;
  }

  const $el = state.$el as HTMLElement | undefined;
  if (!$el) {
    return undefined;
  }

  const keys = Array.isArray(datasetKeys) ? datasetKeys : [datasetKeys];
  for (const key of keys) {
    const value = $el.dataset[key] as string | undefined;
    if (value !== undefined && value !== "") {
      return value;
    }
  }
  return undefined;
}

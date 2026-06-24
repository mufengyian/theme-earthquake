/**
 * Resolves a value from a function parameter or falls back to a dataset attribute
 * on the Alpine $el element. Used by upvote.ts and ui-permission.ts.
 */
export function resolveDataAttribute(
  state: Record<string, unknown>,
  datasetKey: string,
  paramValue?: string,
): string | undefined {
  if (paramValue !== undefined && paramValue !== "") {
    return paramValue;
  }

  const $el = state.$el as HTMLElement | undefined;
  if (!$el) {
    return undefined;
  }

  return (
    $el.dataset[datasetKey] as string | undefined
  );
}

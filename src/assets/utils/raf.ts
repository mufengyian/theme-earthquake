/**
 * rAF throttle — schedules at most one call per animation frame.
 * Used by scroll/resize handlers to avoid layout thrashing.
 */
export function rafThrottle<T extends (...args: unknown[]) => void>(
  fn: T,
): (...args: Parameters<T>) => void {
  let scheduled = false;
  let lastArgs: Parameters<T>;

  return (...args: Parameters<T>) => {
    lastArgs = args;
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      fn(...lastArgs);
    });
  };
}

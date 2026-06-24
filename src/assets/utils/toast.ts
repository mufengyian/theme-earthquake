/**
 * Lightweight toast notification — no dependencies, no Alpine coupling.
 * Auto-creates a fixed container and toast elements on first call.
 */

let toastContainer: HTMLDivElement | null = null;
let toastTimer: number | undefined;

const ensureContainer = (): HTMLDivElement => {
  if (toastContainer && document.body.contains(toastContainer)) {
    return toastContainer;
  }

  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;top:1.5rem;left:50%;transform:translateX(-50%);z-index:9999;pointer-events:none;display:flex;flex-direction:column;gap:0.5rem;align-items:center;";
  document.body.append(container);
  toastContainer = container;
  return container;
};

export function showToast(
  message: string,
  type: "info" | "error" | "success" = "info",
  duration = 3000,
): void {
  const container = ensureContainer();

  const toast = document.createElement("div");
  const bg =
    type === "error"
      ? "rgba(220,38,38,0.95)"
      : type === "success"
        ? "rgba(22,163,74,0.95)"
        : "rgba(31,41,55,0.95)";
  toast.style.cssText = `pointer-events:auto;padding:0.6rem 1.2rem;border-radius:0.5rem;color:#fff;font-size:0.875rem;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,0.15);background:${bg};opacity:0;transition:opacity 0.2s ease;max-width:90vw;word-break:break-word;`;
  toast.textContent = message;
  container.append(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
  });

  const remove = () => {
    toast.style.opacity = "0";
    if (toastTimer) {
      window.clearTimeout(toastTimer);
    }
    toastTimer = window.setTimeout(() => toast.remove(), 200);
  };

  toastTimer = window.setTimeout(remove, duration);
}

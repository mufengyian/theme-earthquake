export type ColorSchemeType = "system" | "dark" | "light";

export let currentColorScheme: ColorSchemeType = "system";

const colorSchemeValues = ["system", "dark", "light"] as const;

const isColorScheme = (value: string | null): value is ColorSchemeType =>
  colorSchemeValues.includes(value as ColorSchemeType);

export function initColorScheme(
  defaultColorScheme: ColorSchemeType,
  enableChangeColorScheme: boolean,
) {
  let colorScheme = isColorScheme(defaultColorScheme)
    ? defaultColorScheme
    : "system";

  if (enableChangeColorScheme) {
    try {
      const storedColorScheme = localStorage.getItem("color-scheme");

      if (isColorScheme(storedColorScheme)) {
        colorScheme = storedColorScheme;
      }
    } catch {
      // Ignore storage failures and keep the configured default.
    }
  }

  currentColorScheme = colorScheme;
  setColorScheme(colorScheme, false);
}

export function setColorScheme(
  colorScheme: ColorSchemeType,
  store: boolean,
  origin?: { x: number; y: number },
) {
  const apply = () => {
    if (colorScheme === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      document.documentElement.classList.add(prefersDark ? "dark" : "light");
      document.documentElement.classList.remove(prefersDark ? "light" : "dark");
    } else {
      document.documentElement.classList.add(colorScheme);
      document.documentElement.classList.remove(
        colorScheme === "dark" ? "light" : "dark",
      );
    }
    currentColorScheme = colorScheme;
    if (store) {
      try {
        localStorage.setItem("color-scheme", colorScheme);
      } catch {
        // Ignore storage failures.
      }
    }
  };

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // Skip animation when the visual result is identical (e.g. system→light
  // while already in light mode) — no dark/light class change means no visual
  // difference, so the transition would just show an ugly black flash.
  const currentlyDark = document.documentElement.classList.contains("dark");
  const willBeDark =
    colorScheme === "dark" ||
    (colorScheme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (
    !origin ||
    prefersReducedMotion ||
    !document.startViewTransition ||
    currentlyDark === willBeDark ||
    !window.enableColorSchemeAnimation
  ) {
    apply();
    return;
  }

  const transition = document.startViewTransition(apply);
  const { x, y } = origin;
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  void transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 300,
        easing: "ease-out",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  });
}

window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", function () {
    if (currentColorScheme === "system") {
      setColorScheme("system", false);
    }
  });

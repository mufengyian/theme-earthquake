import { i18n } from "../utils/i18n";
import { resolveDataAttribute } from "../utils/dataset";

interface UpvoteState {
  upvotedNames: string[];
  init(): void;
  upvoted(id?: string): boolean;
  handleUpvote(name?: string): void;
}

export default (key: string, group: string, plural: string): UpvoteState => ({
  upvotedNames: [],
  init() {
    try {
      const storedNames = JSON.parse(
        localStorage.getItem(`halo.upvoted.${key}.names`) || "[]",
      );
      this.upvotedNames = Array.isArray(storedNames) ? storedNames : [];
    } catch {
      this.upvotedNames = [];
    }
  },
  upvoted(id?: string) {
    const target = resolveDataAttribute(
      this as unknown as Record<string, unknown>,
      [`upvote${key.charAt(0).toUpperCase() + key.slice(1)}Name`, `${key}Name`],
      id,
    );
    if (!target) {
      return false;
    }
    return this.upvotedNames.includes(target);
  },
  async handleUpvote(name?: string) {
    const target = resolveDataAttribute(
      this as unknown as Record<string, unknown>,
      [`upvote${key.charAt(0).toUpperCase() + key.slice(1)}Name`, `${key}Name`],
      name,
    );
    if (!target) {
      return;
    }
    if (this.upvoted(target)) {
      return;
    }
    const response = await fetch(
      "/apis/api.halo.run/v1alpha1/trackers/upvote",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          group,
          plural,
          name: target,
        }),
      },
    ).catch(() => undefined);
    if (!response?.ok) {
      const { showToast } = window as unknown as {
        showToast?: (msg: string, type?: "error") => void;
      };
      const msg = i18n("jsModule.upvote.networkError", "Network error, please try again");
      showToast?.(msg, "error");
      return;
    }
    this.upvotedNames = [...this.upvotedNames, target];
    try {
      localStorage.setItem(
        `halo.upvoted.${key}.names`,
        JSON.stringify(this.upvotedNames),
      );
    } catch {
      // Ignore storage failures so the visible count can still update.
    }
    const upvoteNodes = Array.from(
      document.querySelectorAll<HTMLElement>(`[data-upvote-${key}-name]`),
    ).filter((node) => node.getAttribute(`data-upvote-${key}-name`) === target);
    upvoteNodes.forEach((node) => {
      const upvoteCount = Number.parseInt(node.textContent || "0", 10);
      node.textContent = String(
        (Number.isNaN(upvoteCount) ? 0 : upvoteCount) + 1,
      );
    });
  },
});

interface UpvoteState {
  upvotedNames: string[];
  init(): void;
  upvoted(id: string): boolean;
  handleUpvote(name: string): void;
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
  upvoted(id: string) {
    return this.upvotedNames.includes(id);
  },
  async handleUpvote(name) {
    if (this.upvoted(name)) {
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
          name,
        }),
      },
    ).catch(() => undefined);

    if (!response?.ok) {
      alert(window.i18nResources["jsModule.upvote.networkError"]);
      return;
    }

    this.upvotedNames = [...this.upvotedNames, name];

    try {
      localStorage.setItem(
        `halo.upvoted.${key}.names`,
        JSON.stringify(this.upvotedNames),
      );
    } catch {
      // Ignore storage failures so the visible count can still update.
    }

    const upvoteNode = Array.from(
      document.querySelectorAll<HTMLElement>(`[data-upvote-${key}-name]`),
    ).find((node) => node.getAttribute(`data-upvote-${key}-name`) === name);

    if (!upvoteNode) {
      return;
    }

    const upvoteCount = Number.parseInt(upvoteNode.textContent || "0", 10);
    upvoteNode.textContent = String(
      (Number.isNaN(upvoteCount) ? 0 : upvoteCount) + 1,
    );
  },
});

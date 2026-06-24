import { resolveDataAttribute } from "../utils/dataset";

interface State {
  userPermission?: {
    uiPermissions: string[];
  };
  init: () => void;
  shouldDisplay?: boolean;
  fetchUserPermission: () => void;
}

export default (permission: string, currentUser?: string): State => ({
  userPermission: undefined,
  init() {
    this.fetchUserPermission();
  },
  get shouldDisplay() {
    const user = resolveDataAttribute(
      this as unknown as Record<string, unknown>,
      "currentUser",
      currentUser,
    );
    if (user === "anonymousUser" || user === undefined || user === "") {
      return false;
    }
    if (!this.userPermission) {
      return false;
    }
    if (this.userPermission.uiPermissions.includes(permission)) {
      return true;
    }
    return false;
  },
  async fetchUserPermission() {
    const response = await fetch(
      `/apis/api.console.halo.run/v1alpha1/users/-/permissions`,
    ).catch(() => undefined);
    if (response?.ok) {
      this.userPermission = await response.json();
    }
  },
});

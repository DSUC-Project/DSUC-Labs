import { AuthIntent, AuthMethod } from "@/types";

export const OPEN_LOGIN_MODAL_EVENT = "open-login-modal";
const PENDING_AUTH_ANNOUNCEMENT_KEY = "dsuc-pending-auth-announcement";

export function openLoginModal(mode: AuthIntent = "login") {
  if (typeof document === "undefined") {
    return;
  }

  document.dispatchEvent(
    new CustomEvent<AuthIntent>(OPEN_LOGIN_MODAL_EVENT, {
      detail: mode,
    }),
  );
}

export function registerLoginModalListener(
  handler: (mode: AuthIntent) => void,
) {
  if (typeof document === "undefined") {
    return () => {};
  }

  const listener = (event: Event) => {
    const detail = (event as CustomEvent<AuthIntent | undefined>).detail;
    handler(detail === "signup" ? "signup" : "login");
  };

  document.addEventListener(OPEN_LOGIN_MODAL_EVENT, listener as EventListener);
  return () => {
    document.removeEventListener(
      OPEN_LOGIN_MODAL_EVENT,
      listener as EventListener,
    );
  };
}

export function markPendingAuthAnnouncement(method: AuthMethod) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(PENDING_AUTH_ANNOUNCEMENT_KEY, method);
}

export function consumePendingAuthAnnouncement(): AuthMethod | null {
  if (typeof window === "undefined") {
    return null;
  }

  const pendingMethod = window.sessionStorage.getItem(
    PENDING_AUTH_ANNOUNCEMENT_KEY,
  );

  window.sessionStorage.removeItem(PENDING_AUTH_ANNOUNCEMENT_KEY);

  if (
    pendingMethod === "wallet" ||
    pendingMethod === "google" ||
    pendingMethod === "local"
  ) {
    return pendingMethod;
  }

  return null;
}

export function clearPendingAuthAnnouncement() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(PENDING_AUTH_ANNOUNCEMENT_KEY);
}

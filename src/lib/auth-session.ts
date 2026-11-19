/**
 * Client-side auth session store.
 *
 * The signed-in session (JWT + user) is persisted in `localStorage` and
 * exposed through a tiny module-level external store so it can be consumed
 * with `useSyncExternalStore`. This gives us:
 *
 * - SSR-safe hydration (server snapshot is always `null`, so prerendered
 *   HTML matches; the signed-in state appears right after hydration).
 * - Instant updates everywhere when auth state changes (the provider
 *   context derives from this snapshot, so the navbar re-renders
 *   immediately on sign-in/out).
 * - Cross-tab sync for free via the `storage` event.
 *
 * No `setState`-in-effect anywhere (`react-hooks` lint rule compliant).
 */

const STORAGE_KEY = "wedplan.auth";

export type UserRole = "vendor" | "customer";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role?: UserRole;
};

export type StoredSession = {
  token: string;
  user: AuthUser;
};

function isAuthUser(value: unknown): value is AuthUser {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as AuthUser).id === "string" &&
    typeof (value as AuthUser).name === "string" &&
    typeof (value as AuthUser).email === "string"
  );
}

function readSession(): StoredSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredSession | null;
    if (!parsed || typeof parsed.token !== "string" || !isAuthUser(parsed.user)) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    // Corrupted JSON, storage disabled/private mode, etc.
    return null;
  }
}

// Evaluated once per environment: `null` on the server, the restored
// session in the browser.
let snapshot: StoredSession | null = readSession();
const listeners = new Set<() => void>();

function handleStorageEvent(event: StorageEvent) {
  // `key === null` means the whole storage was cleared (another tab signing
  // out). Only react to our own key otherwise.
  if (event.key !== STORAGE_KEY && event.key !== null) return;

  snapshot = readSession();
  listeners.forEach((listener) => listener());
}

/** Subscribe to session changes (same tab writes + other tabs). */
export function subscribeToSession(listener: () => void): () => void {
  listeners.add(listener);

  if (typeof window !== "undefined" && listeners.size === 1) {
    window.addEventListener("storage", handleStorageEvent);
  }

  return () => {
    listeners.delete(listener);

    if (typeof window !== "undefined" && listeners.size === 0) {
      window.removeEventListener("storage", handleStorageEvent);
    }
  };
}

/** Current session snapshot (client). Reference-stable between writes. */
export function getSessionSnapshot(): StoredSession | null {
  return snapshot;
}

/** Snapshot used during server rendering & hydration (always signed out). */
export function getSessionServerSnapshot(): StoredSession | null {
  return null;
}

/** Persist/overwrite the session and notify every subscriber. */
export function writeSession(session: StoredSession | null): void {
  snapshot = session;

  if (typeof window !== "undefined") {
    try {
      if (session) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Storage full/disabled - keep the in-memory session for this tab.
    }
  }

  listeners.forEach((listener) => listener());
}

/** Convenience for the API client: attach the bearer token if any. */
export function getSessionToken(): string | null {
  return snapshot?.token ?? null;
}

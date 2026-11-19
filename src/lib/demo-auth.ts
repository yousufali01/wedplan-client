/**
 * Frontend-only credential store used while the Express/Better Auth
 * backend is not wired up yet.
 *
 * Accounts created on the Sign Up page are persisted in `localStorage`
 * ("wedplan.users") so the Sign In page can demonstrate credential login
 * and role-based redirects end-to-end. Passwords are stored as SHA-256
 * hashes — never as plain text.
 *
 * When the backend authentication module lands, `verifyDemoCredentials`
 * is replaced by the real `POST /api/auth/login` call and this file is
 * deleted. Nothing else in the app depends on it.
 */

import type { UserRole } from "@/lib/auth-session";

const STORAGE_KEY = "wedplan.users";
const encoder = new TextEncoder();

export type DemoAccount = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatarUrl?: string;
};

export type VerifyCredentialsResult =
  | { ok: true; user: DemoAccount }
  | { ok: false; reason: "not-found" | "wrong-password" };

async function hashPassword(password: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(password));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function isDemoAccount(value: unknown): value is DemoAccount {
  if (typeof value !== "object" || value === null) return false;

  const account = value as DemoAccount;

  return (
    typeof account.id === "string" &&
    typeof account.name === "string" &&
    typeof account.email === "string" &&
    typeof account.passwordHash === "string" &&
    (account.role === "vendor" || account.role === "customer")
  );
}

function readAccounts(): DemoAccount[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isDemoAccount) : [];
  } catch {
    // Corrupted JSON, storage disabled/private mode, etc.
    return [];
  }
}

/** Create or overwrite the demo account for `email` (case-insensitive). */
export async function registerDemoAccount(
  input: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    avatarUrl?: string;
  }
): Promise<void> {
  if (typeof window === "undefined") return;

  const email = input.email.trim().toLowerCase();
  const remaining = readAccounts().filter((account) => account.email !== email);

  remaining.push({
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email,
    passwordHash: await hashPassword(input.password),
    role: input.role,
    ...(input.avatarUrl ? { avatarUrl: input.avatarUrl } : {}),
  });

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  } catch {
    // Storage full/disabled — the demo account is simply not persisted.
  }
}

/** Frontend stand-in for `POST /api/auth/login`. */
export async function verifyDemoCredentials(
  email: string,
  password: string
): Promise<VerifyCredentialsResult> {
  const normalized = email.trim().toLowerCase();
  const account = readAccounts().find((entry) => entry.email === normalized);

  if (!account) {
    return { ok: false, reason: "not-found" };
  }

  if ((await hashPassword(password)) !== account.passwordHash) {
    return { ok: false, reason: "wrong-password" };
  }

  return { ok: true, user: account };
}

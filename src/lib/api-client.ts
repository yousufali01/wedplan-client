import { getSessionToken } from "@/lib/auth-session";

/**
 * Small typed wrapper around `fetch` for talking to the WedPlan Express
 * backend. The base URL comes from `NEXT_PUBLIC_API_BASE_URL` (.env) and is
 * inlined at build time.
 */

// Sensible local default so the app still works if someone clones without
// creating .env (matches wedplan-server PORT=5000).
const DEFAULT_BASE_URL = "http://localhost:5000";

export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_BASE_URL;

  return raw.replace(/\/+$/, "");
}

/** Error thrown for any non-2xx response, network failure, or bad payload. */
export class ApiError extends Error {
  /** HTTP status code, or `0` when the server could not be reached at all. */
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type ApiRequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiRequestOptions = {
  method?: ApiRequestMethod;
  /** JSON body - automatically serialized. */
  body?: unknown;
  /** Attach `Authorization: Bearer <token>` explicitly (defaults to the stored session token). */
  token?: string | null;
  signal?: AbortSignal;
};

/**
 * Standard WedPlan server response envelope:
 * everything is returned as `{ success: boolean, message?: string, ...data }`.
 */
export type ApiEnvelope<TData> = TData & {
  success?: boolean;
  message?: string;
};

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;

    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return fallback;
}

function parseJsonBody(response: Response): Promise<unknown> {
  return response
    .json()
    .catch(() => null);
}

export async function apiRequest<TData>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<ApiEnvelope<TData>> {
  const { method = "GET", body, token = getSessionToken(), signal } = options;

  const headers = new Headers({ Accept: "application/json" });
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch {
    // Network failure / DNS error / server not running.
    throw new ApiError(
      "Cannot reach the WedPlan server. Please make sure the backend is running.",
      0
    );
  }

  const isJsonResponse =
    (response.headers.get("content-type") ?? "").includes("application/json");
  const payload: unknown = isJsonResponse ? await parseJsonBody(response) : null;

  if (!response.ok) {
    throw new ApiError(
      extractErrorMessage(payload, `Request failed with status ${response.status}.`),
      response.status
    );
  }

  if (!payload) {
    throw new ApiError("The server returned an unexpected empty response.", response.status);
  }

  return payload as ApiEnvelope<TData>;
}

import { authClient } from "@/lib/auth-client";

const getApiUrl = () => {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:5000"
  );
};

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let token: string | undefined;

  try {
    const { data } = await authClient.token();
    if (data?.token) {
      token = data.token;
    }
  } catch {
    // Session cookie will still be included via credentials: "include"
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const response = await fetch(`${getApiUrl()}${endpoint}`, {
    ...options,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(result?.message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

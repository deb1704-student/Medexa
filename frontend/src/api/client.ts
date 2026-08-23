/**
 * Deliberately thin. The real safety net here isn't this file — it's that
 * `npm run gen:types` regenerates src/generated/api-types.ts directly from
 * FastAPI's live OpenAPI schema. If the backend renames a field or changes
 * a type, this becomes a TypeScript compile error, not a runtime bug
 * discovered during a demo. See Build Guide Section 7 / Section 8 Stage C.
 */

const BASE_URL = "/api"; // proxied to FastAPI in dev, see vite.config.ts

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, text);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function getToken(): string | null {
  return localStorage.getItem("auth_token");
}

export const apiClient = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};

export { ApiError };

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
export const MEDIA_HOST = API_URL.replace(/\/api\/v1$/, "");
const TOKEN_KEY = "binit_token";

export class ApiError extends Error {
  code: string;
  status: number;
  details: Record<string, unknown>;
  constructor(message: string, code = "API_ERROR", status = 400, details: Record<string, unknown> = {}) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function mediaUrl(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${MEDIA_HOST}${path}`;
}

export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!(init.body instanceof FormData) && !headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  let json: { success?: boolean; data?: T; error?: { code?: string; message?: string; details?: Record<string, unknown> } };
  try {
    json = await res.json();
  } catch {
    throw new ApiError(`Request failed (${res.status})`, "HTTP_ERROR", res.status);
  }
  if (!res.ok || json?.success === false) {
    throw new ApiError(
      json?.error?.message || `Request failed (${res.status})`,
      json?.error?.code || "API_ERROR",
      res.status,
      json?.error?.details || {},
    );
  }
  return json.data as T;
}
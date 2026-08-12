import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "@/api/session";
import type { ApiErrorBody, AuthResult } from "@/types/api";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://www.mavirotamarine.com/api/v1";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function rawRequest<T>(path: string, init: RequestInit, accessToken: string | null): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const errBody = body as ApiErrorBody | null;
    throw new ApiError(errBody?.error?.message ?? "Beklenmeyen bir hata oluştu.", res.status, errBody?.error?.details);
  }

  return (body as { data: T }).data;
}

// 401 alınırsa refresh token ile bir kez daha denenir; API'nin auth/refresh
// rotasyon davranışıyla (mavirotamarine-site src/modules/auth/service.ts) uyumlu.
async function refreshSession(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const result = await rawRequest<AuthResult>(
      "/auth/refresh",
      { method: "POST", body: JSON.stringify({ refreshToken }) },
      null
    );
    await saveTokens(result.accessToken, result.refreshToken);
    return result.accessToken;
  } catch {
    await clearTokens();
    return null;
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let accessToken = await getAccessToken();

  try {
    return await rawRequest<T>(path, init, accessToken);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      accessToken = await refreshSession();
      if (accessToken) {
        return rawRequest<T>(path, init, accessToken);
      }
    }
    throw error;
  }
}

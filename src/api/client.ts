import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "@/api/session";
import type { ApiErrorBody, AuthResult } from "@/types/api";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://www.mavirotamarine.com/api/v1";

// Yuklenen medya (/uploads/...) API'nin kendisinde degil, sitenin kokunde
// serve ediliyor — BASE_URL'deki /api/v1 son ekini atip host'u ayikliyoruz.
export const API_ORIGIN = BASE_URL.replace(/\/api\/v1\/?$/, "");

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// AuthContext bunu abone olup oturumun (refresh de dahil) tamamen geçersiz
// hale geldiği anı öğrenir ve kullanıcıyı Login ekranına düşürür — apiRequest
// React dışında çalıştığı için context state'ini doğrudan güncelleyemez.
type AuthFailureListener = () => void;
const authFailureListeners = new Set<AuthFailureListener>();

export function onAuthFailure(listener: AuthFailureListener): () => void {
  authFailureListeners.add(listener);
  return () => authFailureListeners.delete(listener);
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
// Eşzamanlı birden fazla istek aynı anda 401 alırsa (ör. bir ekranın
// Promise.all ile attığı paralel çağrılar) hepsi TEK bir refresh çağrısını
// paylaşır — aksi halde ikinci çağrı, ilki tarafından zaten rotasyona
// uğratılmış (tüketilmiş) refresh token'ı kullanmaya çalışıp haksız yere
// oturumu sonlandırırdı.
let inFlightRefresh: Promise<string | null> | null = null;

async function refreshSession(): Promise<string | null> {
  if (inFlightRefresh) return inFlightRefresh;

  inFlightRefresh = (async () => {
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
  })();

  try {
    return await inFlightRefresh;
  } finally {
    inFlightRefresh = null;
  }
}

async function rawUpload<T>(path: string, formData: FormData, accessToken: string | null): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    // Content-Type kasitli olarak set edilmiyor — fetch, FormData govdesi icin
    // dogru multipart boundary'yi kendisi ekliyor; biz set edersek bozulur.
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    body: formData,
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const errBody = body as ApiErrorBody | null;
    throw new ApiError(errBody?.error?.message ?? "Beklenmeyen bir hata oluştu.", res.status, errBody?.error?.details);
  }

  return (body as { data: T }).data;
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  let accessToken = await getAccessToken();

  try {
    return await rawUpload<T>(path, formData, accessToken);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      accessToken = await refreshSession();
      if (accessToken) {
        return rawUpload<T>(path, formData, accessToken);
      }
      authFailureListeners.forEach((listener) => listener());
    }
    throw error;
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
      // Refresh de basarisiz oldu: oturum gercekten bitti, dinleyicileri
      // (AuthContext) haberdar et ki kullanici Login ekranina dussun.
      authFailureListeners.forEach((listener) => listener());
    }
    throw error;
  }
}

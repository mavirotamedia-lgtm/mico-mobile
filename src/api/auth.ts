import { apiRequest } from "@/api/client";
import { clearTokens, getRefreshToken, saveTokens } from "@/api/session";
import type { AuthResult, PublicUser } from "@/types/api";

export async function login(email: string, password: string): Promise<PublicUser> {
  const result = await apiRequest<AuthResult>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  await saveTokens(result.accessToken, result.refreshToken);
  return result.user;
}

export async function register(input: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  acceptedTerms: true;
}): Promise<PublicUser> {
  const result = await apiRequest<AuthResult>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
  await saveTokens(result.accessToken, result.refreshToken);
  return result.user;
}

export async function me(): Promise<PublicUser> {
  return apiRequest<PublicUser>("/auth/me");
}

export async function loginWithGoogle(idToken: string): Promise<PublicUser> {
  const result = await apiRequest<AuthResult>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
  await saveTokens(result.accessToken, result.refreshToken);
  return result.user;
}

export async function loginWithApple(
  identityToken: string,
  fullName?: { givenName?: string | null; familyName?: string | null }
): Promise<PublicUser> {
  const result = await apiRequest<AuthResult>("/auth/apple", {
    method: "POST",
    body: JSON.stringify({ identityToken, fullName }),
  });
  await saveTokens(result.accessToken, result.refreshToken);
  return result.user;
}

export async function updateMyProfile(input: { avatarUrl?: string | null; name?: string; phone?: string | null }): Promise<PublicUser> {
  return apiRequest<PublicUser>("/auth/me", { method: "PATCH", body: JSON.stringify(input) });
}

export async function logout(): Promise<void> {
  const refreshToken = await getRefreshToken();
  await apiRequest("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  }).catch(() => {});
  await clearTokens();
}

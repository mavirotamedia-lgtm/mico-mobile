import { apiRequest } from "@/api/client";
import type { Craftsman, CraftsmanSpecialty, Paginated } from "@/types/mico";

export async function listCraftsmen(
  filters: { city?: string; specialty?: CraftsmanSpecialty; lat?: number; lng?: number } = {}
) {
  const params = new URLSearchParams();
  if (filters.city) params.set("city", filters.city);
  if (filters.specialty) params.set("specialty", filters.specialty);
  if (filters.lat !== undefined) params.set("lat", String(filters.lat));
  if (filters.lng !== undefined) params.set("lng", String(filters.lng));
  const qs = params.toString();
  return apiRequest<Paginated<Craftsman>>(`/craftsmen${qs ? `?${qs}` : ""}`);
}

export async function getCraftsman(id: string) {
  return apiRequest<Craftsman>(`/craftsmen/${id}`);
}

export async function getMyCraftsmanProfile() {
  return apiRequest<Craftsman>("/craftsmen/me");
}

export async function updateMyCraftsmanProfile(input: { avatar?: string }) {
  return apiRequest<Craftsman>("/craftsmen/me", { method: "PATCH", body: JSON.stringify(input) });
}

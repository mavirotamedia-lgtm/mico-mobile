import { apiRequest } from "@/api/client";
import type { Craftsman, CraftsmanSpecialty, Paginated } from "@/types/mico";

export async function listCraftsmen(filters: { city?: string; specialty?: CraftsmanSpecialty } = {}) {
  const params = new URLSearchParams();
  if (filters.city) params.set("city", filters.city);
  if (filters.specialty) params.set("specialty", filters.specialty);
  const qs = params.toString();
  return apiRequest<Paginated<Craftsman>>(`/craftsmen${qs ? `?${qs}` : ""}`);
}

export async function getCraftsman(id: string) {
  return apiRequest<Craftsman>(`/craftsmen/${id}`);
}

export async function getMyCraftsmanProfile() {
  return apiRequest<Craftsman>("/craftsmen/me");
}

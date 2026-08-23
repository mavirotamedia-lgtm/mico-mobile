import { apiRequest } from "@/api/client";
import type { Favorite, FavoriteTargetType, Paginated } from "@/types/mico";

export async function listFavorites(targetType?: FavoriteTargetType) {
  const qs = targetType ? `?targetType=${targetType}` : "";
  return apiRequest<Paginated<Favorite>>(`/favorites${qs}`);
}

export async function addFavorite(targetType: FavoriteTargetType, targetId: string) {
  return apiRequest<Favorite>("/favorites", { method: "POST", body: JSON.stringify({ targetType, targetId }) });
}

export async function removeFavorite(targetType: FavoriteTargetType, targetId: string) {
  return apiRequest<{ success: boolean }>("/favorites", { method: "DELETE", body: JSON.stringify({ targetType, targetId }) });
}

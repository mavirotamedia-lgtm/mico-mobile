import { apiRequest } from "@/api/client";
import type { AppNotification, Paginated } from "@/types/mico";

export async function listNotifications() {
  return apiRequest<Paginated<AppNotification>>("/notifications");
}

export async function markAsRead(id: string) {
  return apiRequest<AppNotification>(`/notifications/${id}/read`, { method: "POST" });
}

export async function markAllAsRead() {
  return apiRequest<{ success: true }>("/notifications/read-all", { method: "POST" });
}

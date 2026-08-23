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

export async function registerPushToken(token: string, platform: "IOS" | "ANDROID") {
  return apiRequest<{ id: string }>("/notifications/push-tokens", {
    method: "POST",
    body: JSON.stringify({ token, platform }),
  });
}

export async function removePushToken(token: string) {
  return apiRequest<{ success: boolean }>(`/notifications/push-tokens/${encodeURIComponent(token)}`, {
    method: "DELETE",
  });
}

import { apiRequest } from "@/api/client";
import type { BlockedUser } from "@/types/mico";

export async function blockUser(blockedUserId: string) {
  return apiRequest<{ success: boolean }>("/blocks", { method: "POST", body: JSON.stringify({ blockedUserId }) });
}

export async function unblockUser(blockedUserId: string) {
  return apiRequest<{ success: boolean }>("/blocks", { method: "DELETE", body: JSON.stringify({ blockedUserId }) });
}

export async function listBlockedUsers() {
  return apiRequest<{ items: BlockedUser[] }>("/blocks");
}

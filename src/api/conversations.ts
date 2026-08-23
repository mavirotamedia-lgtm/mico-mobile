import { apiRequest } from "@/api/client";
import type { Conversation, Message, Paginated } from "@/types/mico";

export async function listMyConversations() {
  return apiRequest<Paginated<Conversation>>("/conversations");
}

export async function getOrCreateConversation(otherUserId: string) {
  return apiRequest<Conversation>("/conversations", { method: "POST", body: JSON.stringify({ otherUserId }) });
}

export async function listMessages(conversationId: string) {
  return apiRequest<Paginated<Message>>(`/conversations/${conversationId}/messages`);
}

export async function sendMessage(conversationId: string, input: { body?: string; imageUrl?: string }) {
  return apiRequest<Message>(`/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function markConversationAsRead(conversationId: string) {
  return apiRequest<{ updatedCount: number }>(`/conversations/${conversationId}/read`, { method: "POST" });
}

export async function sendTypingSignal(conversationId: string) {
  return apiRequest<{ success: boolean }>(`/conversations/${conversationId}/typing`, { method: "POST" });
}

export async function getTypingStatus(conversationId: string) {
  return apiRequest<{ isTyping: boolean }>(`/conversations/${conversationId}/typing`);
}

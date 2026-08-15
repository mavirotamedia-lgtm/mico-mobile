import { apiRequest } from "@/api/client";
import type { Paginated, ServiceOffer } from "@/types/mico";

export async function listOffersForRequest(serviceRequestId: string) {
  return apiRequest<Paginated<ServiceOffer>>(`/service-requests/${serviceRequestId}/offers`);
}

export async function acceptOffer(offerId: string) {
  return apiRequest<ServiceOffer>(`/offers/${offerId}/accept`, { method: "POST" });
}

// Usta tarafı: bir servis talebine teklif gönderir.
export async function submitOffer(serviceRequestId: string, input: { message?: string; priceEstimate?: number }) {
  return apiRequest<ServiceOffer>(`/service-requests/${serviceRequestId}/offers`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

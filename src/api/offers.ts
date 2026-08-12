import { apiRequest } from "@/api/client";
import type { Paginated, ServiceOffer } from "@/types/mico";

export async function listOffersForRequest(serviceRequestId: string) {
  return apiRequest<Paginated<ServiceOffer>>(`/service-requests/${serviceRequestId}/offers`);
}

export async function acceptOffer(offerId: string) {
  return apiRequest<ServiceOffer>(`/offers/${offerId}/accept`, { method: "POST" });
}

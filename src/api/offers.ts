import { apiRequest } from "@/api/client";
import type { ServiceOffer } from "@/types/mico";

// Not: backend bu uc noktada sayfalama uygulamiyor (paginate() kullanilmiyor),
// duz bir dizi donuyor — Paginated<T> ile karistirilmamali.
export async function listOffersForRequest(serviceRequestId: string) {
  return apiRequest<ServiceOffer[]>(`/service-requests/${serviceRequestId}/offers`);
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

import { apiRequest } from "@/api/client";
import type { CreateServiceRequestInput, Paginated, ServiceRequest } from "@/types/mico";

export async function listMyServiceRequests() {
  return apiRequest<Paginated<ServiceRequest>>("/service-requests");
}

export async function getServiceRequest(id: string) {
  return apiRequest<ServiceRequest>(`/service-requests/${id}`);
}

export async function createServiceRequest(input: CreateServiceRequestInput) {
  return apiRequest<ServiceRequest>("/service-requests", { method: "POST", body: JSON.stringify(input) });
}

export async function cancelServiceRequest(id: string) {
  return apiRequest<ServiceRequest>(`/service-requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "CANCELLED" }),
  });
}

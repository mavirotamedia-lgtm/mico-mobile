import { apiRequest } from "@/api/client";
import type { CreateMaintenanceInput, MaintenanceRecord } from "@/types/api";

export async function listMaintenance(boatId: string): Promise<MaintenanceRecord[]> {
  return apiRequest<MaintenanceRecord[]>(`/boats/${boatId}/maintenance`);
}

export async function addMaintenance(
  boatId: string,
  input: CreateMaintenanceInput
): Promise<MaintenanceRecord> {
  return apiRequest<MaintenanceRecord>(`/boats/${boatId}/maintenance`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateMaintenance(
  id: string,
  input: Partial<CreateMaintenanceInput>
): Promise<MaintenanceRecord> {
  return apiRequest<MaintenanceRecord>(`/maintenance/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteMaintenance(id: string): Promise<void> {
  await apiRequest(`/maintenance/${id}`, { method: "DELETE" });
}

import { apiRequest } from "@/api/client";
import type { Boat, CreateBoatInput } from "@/types/api";

export async function listBoats(): Promise<Boat[]> {
  return apiRequest<Boat[]>("/boats");
}

export async function getBoat(id: string): Promise<Boat> {
  return apiRequest<Boat>(`/boats/${id}`);
}

export async function createBoat(input: CreateBoatInput): Promise<Boat> {
  return apiRequest<Boat>("/boats", { method: "POST", body: JSON.stringify(input) });
}

export async function updateBoat(id: string, input: Partial<CreateBoatInput>): Promise<Boat> {
  return apiRequest<Boat>(`/boats/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function deleteBoat(id: string): Promise<void> {
  await apiRequest(`/boats/${id}`, { method: "DELETE" });
}

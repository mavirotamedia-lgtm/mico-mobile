import { apiRequest } from "@/api/client";
import type { CreateReportInput } from "@/types/mico";

export async function createReport(input: CreateReportInput) {
  return apiRequest<{ id: string }>("/reports", { method: "POST", body: JSON.stringify(input) });
}

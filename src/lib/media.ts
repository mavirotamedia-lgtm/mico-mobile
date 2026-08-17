import { API_ORIGIN } from "@/api/client";

/** Backend'den gelen goreli medya yollarini (/uploads/...) mutlak URL'ye cevirir. */
export function resolveMediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^(https?:|blob:|data:|file:)/.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}

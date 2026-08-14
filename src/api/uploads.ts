import { apiUpload } from "@/api/client";

function guessMimeType(uri: string): string {
  const match = /\.(\w+)$/.exec(uri.split("?")[0]);
  const ext = match ? match[1].toLowerCase() : "jpg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

/** Cihazdaki bir gorseli (image picker uri'si) sunucuya yukler, kalici URL doner. */
export async function uploadImage(uri: string): Promise<string> {
  const filename = uri.split("/").pop() || `foto-${Date.now()}.jpg`;
  const formData = new FormData();
  formData.append("file", { uri, name: filename, type: guessMimeType(uri) } as unknown as Blob);

  const result = await apiUpload<{ url: string }>("/uploads", formData);
  return result.url;
}

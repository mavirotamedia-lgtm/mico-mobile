import { Platform } from "react-native";
import { apiUpload } from "@/api/client";

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/avif": "avif",
};

function guessMimeType(uri: string): string {
  const match = /\.(\w+)$/.exec(uri.split("?")[0]);
  const ext = match ? match[1].toLowerCase() : "jpg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

/**
 * Cihazdaki bir gorseli (image picker uri'si) sunucuya yukler, kalici URL doner.
 * `mimeType` ImagePicker asset'inden geliyorsa (ör. asset.mimeType) tercihen o
 * gecilmeli — ozellikle web'de blob: URI'lerin adinda uzanti olmuyor, dosya
 * uzantisiz kaydedilirse sunucu onu servis edemiyor (bkz. src/app/uploads).
 */
export async function uploadImage(uri: string, mimeType?: string): Promise<string> {
  const resolvedType = mimeType || guessMimeType(uri);
  const ext = EXT_BY_MIME[resolvedType] ?? "jpg";
  const rawName = uri.split("/").pop()?.split("?")[0] || `foto-${Date.now()}`;
  const filename = rawName.includes(".") ? rawName : `${rawName}.${ext}`;

  const formData = new FormData();

  if (Platform.OS === "web") {
    // Native'de {uri,name,type} objesi fetch polyfill'i tarafindan ozel olarak
    // okunup dosyaya cevriliyor; web'de FormData gercek bir Blob/File bekliyor,
    // aksi halde alan sunucuya bos/gecersiz gidiyor.
    const blob = await fetch(uri).then((res) => res.blob());
    formData.append("file", blob, filename);
  } else {
    formData.append("file", { uri, name: filename, type: resolvedType } as unknown as Blob);
  }

  const result = await apiUpload<{ url: string }>("/uploads", formData);
  return result.url;
}

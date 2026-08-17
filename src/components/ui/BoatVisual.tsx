import { Image, type StyleProp, type ImageStyle } from "react-native";
import type { BoatType } from "@/types/api";
import { resolveMediaUrl } from "@/lib/media";

const BOAT_TYPE_IMAGES: Record<BoatType, string> = {
  SAILBOAT: "https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=800&q=70",
  MOTORBOAT: "https://images.unsplash.com/photo-1568476612160-787b6a1d5fb1?w=800&q=70",
  YACHT: "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&q=70",
  OTHER: "https://images.unsplash.com/photo-1575658075190-c7b80d4a5e77?w=800&q=70",
};

type Props = {
  image?: string | null;
  type: BoatType;
  style?: StyleProp<ImageStyle>;
};

/** Tekne fotografi varsa onu, yoksa tekne tipine uygun bir gorseli gosterir. */
export function BoatVisual({ image, type, style }: Props) {
  return <Image source={{ uri: resolveMediaUrl(image) || BOAT_TYPE_IMAGES[type] }} style={style} resizeMode="cover" />;
}

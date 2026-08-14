import { Image, StyleSheet, type StyleProp, type ImageStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { palette } from "@/theme/tokens";
import { BoatTypeIcon } from "@/components/ui/BoatTypeIcon";
import type { BoatType } from "@/types/api";

type Props = {
  image?: string | null;
  type: BoatType;
  style?: StyleProp<ImageStyle>;
  iconSize?: number;
};

/**
 * Tekne fotografi varsa onu gosterir; yoksa tekne tipine gore ozel cizgi-ikon
 * iceren markali bir panel gosterir — alakasiz bir stok fotograf yerine
 * durust bir "gorsel yok" durumu.
 */
export function BoatVisual({ image, type, style, iconSize = 48 }: Props) {
  if (image) {
    return <Image source={{ uri: image }} style={style} resizeMode="cover" />;
  }

  return (
    <LinearGradient colors={[palette.navy900, palette.navy700]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[style, styles.center]}>
      <BoatTypeIcon type={type} size={iconSize} color={palette.white} accentColor={palette.gold300} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
});

import { useEffect, useRef } from "react";
import { Animated, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { radius as radiusToken } from "@/theme/tokens";

type Props = {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Icerik seklini taklit eden nabiz-animasyonlu yer tutucu — duz spinner yerine. */
export function Skeleton({ width = "100%", height = 16, radius = radiusToken.sm, style }: Props) {
  const { theme } = useTheme();
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: theme.surfaceAlt, opacity: pulse }, style]}
    />
  );
}

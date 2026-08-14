import Svg, { Path, Circle } from "react-native-svg";
import type { BoatType } from "@/types/api";

type Props = {
  type: BoatType;
  size?: number;
  color?: string;
  accentColor?: string;
};

/** Fotografi olmayan tekneler icin tipe gore cizgi-ikon (yatmarin.com'daki kategori ikonlarindan ilham alindi). */
export function BoatTypeIcon({ type, size = 64, color = "#FFFFFF", accentColor = "#E0C25F" }: Props) {
  const stroke = { stroke: color, strokeWidth: 3.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" as const };

  if (type === "SAILBOAT") {
    return (
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Path d="M50 12 L50 62" {...stroke} />
        <Path d="M50 16 L76 58 L50 58 Z" fill={accentColor} />
        <Path d="M50 26 L32 58 L50 58 Z" {...stroke} strokeWidth={3} opacity={0.85} />
        <Path d="M14 66 Q50 82 86 66 Q80 78 62 80 L38 80 Q20 78 14 66 Z" {...stroke} />
      </Svg>
    );
  }

  if (type === "MOTORBOAT") {
    return (
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Path d="M20 56 L28 40 Q30 36 35 36 L58 36 Q62 36 63 40 L66 56 Z" {...stroke} />
        <Path d="M40 36 L40 24 Q40 21 43 21 L52 21 Q55 21 55 24 L55 36" {...stroke} strokeWidth={3.2} />
        <Path d="M10 62 Q50 80 90 62 Q82 74 66 76 L34 76 Q18 74 10 62 Z" {...stroke} />
      </Svg>
    );
  }

  if (type === "YACHT") {
    return (
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Path
          d="M22 58 L22 34 Q22 31 25 31 L44 31 L44 22 Q44 19 47 19 L58 19 Q61 19 61 22 L61 31 L72 31 Q75 31 75 34 L75 58"
          {...stroke}
          strokeWidth={3.3}
        />
        <Circle cx={33} cy={44} r={2.6} fill={accentColor} />
        <Circle cx={47} cy={44} r={2.6} fill={accentColor} />
        <Circle cx={63} cy={44} r={2.6} fill={accentColor} />
        <Path d="M10 62 Q50 82 90 62 Q82 76 64 78 L36 78 Q18 76 10 62 Z" {...stroke} />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M18 54 Q18 66 32 68 L68 68 Q82 66 82 54" {...stroke} />
      <Path d="M18 54 L26 40 Q28 37 32 37 L68 37 Q72 37 74 40 L82 54" {...stroke} strokeWidth={3.3} />
      <Path d="M50 37 L50 54 M35 45 L65 45" stroke={color} strokeWidth={2.4} strokeLinecap="round" opacity={0.55} />
    </Svg>
  );
}

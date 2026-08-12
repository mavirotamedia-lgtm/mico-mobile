import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { typography } from "@/theme/tokens";

type Variant = keyof typeof VARIANT_STYLES;
type Weight = "regular" | "medium" | "semibold" | "bold" | "extrabold";

const VARIANT_STYLES = {
  display: typography.display,
  h1: typography.h1,
  h2: typography.h2,
  body: typography.body,
  bodySmall: typography.bodySmall,
  caption: typography.caption,
};

type Props = RNTextProps & {
  variant?: Variant;
  weight?: Weight;
  color?: "primary" | "secondary" | "onDark" | "onDarkMuted" | "accent" | "danger" | "success";
};

export function Text({ variant = "body", weight, color = "primary", style, ...rest }: Props) {
  const { theme } = useTheme();

  const colorMap = {
    primary: theme.textPrimary,
    secondary: theme.textSecondary,
    onDark: theme.textOnDark,
    onDarkMuted: theme.textOnDarkMuted,
    accent: theme.accent,
    danger: theme.danger,
    success: theme.success,
  };

  const defaultWeight: Weight = variant === "display" || variant === "h1" ? "bold" : variant === "h2" ? "semibold" : "regular";
  const resolvedWeight = weight ?? defaultWeight;

  return (
    <RNText
      style={[
        VARIANT_STYLES[variant],
        { fontFamily: typography.fontFamily[resolvedWeight], color: colorMap[color] },
        style,
      ]}
      {...rest}
    />
  );
}

import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import { Text } from "@/components/ui/Text";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Koyu, sabit bir zemin üzerinde (ör. Splash hero) kullanılırken true —
   * secondary/ghost varyantları theme.primary yerine beyaz tonlarını kullanır,
   * aksi halde koyu üstüne koyu metin görünmez olurdu. */
  inverted?: boolean;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  icon,
  fullWidth = true,
  style,
  inverted,
}: Props) {
  const { theme } = useTheme();
  const isDisabled = disabled || loading;
  const accentOnSurface = inverted ? "#FFFFFF" : theme.primary;

  const backgrounds: Record<Variant, string> = {
    primary: inverted ? "#FFFFFF" : theme.primary,
    secondary: "transparent",
    ghost: "transparent",
    danger: theme.danger,
  };
  const borders: Record<Variant, string | undefined> = {
    primary: undefined,
    secondary: accentOnSurface,
    ghost: undefined,
    danger: undefined,
  };
  const textColors: Record<Variant, string> = {
    primary: inverted ? theme.primary : theme.onPrimary,
    secondary: accentOnSurface,
    ghost: accentOnSurface,
    danger: theme.onPrimary,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        size === "lg" ? styles.lg : styles.md,
        {
          backgroundColor: backgrounds[variant],
          borderColor: borders[variant],
          borderWidth: borders[variant] ? 1.5 : 0,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColors[variant]} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={textColors[variant]} style={{ marginRight: spacing.xs }} /> : null}
          <Text variant="body" weight="semibold" style={{ color: textColors[variant] }}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
  },
  md: { paddingVertical: 13, paddingHorizontal: spacing.lg },
  lg: { paddingVertical: 16, paddingHorizontal: spacing.xl },
});

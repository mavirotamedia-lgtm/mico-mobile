import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import { Text } from "@/components/ui/Text";

type Tone = "success" | "warning" | "danger" | "neutral" | "accent";

export function Badge({
  label,
  tone = "neutral",
  icon,
}: {
  label: string;
  tone?: Tone;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const { theme } = useTheme();

  const tones: Record<Tone, { bg: string; fg: string }> = {
    success: { bg: theme.successBg, fg: theme.success },
    warning: { bg: theme.warningBg, fg: theme.warning },
    danger: { bg: theme.dangerBg, fg: theme.danger },
    accent: { bg: theme.mode === "dark" ? "rgba(201,162,39,0.18)" : "#FBF3DC", fg: theme.mode === "dark" ? theme.accent : "#8A6D14" },
    neutral: { bg: theme.surfaceAlt, fg: theme.textSecondary },
  };

  return (
    <View style={[styles.base, { backgroundColor: tones[tone].bg }]}>
      {icon ? <Ionicons name={icon} size={11} color={tones[tone].fg} style={{ marginRight: 3 }} /> : null}
      <Text variant="caption" weight="semibold" style={{ color: tones[tone].fg }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
});

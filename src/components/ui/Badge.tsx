import { View, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import { Text } from "@/components/ui/Text";

type Tone = "success" | "warning" | "danger" | "neutral" | "accent";

export function Badge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
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
      <Text variant="caption" weight="semibold" style={{ color: tones[tone].fg }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
});

import { View, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeContext";
import { spacing } from "@/theme/tokens";
import { Text } from "@/components/ui/Text";

type Props = {
  title: string;
  onBack?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  transparent?: boolean;
};

export function Header({ title, onBack, rightIcon, onRightPress, transparent }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + spacing.xs,
          backgroundColor: transparent ? "transparent" : theme.background,
          borderBottomColor: transparent ? "transparent" : theme.border,
          borderBottomWidth: transparent ? 0 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={styles.side}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={10} style={[styles.iconBtn, { backgroundColor: theme.surfaceAlt }]}>
            <Ionicons name="chevron-back" size={20} color={theme.textPrimary} />
          </Pressable>
        ) : null}
      </View>

      <Text
        variant="h2"
        weight="extrabold"
        numberOfLines={1}
        color={transparent ? "onDark" : "primary"}
        style={styles.title}
      >
        {title}
      </Text>

      <View style={[styles.side, { alignItems: "flex-end" }]}>
        {rightIcon ? (
          <Pressable
            onPress={onRightPress}
            hitSlop={10}
            style={[
              styles.iconBtn,
              { backgroundColor: transparent ? "rgba(255,255,255,0.14)" : theme.surfaceAlt },
            ]}
          >
            <Ionicons name={rightIcon} size={20} color={transparent ? theme.textOnDark : theme.textPrimary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  side: { width: 40 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { flex: 1, textAlign: "center" },
});

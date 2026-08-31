import { View, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeContext";
import { spacing } from "@/theme/tokens";
import { Text } from "@/components/ui/Text";

type RightAction = { icon: keyof typeof Ionicons.glyphMap; onPress: () => void };

type Props = {
  title: string;
  onBack?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  /** Birden fazla sağ aksiyon gerektiğinde (ör. favori + "..." menüsü) rightIcon/onRightPress yerine kullanılır. */
  rightActions?: RightAction[];
  transparent?: boolean;
};

export function Header({ title, onBack, rightIcon, onRightPress, rightActions, transparent }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const actions: RightAction[] = rightActions ?? (rightIcon ? [{ icon: rightIcon, onPress: onRightPress ?? (() => {}) }] : []);

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

      <View style={[styles.side, actions.length > 1 && styles.sideMulti, { alignItems: "flex-end" }]}>
        {actions.map((action, i) => (
          <Pressable
            key={i}
            onPress={action.onPress}
            hitSlop={10}
            style={[
              styles.iconBtn,
              { backgroundColor: transparent ? "rgba(255,255,255,0.14)" : theme.surfaceAlt },
              i > 0 && { marginLeft: spacing.xs },
            ]}
          >
            <Ionicons name={action.icon} size={20} color={transparent ? theme.textOnDark : theme.textPrimary} />
          </Pressable>
        ))}
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
  side: { width: 40, flexDirection: "row" },
  sideMulti: { width: 80 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { flex: 1, textAlign: "center" },
});

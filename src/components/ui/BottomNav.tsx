import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import { Text } from "@/components/ui/Text";
import { Touchable } from "@/components/ui/Touchable";

export type BottomNavItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive?: keyof typeof Ionicons.glyphMap;
};

type Props = {
  items: [BottomNavItem, BottomNavItem, BottomNavItem, BottomNavItem];
  activeKey: string;
  onPress: (key: string) => void;
  onCenterPress: () => void;
};

/** Referans tasarımdaki ortada yükselen, dairesel + FAB'lı 5 öğeli alt navigasyon. */
export function BottomNav({ items, activeKey, onPress, onCenterPress }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [first, second, third, fourth] = items;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.tabBarBg, borderTopColor: theme.border, paddingBottom: insets.bottom || spacing.xs },
      ]}
    >
      <NavButton item={first} active={activeKey === first.key} onPress={onPress} theme={theme} />
      <NavButton item={second} active={activeKey === second.key} onPress={onPress} theme={theme} />

      <Touchable onPress={onCenterPress} style={styles.centerWrapper} hitSlop={8} scaleTo={0.92} haptic>
        <View
          style={[
            styles.centerButton,
            { backgroundColor: theme.primary, shadowColor: theme.shadowColor, borderColor: theme.tabBarBg },
          ]}
        >
          <Ionicons name="add" size={26} color={theme.onPrimary} />
        </View>
      </Touchable>

      <NavButton item={third} active={activeKey === third.key} onPress={onPress} theme={theme} />
      <NavButton item={fourth} active={activeKey === fourth.key} onPress={onPress} theme={theme} />
    </View>
  );
}

function NavButton({
  item,
  active,
  onPress,
  theme,
}: {
  item: BottomNavItem;
  active: boolean;
  onPress: (key: string) => void;
  theme: ReturnType<typeof useTheme>["theme"];
}) {
  const color = active ? theme.primary : theme.tabBarInactive;
  const iconName = active && item.iconActive ? item.iconActive : item.icon;

  return (
    <Touchable onPress={() => onPress(item.key)} style={styles.navButton} hitSlop={6} scaleTo={0.9} haptic>
      <Ionicons name={iconName} size={22} color={color} />
      <Text variant="caption" weight={active ? "semibold" : "medium"} style={{ color, marginTop: 3 }}>
        {item.label}
      </Text>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  navButton: { flex: 1, alignItems: "center" },
  centerWrapper: { flex: 1, alignItems: "center", marginTop: -28 },
  centerButton: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 3,
  },
});

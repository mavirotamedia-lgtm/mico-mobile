import { View, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/theme/ThemeContext";

export function ScreenContainer({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useTheme();
  return <View style={[styles.base, { backgroundColor: theme.background }, style]}>{children}</View>;
}

const styles = StyleSheet.create({ base: { flex: 1 } });

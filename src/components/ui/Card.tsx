import { View, StyleSheet, Pressable, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { radius, spacing } from "@/theme/tokens";

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
};

export function Card({ children, onPress, style, padded = true }: Props) {
  const { theme } = useTheme();

  const content = (
    <View
      style={[
        styles.base,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          padding: padded ? spacing.md : 0,
          shadowColor: theme.shadowColor,
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
});

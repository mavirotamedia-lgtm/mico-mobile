import { useState } from "react";
import { TextInput, View, StyleSheet, Pressable, type TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import { Text } from "@/components/ui/Text";

type Props = TextInputProps & {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
};

export function Input({ label, error, icon, isPassword, style, ...rest }: Props) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(!!isPassword);

  return (
    <View style={{ marginBottom: spacing.sm }}>
      {label ? (
        <Text variant="bodySmall" weight="semibold" color="secondary" style={{ marginBottom: 6 }}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.surface,
            borderColor: error ? theme.danger : isFocused ? theme.primary : theme.border,
          },
        ]}
      >
        {icon ? <Ionicons name={icon} size={18} color={theme.textSecondary} style={{ marginRight: spacing.xs }} /> : null}
        <TextInput
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={isSecure}
          onFocus={(e) => {
            setIsFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            rest.onBlur?.(e);
          }}
          style={[styles.input, { color: theme.textPrimary }, style]}
          {...rest}
        />
        {isPassword ? (
          <Pressable onPress={() => setIsSecure((v) => !v)} hitSlop={8}>
            <Ionicons name={isSecure ? "eye-outline" : "eye-off-outline"} size={18} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" color="danger" style={{ marginTop: 4 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  input: { flex: 1, paddingVertical: 13, fontSize: 15 },
});

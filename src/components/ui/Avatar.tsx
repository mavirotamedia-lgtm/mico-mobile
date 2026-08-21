import { View, Image, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { Text } from "@/components/ui/Text";

type Props = { uri?: string | null; name: string; size?: number };

export function Avatar({ uri, name, size = 44 }: Props) {
  const { theme } = useTheme();
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: theme.surfaceAlt },
      ]}
    >
      <Text variant="body" weight="bold" style={{ fontSize: size * 0.4, lineHeight: size * 0.48 }}>
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: "center", justifyContent: "center" },
});

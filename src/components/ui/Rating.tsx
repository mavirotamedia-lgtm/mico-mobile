import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "@/theme/tokens";
import { Text } from "@/components/ui/Text";

export function Rating({ value, count }: { value: number; count?: number }) {
  return (
    <View style={styles.row}>
      <Ionicons name="star" size={13} color={palette.gold500} />
      <Text variant="caption" weight="semibold" style={{ marginLeft: 3 }}>
        {value.toFixed(1)}
      </Text>
      {count !== undefined ? (
        <Text variant="caption" color="secondary" style={{ marginLeft: 3 }}>
          ({count})
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
});

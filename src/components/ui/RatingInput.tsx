import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "@/theme/tokens";
import { Touchable } from "@/components/ui/Touchable";

type Props = { value: number; onChange: (value: number) => void; size?: number };

export function RatingInput({ value, onChange, size = 36 }: Props) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Touchable key={star} onPress={() => onChange(star)} haptic style={styles.star}>
          <Ionicons name={star <= value ? "star" : "star-outline"} size={size} color={palette.gold500} />
        </Touchable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center" },
  star: { marginHorizontal: 4 },
});

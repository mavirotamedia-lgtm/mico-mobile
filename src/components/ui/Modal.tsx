import { Modal as RNModal, View, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import { Text } from "@/components/ui/Text";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

/** Alt sayfadan yükselen (bottom-sheet) modal — referans tasarımdaki filtre/aksiyon panelleri için. */
export function Modal({ visible, onClose, title, children }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <RNModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          { backgroundColor: theme.surface, paddingBottom: insets.bottom + spacing.md },
        ]}
      >
        <View style={[styles.grabber, { backgroundColor: theme.border }]} />
        {title ? (
          <View style={styles.header}>
            <Text variant="h2" weight="bold">
              {title}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={theme.textSecondary} />
            </Pressable>
          </View>
        ) : null}
        {children}
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(6,15,32,0.55)" },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
});

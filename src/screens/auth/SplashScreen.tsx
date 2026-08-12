import { View, StyleSheet, Image, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTheme } from "@/theme/ThemeContext";
import { palette, spacing } from "@/theme/tokens";
import { Text, Button } from "@/components/ui";
import type { AuthStackParamList } from "@/navigation/RootNavigator";

const BOAT_IMAGE =
  "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=1200&q=70";

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: "construct-outline", label: "Usta & Servis Bul" },
  { icon: "time-outline", label: "Bakım Takibi" },
  { icon: "sparkles-outline", label: "Yapay Zeka Asistanı" },
  { icon: "cart-outline", label: "Market & Yedek Parça" },
  { icon: "boat-outline", label: "İkinci El Pazarı" },
  { icon: "partly-sunny-outline", label: "Hava & Deniz Durumu" },
];

type Props = NativeStackScreenProps<AuthStackParamList, "Splash">;

export function SplashScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 480;

  return (
    <View style={{ flex: 1, backgroundColor: palette.navy950 }}>
      <Image source={{ uri: BOAT_IMAGE }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      {/* Splash, marka anı olarak her zaman koyu hero kullanır — açık/koyu tema
          burada değil, altındaki Login/Register kartında devreye girer. */}
      <LinearGradient
        colors={["rgba(6,15,32,0.35)", "rgba(6,15,32,0.6)", palette.navy950]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={[styles.content, { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xl }]}>
        <View>
          <View style={styles.brandRow}>
            <Ionicons name="boat" size={26} color={theme.accent} />
            <Text variant="display" color="onDark" weight="extrabold" style={{ marginLeft: spacing.xs }}>
              MİÇO
            </Text>
          </View>
          <Text variant="h2" color="onDark" weight="semibold" style={{ marginTop: 4 }}>
            Denizde yalnız değilsin.
          </Text>
        </View>

        <View>
          <Text variant="h1" color="onDark" weight="bold" style={{ marginBottom: spacing.md }}>
            Teknen için her şey tek uygulamada.
          </Text>

          <View style={[styles.featureGrid, isWide && styles.featureGridWide]}>
            {FEATURES.map((f) => (
              <View key={f.label} style={[styles.featureItem, isWide && { width: "48%" }]}>
                <Ionicons name={f.icon} size={16} color={theme.accent} />
                <Text variant="bodySmall" color="onDarkMuted" style={{ marginLeft: spacing.xs, flexShrink: 1 }}>
                  {f.label}
                </Text>
              </View>
            ))}
          </View>

          <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
            <Button label="Kayıt Ol" inverted onPress={() => navigation.navigate("Register")} />
            <Button label="Giriş Yap" variant="secondary" inverted onPress={() => navigation.navigate("Login")} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: "space-between", paddingHorizontal: spacing.xl },
  brandRow: { flexDirection: "row", alignItems: "center" },
  featureGrid: { gap: spacing.sm },
  featureGridWide: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  featureItem: { flexDirection: "row", alignItems: "center" },
});

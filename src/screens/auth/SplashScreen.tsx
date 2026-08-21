import { useEffect, useRef } from "react";
import { Animated, View, StyleSheet, Image } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { palette, radius, spacing } from "@/theme/tokens";
import { Text, Button, Touchable } from "@/components/ui";
import { useAuth } from "@/store/AuthContext";
import type { AuthStackParamList } from "@/navigation/RootNavigator";

// Kesintisiz (crossfade) loop'lu, lacivert tonlara çekilmiş tekne videosu —
// üstte/altta arayüz metinleri için zaten yumuşak koyu gradyanlar gömülü.
const SPLASH_VIDEO = require("../../../assets/video/splash-boat-loop.mp4");

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: "shield-checkmark-outline", label: "Değerlendirilmiş\nUstalar" },
  { icon: "flash-outline", label: "Hızlı\nServis" },
  { icon: "diamond-outline", label: "Tokenle\nGüvende" },
];

type Props = NativeStackScreenProps<AuthStackParamList, "Splash">;

export function SplashScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { continueAsGuest } = useAuth();

  const brandOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(16)).current;

  const player = useVideoPlayer(SPLASH_VIDEO, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    Animated.sequence([
      Animated.timing(brandOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.spring(contentTranslateY, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 4 }),
      ]),
    ]).start();
  }, [brandOpacity, contentOpacity, contentTranslateY]);

  return (
    <View style={{ flex: 1, backgroundColor: palette.navy950 }}>
      {/* Splash, marka anı olarak her zaman koyu hero kullanır — açık/koyu tema
          burada değil, altındaki Login/Register kartında devreye girer.
          Video zaten lacivert tonlara çekilmiş ve üst/alt gradyanları gömülü —
          arayüz metinleri/butonları üstüne binmeden okunur kalıyor. */}
      <VideoView
        player={player}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        nativeControls={false}
        pointerEvents="none"
      />

      <View style={[styles.content, { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xl }]}>
        <Animated.View style={{ opacity: brandOpacity, alignItems: "center" }}>
          <Image source={require("../../../assets/branding/logo-icon.png")} style={styles.logoIcon} resizeMode="contain" />
          <Image source={require("../../../assets/branding/logo-wordmark.png")} style={styles.logoWordmark} resizeMode="contain" />
          <Text variant="body" color="onDark" weight="semibold" style={{ marginTop: spacing.sm }}>
            Denizde <Text color="accent" weight="bold">yalnız</Text> değilsin.
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentTranslateY }], width: "100%" }}>
          <View style={{ gap: spacing.sm }}>
            <Button
              label="Giriş Yap"
              icon="log-in-outline"
              trailingIcon="chevron-forward"
              onPress={() => navigation.navigate("Login")}
              style={styles.heroButton}
            />
            <Button
              label="Hesap Oluştur"
              icon="person-add-outline"
              trailingIcon="chevron-forward"
              onPress={() => navigation.navigate("Register")}
              style={styles.heroButton}
            />
            <Touchable onPress={continueAsGuest} haptic style={styles.guestLink}>
              <Text variant="bodySmall" color="onDark" weight="semibold">
                Misafir olarak devam et
              </Text>
              <Ionicons name="chevron-forward" size={14} color={palette.white} style={{ marginLeft: 2 }} />
            </Touchable>
          </View>

          <View style={styles.featureRow}>
            {FEATURES.map((f) => (
              <View key={f.label} style={styles.featureItem}>
                <View style={styles.featureIconWrap}>
                  <Ionicons name={f.icon} size={18} color={palette.gold300} />
                </View>
                <Text variant="caption" color="onDarkMuted" style={{ textAlign: "center", marginTop: 6 }}>
                  {f.label}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.xl },
  logoIcon: { width: 96, height: 96 },
  logoWordmark: { width: 190, height: 67, marginTop: spacing.sm },
  heroButton: {
    backgroundColor: "rgba(8,20,40,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  guestLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing.xs,
    paddingVertical: spacing.xs,
  },
  featureRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: spacing.lg,
  },
  featureItem: { alignItems: "center", width: 96 },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
});

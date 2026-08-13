import { useEffect, useRef } from "react";
import { Animated, View, StyleSheet, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { palette, spacing } from "@/theme/tokens";
import { Text, Button } from "@/components/ui";
import type { AuthStackParamList } from "@/navigation/RootNavigator";

const BOAT_IMAGE =
  "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=1200&q=70";

type Props = NativeStackScreenProps<AuthStackParamList, "Splash">;

export function SplashScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const brandOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(16)).current;

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
      <Image source={{ uri: BOAT_IMAGE }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      {/* Splash, marka anı olarak her zaman koyu hero kullanır — açık/koyu tema
          burada değil, altındaki Login/Register kartında devreye girer. */}
      <LinearGradient
        colors={["rgba(6,15,32,0.55)", "rgba(6,15,32,0.15)", "rgba(6,15,32,0.55)", palette.navy950]}
        locations={[0, 0.28, 0.7, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={[styles.content, { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xl }]}>
        <Animated.View style={{ opacity: brandOpacity, alignItems: "center" }}>
          <Image source={require("../../../assets/branding/logo-icon.png")} style={styles.logoIcon} resizeMode="contain" />
          <Image source={require("../../../assets/branding/logo-wordmark.png")} style={styles.logoWordmark} resizeMode="contain" />
          <Text variant="body" color="onDark" weight="semibold" style={{ marginTop: spacing.sm }}>
            Denizde yalnız değilsin.
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentTranslateY }], gap: spacing.sm }}>
          <Button label="Giriş Yap" onPress={() => navigation.navigate("Login")} />
          <Button label="Kayıt Ol" inverted onPress={() => navigation.navigate("Register")} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.xl },
  logoIcon: { width: 96, height: 96 },
  logoWordmark: { width: 190, height: 67, marginTop: spacing.sm },
});

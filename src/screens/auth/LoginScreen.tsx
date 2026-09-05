import { useEffect, useRef, useState } from "react";
import { Animated, View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "@/store/AuthContext";
import { useTheme } from "@/theme/ThemeContext";
import { palette, radius, spacing } from "@/theme/tokens";
import { Text, Button, Input } from "@/components/ui";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { haptics } from "@/lib/haptics";
import type { AuthStackParamList } from "@/navigation/RootNavigator";
import { ApiError } from "@/api/client";

const BG_IMAGE = "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=1200&q=70";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(24)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const bgScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.spring(cardTranslateY, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 4 }),
    ]).start();

    // Cok yavas "Ken Burns" zoom — arka plan fotografina hafif bir canlilik
    // katmak icin, dikkat dagitmayacak kadar yavas.
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgScale, { toValue: 1.08, duration: 15000, useNativeDriver: true }),
        Animated.timing(bgScale, { toValue: 1, duration: 15000, useNativeDriver: true }),
      ])
    ).start();
  }, [cardOpacity, cardTranslateY, bgScale]);

  useEffect(() => {
    if (!error) return;
    haptics.error();
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [error, shake]);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Giriş yapılamadı.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.navy950 }}>
      <Animated.Image
        source={{ uri: BG_IMAGE }}
        style={[StyleSheet.absoluteFill, { transform: [{ scale: bgScale }] }]}
        resizeMode="cover"
        blurRadius={2}
      />
      <LinearGradient colors={["rgba(6,15,32,0.65)", "rgba(6,15,32,0.8)"]} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.card,
              { backgroundColor: theme.surface, shadowColor: palette.navy950 },
              {
                opacity: cardOpacity,
                transform: [
                  { translateY: cardTranslateY },
                  { translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }) },
                ],
              },
            ]}
          >
            <View style={styles.brandRow}>
              <Image source={require("../../../assets/branding/logo-icon.png")} style={styles.brandIcon} resizeMode="contain" />
              <Image source={require("../../../assets/branding/logo-wordmark.png")} style={styles.brandWordmark} resizeMode="contain" />
            </View>

            <Text variant="h1" weight="extrabold" style={{ marginTop: spacing.lg, textAlign: "center" }}>
              Hoş geldin!
            </Text>
            <Text variant="bodySmall" color="secondary" style={{ marginTop: 2, marginBottom: spacing.lg, textAlign: "center" }}>
              Devam etmek için giriş yap.
            </Text>

            <Input
              label="E-posta"
              icon="mail-outline"
              placeholder="ornek@mail.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Input
              label="Şifre"
              icon="lock-closed-outline"
              placeholder="••••••••"
              isPassword
              value={password}
              onChangeText={setPassword}
            />

            <Text
              variant="bodySmall"
              weight="semibold"
              color="accent"
              style={{ textAlign: "right", marginBottom: spacing.sm }}
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              Şifremi unuttum?
            </Text>

            {error ? (
              <View style={[styles.errorBanner, { backgroundColor: theme.dangerBg }]}>
                <Ionicons name="alert-circle" size={16} color={theme.danger} />
                <Text variant="bodySmall" weight="semibold" color="danger" style={{ marginLeft: 6, flex: 1 }}>
                  {error}
                </Text>
              </View>
            ) : null}

            <Button
              label="Giriş Yap"
              size="lg"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={!email || !password}
              style={{ marginTop: spacing.xs }}
            />

            <SocialAuthButtons />

            <View style={styles.footerRow}>
              <Text variant="bodySmall" color="secondary">
                Hesabın yok mu?
              </Text>
              <Text
                variant="bodySmall"
                weight="bold"
                color="accent"
                style={{ marginLeft: 6 }}
                onPress={() => navigation.navigate("Register")}
              >
                Kayıt ol
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  card: {
    width: "100%",
    maxWidth: 400,
    borderRadius: radius.xl,
    padding: spacing.xl,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 10,
  },
  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  brandIcon: { width: 32, height: 32 },
  brandWordmark: { width: 78, height: 28, marginLeft: 6 },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  footerRow: { flexDirection: "row", justifyContent: "center", marginTop: spacing.lg },
});

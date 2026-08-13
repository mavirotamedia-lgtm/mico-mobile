import { useState } from "react";
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "@/store/AuthContext";
import { useTheme } from "@/theme/ThemeContext";
import { palette, radius, spacing } from "@/theme/tokens";
import { Text, Button, Input } from "@/components/ui";
import type { AuthStackParamList } from "@/navigation/RootNavigator";
import { ApiError } from "@/api/client";

const BG_IMAGE = "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=1200&q=70";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Kayıt oluşturulamadı.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.navy950 }}>
      <Image source={{ uri: BG_IMAGE }} style={StyleSheet.absoluteFillObject} resizeMode="cover" blurRadius={2} />
      <LinearGradient colors={["rgba(6,15,32,0.65)", "rgba(6,15,32,0.8)"]} style={StyleSheet.absoluteFillObject} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { backgroundColor: theme.surface, shadowColor: palette.navy950 }]}>
            <View style={styles.brandRow}>
              <Image source={require("../../../assets/branding/logo-icon.png")} style={styles.brandIcon} resizeMode="contain" />
              <Image source={require("../../../assets/branding/logo-wordmark.png")} style={styles.brandWordmark} resizeMode="contain" />
            </View>

            <Text variant="h2" weight="bold" style={{ marginTop: spacing.lg, textAlign: "center" }}>
              Aramıza katıl
            </Text>
            <Text variant="bodySmall" color="secondary" style={{ marginTop: 2, marginBottom: spacing.lg, textAlign: "center" }}>
              Teknen için tek uygulama.
            </Text>

            <Input label="Ad Soyad" icon="person-outline" placeholder="Adın Soyadın" value={name} onChangeText={setName} />
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
              placeholder="En az 8 karakter"
              isPassword
              value={password}
              onChangeText={setPassword}
            />

            {error ? (
              <Text variant="bodySmall" color="danger" style={{ marginBottom: spacing.sm }}>
                {error}
              </Text>
            ) : null}

            <Button
              label="Kayıt Ol"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={!name || !email || password.length < 8}
              style={{ marginTop: spacing.xs }}
            />

            <View style={styles.footerRow}>
              <Text variant="bodySmall" color="secondary">
                Zaten hesabın var mı?
              </Text>
              <Text
                variant="bodySmall"
                weight="bold"
                color="accent"
                style={{ marginLeft: 6 }}
                onPress={() => navigation.navigate("Login")}
              >
                Giriş yap
              </Text>
            </View>
          </View>
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
  footerRow: { flexDirection: "row", justifyContent: "center", marginTop: spacing.lg },
});

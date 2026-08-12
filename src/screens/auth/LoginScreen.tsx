import { useState } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "@/store/AuthContext";
import { useTheme } from "@/theme/ThemeContext";
import { palette, spacing } from "@/theme/tokens";
import { Text, Button, Input } from "@/components/ui";
import type { AuthStackParamList } from "@/navigation/RootNavigator";
import { ApiError } from "@/api/client";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={[styles.hero, { paddingTop: insets.top + spacing.xl }]}>
          <View style={styles.brandRow}>
            <Ionicons name="boat" size={22} color={palette.gold500} />
            <Text variant="h1" color="onDark" weight="extrabold" style={{ marginLeft: 6 }}>
              MİÇO
            </Text>
          </View>
          <Text variant="h2" color="onDark" weight="bold" style={{ marginTop: spacing.md }}>
            Hoş geldin!
          </Text>
          <Text variant="bodySmall" color="onDarkMuted" style={{ marginTop: 2 }}>
            Devam etmek için giriş yap.
          </Text>
        </View>

        <ScrollView
          style={[styles.card, { backgroundColor: theme.background }]}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl }}
          keyboardShouldPersistTaps="handled"
        >
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

          {error ? (
            <Text variant="bodySmall" color="danger" style={{ marginBottom: spacing.sm }}>
              {error}
            </Text>
          ) : null}

          <Button label="Giriş Yap" onPress={handleSubmit} loading={isSubmitting} disabled={!email || !password} style={{ marginTop: spacing.xs }} />

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
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: palette.navy950,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  brandRow: { flexDirection: "row", alignItems: "center" },
  card: { flex: 1, marginTop: -20, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  footerRow: { flexDirection: "row", justifyContent: "center", marginTop: spacing.lg },
});

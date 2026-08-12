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

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
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
            Aramıza katıl
          </Text>
          <Text variant="bodySmall" color="onDarkMuted" style={{ marginTop: 2 }}>
            Teknen için tek uygulama.
          </Text>
        </View>

        <ScrollView
          style={[styles.card, { backgroundColor: theme.background }]}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl }}
          keyboardShouldPersistTaps="handled"
        >
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

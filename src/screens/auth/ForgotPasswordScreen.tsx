import { useState } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTheme } from "@/theme/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import { Text, Button, Input, Header, ScreenContainer } from "@/components/ui";
import * as authApi from "@/api/auth";
import { ApiError } from "@/api/client";
import type { AuthStackParamList } from "@/navigation/RootNavigator";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

export function ForgotPasswordScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      const trimmedEmail = email.trim();
      await authApi.forgotPassword(trimmedEmail);
      navigation.navigate("ResetPassword", { email: trimmedEmail });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Kod gönderilemedi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <Header title="Şifremi Unuttum" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={[styles.iconCircle, { backgroundColor: theme.surfaceAlt }]}>
            <Ionicons name="key-outline" size={28} color={theme.primary} />
          </View>

          <Text variant="body" color="secondary" style={{ textAlign: "center", marginTop: spacing.md, marginBottom: spacing.xl }}>
            Hesabınıza kayıtlı e-posta adresini girin, size 6 haneli bir sıfırlama kodu gönderelim.
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

          {error ? (
            <View style={[styles.errorBanner, { backgroundColor: theme.dangerBg }]}>
              <Ionicons name="alert-circle" size={16} color={theme.danger} />
              <Text variant="bodySmall" weight="semibold" color="danger" style={{ marginLeft: 6, flex: 1 }}>
                {error}
              </Text>
            </View>
          ) : null}

          <Button
            label="Kod Gönder"
            size="lg"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!email.trim()}
            style={{ marginTop: spacing.xs }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingTop: spacing.xxl },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
});

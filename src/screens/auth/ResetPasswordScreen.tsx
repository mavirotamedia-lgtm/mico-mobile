import { useState } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTheme } from "@/theme/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import { Text, Button, Input, Header, ScreenContainer, useToast } from "@/components/ui";
import * as authApi from "@/api/auth";
import { ApiError } from "@/api/client";
import type { AuthStackParamList } from "@/navigation/RootNavigator";

type Props = NativeStackScreenProps<AuthStackParamList, "ResetPassword">;

export function ResetPasswordScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const { theme } = useTheme();
  const { show } = useToast();
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = code.trim().length === 6 && newPassword.length >= 8 && newPassword === confirmPassword;

  async function handleSubmit() {
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.resetPassword(email, code.trim(), newPassword);
      show("Şifreniz güncellendi, şimdi giriş yapabilirsiniz.", "success");
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Şifre güncellenemedi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setError(null);
    try {
      await authApi.forgotPassword(email);
      show("Yeni kod gönderildi.", "success");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Kod gönderilemedi.");
    }
  }

  return (
    <ScreenContainer>
      <Header title="Yeni Şifre Belirle" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text variant="body" color="secondary" style={{ marginBottom: spacing.lg }}>
            <Text variant="body" weight="semibold" color="primary">
              {email}
            </Text>{" "}
            adresine gönderdiğimiz 6 haneli kodu ve yeni şifrenizi girin.
          </Text>

          <Input
            label="Doğrulama Kodu"
            icon="shield-checkmark-outline"
            placeholder="123456"
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ""))}
          />
          <Input
            label="Yeni Şifre"
            icon="lock-closed-outline"
            placeholder="En az 8 karakter"
            isPassword
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <Input
            label="Yeni Şifre (Tekrar)"
            icon="lock-closed-outline"
            placeholder="••••••••"
            isPassword
            value={confirmPassword}
            onChangeText={setConfirmPassword}
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
            label="Şifreyi Güncelle"
            size="lg"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!canSubmit}
            style={{ marginTop: spacing.xs }}
          />

          <Text
            variant="bodySmall"
            weight="bold"
            color="accent"
            style={{ textAlign: "center", marginTop: spacing.lg }}
            onPress={handleResend}
          >
            Kodu tekrar gönder
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingTop: spacing.xxl },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
});

import { useState } from "react";
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "@/store/AuthContext";
import { useTheme } from "@/theme/ThemeContext";
import { palette, radius, spacing } from "@/theme/tokens";
import { Text, Button, Input, Modal } from "@/components/ui";
import type { AuthStackParamList } from "@/navigation/RootNavigator";
import { ApiError } from "@/api/client";
import { USER_AGREEMENT, KVKK_NOTICE, type LegalDocument } from "@/lib/legalTexts";

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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDocument | null>(null);

  async function handleSubmit() {
    if (!acceptedTerms) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password, acceptedTerms: true });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Kayıt oluşturulamadı.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.navy950 }}>
      <Image source={{ uri: BG_IMAGE }} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={2} />
      <LinearGradient colors={["rgba(6,15,32,0.65)", "rgba(6,15,32,0.8)"]} style={StyleSheet.absoluteFill} />

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

            <View style={styles.consentRow}>
              <Pressable
                onPress={() => setAcceptedTerms((v) => !v)}
                hitSlop={8}
                style={[
                  styles.checkbox,
                  {
                    borderColor: acceptedTerms ? theme.primary : theme.border,
                    backgroundColor: acceptedTerms ? theme.primary : "transparent",
                  },
                ]}
              >
                {acceptedTerms ? <Ionicons name="checkmark" size={14} color={theme.onPrimary} /> : null}
              </Pressable>
              <Text variant="caption" color="secondary" style={{ flex: 1, marginLeft: spacing.sm, lineHeight: 18 }}>
                <Text variant="caption" color="accent" weight="bold" onPress={() => setLegalDoc(USER_AGREEMENT)}>
                  Kullanıcı Sözleşmesi
                </Text>
                {"'ni ve "}
                <Text variant="caption" color="accent" weight="bold" onPress={() => setLegalDoc(KVKK_NOTICE)}>
                  KVKK Aydınlatma Metni
                </Text>
                {"'ni okudum, onaylıyorum."}
              </Text>
            </View>

            {error ? (
              <Text variant="bodySmall" color="danger" style={{ marginBottom: spacing.sm }}>
                {error}
              </Text>
            ) : null}

            <Button
              label="Kayıt Ol"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={!name || !email || password.length < 8 || !acceptedTerms}
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

      <Modal visible={!!legalDoc} onClose={() => setLegalDoc(null)} title={legalDoc?.title}>
        {legalDoc ? (
          <View style={{ paddingBottom: spacing.md }}>
            <Text variant="caption" color="secondary" style={{ marginBottom: spacing.md }}>
              Son güncelleme: {legalDoc.updatedAt}
            </Text>
            {legalDoc.sections.map((section) => (
              <View key={section.heading} style={{ marginBottom: spacing.md }}>
                <Text variant="bodySmall" weight="bold" style={{ marginBottom: 4 }}>
                  {section.heading}
                </Text>
                <Text variant="bodySmall" color="secondary" style={{ lineHeight: 20 }}>
                  {section.body}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  consentRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: spacing.md },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
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

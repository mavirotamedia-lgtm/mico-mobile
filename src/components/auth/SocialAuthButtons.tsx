import { useEffect, useState } from "react";
import { View, StyleSheet, Platform, ActivityIndicator } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import { Text, Touchable, useToast } from "@/components/ui";
import { useAuth } from "@/store/AuthContext";
import { ApiError } from "@/api/client";

WebBrowser.maybeCompleteAuthSession();

// Google Cloud Console'da olusturulacak OAuth istemcilerinin client ID'leri —
// bunlar gizli degil, herkese acik degerlerdir. Kurulum tamamlanana kadar bos
// birakiliyor; bos oldugu surece Google butonu "yakinda aktif olacak" der,
// hicbir seyi bozmaz (bkz. backend .env.example > GOOGLE_CLIENT_ID notu —
// burada girilecek client ID'nin audience'i backend'deki GOOGLE_CLIENT_ID ile
// eslesmeli).
const GOOGLE_IOS_CLIENT_ID = "";
const GOOGLE_ANDROID_CLIENT_ID = "";
const GOOGLE_WEB_CLIENT_ID = "";
const GOOGLE_CONFIGURED = Boolean(GOOGLE_IOS_CLIENT_ID || GOOGLE_ANDROID_CLIENT_ID || GOOGLE_WEB_CLIENT_ID);

export function SocialAuthButtons() {
  const { theme, mode } = useTheme();
  const { loginWithGoogle, loginWithApple } = useAuth();
  const { show } = useToast();
  const [isAppleBusy, setIsAppleBusy] = useState(false);
  const [isGoogleBusy, setIsGoogleBusy] = useState(false);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === "ios") {
      AppleAuthentication.isAvailableAsync().then(setIsAppleAvailable);
    }
  }, []);

  const [, googleResponse, promptGoogleAsync] = Google.useIdTokenAuthRequest({
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
    webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
  });

  useEffect(() => {
    if (googleResponse?.type !== "success") {
      if (googleResponse?.type === "error") show("Google ile giriş yapılamadı.", "error");
      return;
    }
    const idToken = googleResponse.params.id_token;
    if (!idToken) return;

    setIsGoogleBusy(true);
    loginWithGoogle(idToken)
      .catch((e) => show(e instanceof ApiError ? e.message : "Google ile giriş yapılamadı.", "error"))
      .finally(() => setIsGoogleBusy(false));
  }, [googleResponse, loginWithGoogle, show]);

  async function handleApplePress() {
    setIsAppleBusy(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error("Kimlik token'ı alınamadı.");
      await loginWithApple(credential.identityToken, credential.fullName ?? undefined);
    } catch (e) {
      if (e instanceof Error && e.message.includes("ERR_REQUEST_CANCELED")) return;
      show(e instanceof ApiError ? e.message : "Apple ile giriş yapılamadı.", "error");
    } finally {
      setIsAppleBusy(false);
    }
  }

  async function handleGooglePress() {
    if (!GOOGLE_CONFIGURED) {
      show("Google ile giriş yakında aktif olacak.", "info");
      return;
    }
    await promptGoogleAsync();
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
        <Text variant="caption" color="secondary" style={{ marginHorizontal: spacing.sm }}>
          veya
        </Text>
        <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
      </View>

      {Platform.OS === "ios" && isAppleAvailable ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={
            mode === "dark"
              ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
              : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          }
          cornerRadius={radius.lg}
          style={[styles.appleButton, { opacity: isAppleBusy ? 0.6 : 1 }]}
          onPress={handleApplePress}
        />
      ) : null}

      <Touchable
        onPress={handleGooglePress}
        disabled={isGoogleBusy}
        haptic
        style={[styles.googleButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        {isGoogleBusy ? (
          <ActivityIndicator color={theme.textPrimary} />
        ) : (
          <>
            <Ionicons name="logo-google" size={18} color={theme.textPrimary} />
            <Text variant="body" weight="semibold" style={{ marginLeft: spacing.sm }}>
              Google ile devam et
            </Text>
          </>
        )}
      </Touchable>
    </View>
  );
}

const styles = StyleSheet.create({
  dividerRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  appleButton: { height: 50, width: "100%" },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
});

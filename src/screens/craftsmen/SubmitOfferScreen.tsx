import { useCallback, useState } from "react";
import { ScrollView, View, Image, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as offersApi from "@/api/offers";
import * as craftsmenApi from "@/api/craftsmen";
import { radius, spacing } from "@/theme/tokens";
import { Text, Card, Badge, Button, Input, Header, ScreenContainer, useToast } from "@/components/ui";
import { useTheme } from "@/theme/ThemeContext";
import { resolveMediaUrl } from "@/lib/media";
import type { AppStackParamList } from "@/navigation/RootNavigator";
import { SPECIALTY_LABELS, OFFER_TOKEN_COST } from "@/types/mico";
import { ApiError } from "@/api/client";

type Props = NativeStackScreenProps<AppStackParamList, "SubmitOffer">;

export function SubmitOfferScreen({ route, navigation }: Props) {
  const { serviceRequest } = route.params;
  const { theme } = useTheme();
  const { show } = useToast();
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // API alani hala "tokenBalance" adini tasiyor ama kullaniciya "Teklif
  // Hakki" olarak gosteriliyor — bkz. backend craftsmen/service.ts.
  const [offerCredits, setOfferCredits] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      craftsmenApi
        .getMyCraftsmanProfile()
        .then((c) => setOfferCredits(c.tokenBalance))
        .catch(() => setOfferCredits(null));
    }, [])
  );

  const hasOfferCredits = offerCredits !== null && offerCredits >= OFFER_TOKEN_COST;

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      const priceEstimate = price.trim() ? Number(price.trim().replace(",", ".")) : undefined;
      await offersApi.submitOffer(serviceRequest.id, {
        message: message.trim() || undefined,
        priceEstimate,
      });
      show("Teklifin gönderildi", "success");
      navigation.goBack();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Teklif gönderilemedi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const trimmedPrice = price.trim();
  const isPriceValid = trimmedPrice === "" || !Number.isNaN(Number(trimmedPrice.replace(",", ".")));

  return (
    <ScreenContainer>
      <Header title="Teklif Gönder" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Card style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Text variant="body" weight="bold" style={{ flex: 1 }}>
              {serviceRequest.title}
            </Text>
            {serviceRequest.isUrgent ? <Badge label="Acil" tone="danger" /> : null}
          </View>
          <Text variant="bodySmall" color="secondary" style={{ marginTop: 4 }}>
            {serviceRequest.description}
          </Text>
          <Text variant="caption" color="secondary" style={{ marginTop: spacing.xs }}>
            {SPECIALTY_LABELS[serviceRequest.specialty]} · {serviceRequest.city}
            {serviceRequest.marina ? ` · ${serviceRequest.marina}` : ""}
          </Text>
          {serviceRequest.photos.length > 0 ? (
            <View style={styles.photoRow}>
              {serviceRequest.photos.map((url) => (
                <Image key={url} source={{ uri: resolveMediaUrl(url) }} style={[styles.photoThumb, { borderColor: theme.border }]} resizeMode="cover" />
              ))}
            </View>
          ) : null}
        </Card>

        <Input
          label="Fiyat Teklifi (₺, opsiyonel)"
          placeholder="ör. 1500"
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
          icon="cash-outline"
          error={!isPriceValid ? "Geçerli bir tutar girin." : undefined}
        />
        <Input
          label="Mesaj (opsiyonel)"
          placeholder="Kısaca kendini ve teklifini tanıt..."
          value={message}
          onChangeText={setMessage}
          icon="chatbox-ellipses-outline"
          multiline
          numberOfLines={4}
          style={{ minHeight: 90, textAlignVertical: "top" }}
        />

        <View style={[styles.tokenRow, { borderColor: theme.border }]}>
          <Text variant="bodySmall" color="secondary">
            Bu teklif <Text variant="bodySmall" weight="bold">{OFFER_TOKEN_COST} Teklif Hakkı</Text> kullanacak
          </Text>
          <Text variant="bodySmall" weight="semibold" color={hasOfferCredits ? "secondary" : "danger"}>
            Kalan Teklif Hakkınız: {offerCredits ?? "..."}
          </Text>
        </View>

        {offerCredits !== null && !hasOfferCredits ? (
          <Text variant="bodySmall" color="danger" style={{ marginTop: spacing.xs, marginBottom: spacing.sm }}>
            Teklif hakkınız tükendi — yeni teklif verebilmek için teklif hakkı satın alabileceksiniz. Bu özellik
            yakında aktif olacak, o zamana kadar admin ile iletişime geçebilirsiniz.
          </Text>
        ) : null}

        {error ? (
          <Text variant="bodySmall" color="danger" style={{ marginBottom: spacing.sm }}>
            {error}
          </Text>
        ) : null}

        <Button
          label={
            offerCredits !== null && !hasOfferCredits
              ? "Teklif Hakkınız Tükendi"
              : `Teklif Gönder (${OFFER_TOKEN_COST} Hak Kullanılacak) | Kalan Teklif Hakkınız: ${offerCredits !== null ? offerCredits - OFFER_TOKEN_COST : "..."}`
          }
          variant={offerCredits !== null && !hasOfferCredits ? "danger" : "primary"}
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={!isPriceValid || offerCredits === null || !hasOfferCredits}
          style={{ marginTop: spacing.xs }}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.sm },
  photoThumb: { width: 64, height: 64, borderRadius: radius.md, borderWidth: 1.5 },
  tokenRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
});

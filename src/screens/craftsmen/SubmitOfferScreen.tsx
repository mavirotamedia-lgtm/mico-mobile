import { useState } from "react";
import { ScrollView, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as offersApi from "@/api/offers";
import { spacing } from "@/theme/tokens";
import { Text, Card, Badge, Button, Input, Header, ScreenContainer, useToast } from "@/components/ui";
import type { AppStackParamList } from "@/navigation/RootNavigator";
import { SPECIALTY_LABELS } from "@/types/mico";
import { ApiError } from "@/api/client";

type Props = NativeStackScreenProps<AppStackParamList, "SubmitOffer">;

export function SubmitOfferScreen({ route, navigation }: Props) {
  const { serviceRequest } = route.params;
  const { show } = useToast();
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

        {error ? (
          <Text variant="bodySmall" color="danger" style={{ marginBottom: spacing.sm }}>
            {error}
          </Text>
        ) : null}

        <Button
          label="Teklifi Gönder"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={!isPriceValid}
          style={{ marginTop: spacing.xs }}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

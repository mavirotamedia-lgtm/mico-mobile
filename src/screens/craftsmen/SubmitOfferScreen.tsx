import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as serviceRequestsApi from "@/api/serviceRequests";
import * as offersApi from "@/api/offers";
import { spacing } from "@/theme/tokens";
import { Text, Card, Badge, Button, Input, Header, ScreenContainer, Skeleton, useToast } from "@/components/ui";
import type { AppStackParamList } from "@/navigation/RootNavigator";
import type { ServiceRequest } from "@/types/mico";
import { SPECIALTY_LABELS } from "@/types/mico";
import { ApiError } from "@/api/client";

type Props = NativeStackScreenProps<AppStackParamList, "SubmitOffer">;

export function SubmitOfferScreen({ route, navigation }: Props) {
  const { serviceRequestId, requestTitle } = route.params;
  const { show } = useToast();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    serviceRequestsApi
      .getServiceRequest(serviceRequestId)
      .then(setRequest)
      .catch((e) => show(e instanceof ApiError ? e.message : "Talep yüklenemedi.", "error"))
      .finally(() => setIsLoading(false));
  }, [serviceRequestId, show]);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      const priceEstimate = price.trim() ? Number(price.trim().replace(",", ".")) : undefined;
      await offersApi.submitOffer(serviceRequestId, {
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
        {isLoading ? (
          <Skeleton width="100%" height={100} radius={16} />
        ) : request ? (
          <Card style={{ marginBottom: spacing.lg }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Text variant="body" weight="bold" style={{ flex: 1 }}>
                {request.title}
              </Text>
              {request.isUrgent ? <Badge label="Acil" tone="danger" /> : null}
            </View>
            <Text variant="bodySmall" color="secondary" style={{ marginTop: 4 }}>
              {request.description}
            </Text>
            <Text variant="caption" color="secondary" style={{ marginTop: spacing.xs }}>
              {SPECIALTY_LABELS[request.specialty]} · {request.city}
              {request.marina ? ` · ${request.marina}` : ""}
            </Text>
          </Card>
        ) : (
          <Text variant="body" color="secondary" style={{ marginBottom: spacing.lg }}>
            {requestTitle}
          </Text>
        )}

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

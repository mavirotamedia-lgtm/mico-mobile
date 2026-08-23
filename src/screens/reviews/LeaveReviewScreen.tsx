import { useState } from "react";
import { ScrollView } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as reviewsApi from "@/api/reviews";
import { spacing } from "@/theme/tokens";
import { Text, Card, Button, Input, RatingInput, Header, ScreenContainer, useToast } from "@/components/ui";
import type { AppStackParamList } from "@/navigation/RootNavigator";
import { ApiError } from "@/api/client";

type Props = NativeStackScreenProps<AppStackParamList, "LeaveReview">;

export function LeaveReviewScreen({ route, navigation }: Props) {
  const { serviceRequestId, craftsmanId, craftsmanName } = route.params;
  const { show } = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      await reviewsApi.createReview({
        targetType: "CRAFTSMAN",
        targetId: craftsmanId,
        rating,
        comment: comment.trim() || undefined,
        serviceRequestId,
      });
      show("Değerlendirmen için teşekkürler!", "success");
      navigation.goBack();
    } catch (e) {
      show(e instanceof ApiError ? e.message : "Değerlendirme gönderilemedi.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <Header title="Ustayı Değerlendir" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Card style={{ alignItems: "center" }}>
          <Text variant="body" weight="bold" style={{ textAlign: "center" }}>
            {craftsmanName}
          </Text>
          <Text variant="bodySmall" color="secondary" style={{ marginTop: 4, marginBottom: spacing.md, textAlign: "center" }}>
            Bu ustayla çalışman nasıl geçti?
          </Text>
          <RatingInput value={rating} onChange={setRating} />
        </Card>

        <Input
          label="Yorumun (opsiyonel)"
          placeholder="Deneyimini kısaca anlat..."
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
          style={{ minHeight: 90, textAlignVertical: "top", marginTop: spacing.lg }}
        />

        <Button
          label="Değerlendirmeyi Gönder"
          onPress={handleSubmit}
          loading={isSubmitting}
          style={{ marginTop: spacing.lg }}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

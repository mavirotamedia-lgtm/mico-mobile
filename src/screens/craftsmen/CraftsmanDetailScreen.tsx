import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as craftsmenApi from "@/api/craftsmen";
import * as conversationsApi from "@/api/conversations";
import * as reviewsApi from "@/api/reviews";
import * as favoritesApi from "@/api/favorites";
import { useTheme } from "@/theme/ThemeContext";
import { spacing } from "@/theme/tokens";
import { Text, Card, Avatar, Rating, Badge, Button, Header, ScreenContainer, Reveal, UserActionsSheet, useToast } from "@/components/ui";
import { useAuth } from "@/store/AuthContext";
import type { AppStackParamList } from "@/navigation/RootNavigator";
import type { Craftsman, Review } from "@/types/mico";
import { SPECIALTY_LABELS } from "@/types/mico";
import { ApiError } from "@/api/client";

type Props = NativeStackScreenProps<AppStackParamList, "CraftsmanDetail">;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

export function CraftsmanDetailScreen({ route, navigation }: Props) {
  const { craftsmanId } = route.params;
  const { theme } = useTheme();
  const { show } = useToast();
  const { isGuest, exitGuest } = useAuth();
  const [craftsman, setCraftsman] = useState<Craftsman | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isMessaging, setIsMessaging] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isActionsSheetVisible, setIsActionsSheetVisible] = useState(false);

  useEffect(() => {
    craftsmenApi
      .getCraftsman(craftsmanId)
      .then(setCraftsman)
      .catch((e) => setLoadError(e instanceof ApiError ? e.message : "Usta profili yüklenemedi."));
    reviewsApi
      .listReviews("CRAFTSMAN", craftsmanId)
      .then((res) => setReviews(res.items))
      .catch(() => {});
    if (!isGuest) {
      favoritesApi
        .listFavorites("CRAFTSMAN")
        .then((res) => setIsFavorited(res.items.some((f) => f.targetId === craftsmanId)))
        .catch(() => {});
    }
  }, [craftsmanId, isGuest]);

  async function handleToggleFavorite() {
    if (isGuest) {
      show("Favorilere eklemek için giriş yapmalısın.", "error");
      exitGuest();
      return;
    }
    if (isTogglingFavorite) return;
    setIsTogglingFavorite(true);
    const nextValue = !isFavorited;
    try {
      if (nextValue) {
        await favoritesApi.addFavorite("CRAFTSMAN", craftsmanId);
      } else {
        await favoritesApi.removeFavorite("CRAFTSMAN", craftsmanId);
      }
      setIsFavorited(nextValue);
    } catch (e) {
      show(e instanceof ApiError ? e.message : "İşlem gerçekleştirilemedi.", "error");
    } finally {
      setIsTogglingFavorite(false);
    }
  }

  async function handleMessage() {
    if (!craftsman) return;
    if (isGuest) {
      show("Mesaj göndermek için giriş yapmalısın.", "error");
      exitGuest();
      return;
    }
    setIsMessaging(true);
    try {
      const conversation = await conversationsApi.getOrCreateConversation(craftsman.userId);
      navigation.navigate("Chat", {
        conversationId: conversation.id,
        otherUserName: craftsman.businessName ?? "Usta",
        otherUserId: craftsman.userId,
      });
    } catch (e) {
      show(e instanceof ApiError ? e.message : "Sohbet başlatılamadı.", "error");
    } finally {
      setIsMessaging(false);
    }
  }

  return (
    <ScreenContainer>
      <Header
        title="Usta Profili"
        onBack={() => navigation.goBack()}
        rightActions={[
          { icon: isFavorited ? "heart" : "heart-outline", onPress: handleToggleFavorite },
          ...(craftsman ? [{ icon: "ellipsis-vertical" as const, onPress: () => setIsActionsSheetVisible(true) }] : []),
        ]}
      />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 }}>
        {craftsman ? (
          <Reveal>
            <Card style={{ alignItems: "center" }}>
              <Avatar name={craftsman.businessName ?? "Usta"} uri={craftsman.avatar} size={72} />
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: spacing.sm }}>
                <Text variant="h1" weight="extrabold">
                  {craftsman.businessName ?? SPECIALTY_LABELS[craftsman.specialty]}
                </Text>
                {craftsman.isVerified ? (
                  <Ionicons name="checkmark-circle" size={18} color={theme.success} style={{ marginLeft: 6 }} />
                ) : null}
              </View>
              <View style={{ marginTop: 4 }}>
                <Rating value={craftsman.ratingAvg} count={craftsman.ratingCount} />
              </View>
              <View style={{ flexDirection: "row", gap: spacing.xs, marginTop: spacing.sm }}>
                <Badge label={SPECIALTY_LABELS[craftsman.specialty]} tone="accent" />
                {craftsman.isVerified ? <Badge label="Mavi Rota Onaylı" tone="success" /> : null}
              </View>
            </Card>

            <Card style={{ marginTop: spacing.md }}>
              <InfoRow icon="location-outline" text={[craftsman.city, craftsman.marina].filter(Boolean).join(" · ")} />
              {craftsman.experienceYears ? (
                <InfoRow icon="ribbon-outline" text={`${craftsman.experienceYears} yıl tecrübe`} />
              ) : null}
              {craftsman.bio ? <InfoRow icon="chatbubble-ellipses-outline" text={craftsman.bio} /> : null}
            </Card>

            <Button
              label="Mesaj Gönder"
              icon="chatbubble-outline"
              size="lg"
              onPress={handleMessage}
              loading={isMessaging}
              style={{ marginTop: spacing.lg }}
            />

            <Text variant="bodySmall" weight="semibold" color="secondary" style={{ marginTop: spacing.xl, marginBottom: spacing.xs }}>
              DEĞERLENDİRMELER {reviews.length > 0 ? `(${reviews.length})` : ""}
            </Text>
            {reviews.length === 0 ? (
              <Card>
                <Text variant="bodySmall" color="secondary" style={{ textAlign: "center" }}>
                  Bu usta için henüz değerlendirme yapılmamış.
                </Text>
              </Card>
            ) : (
              reviews.map((review) => (
                <Card key={review.id} style={{ marginBottom: spacing.sm }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text variant="bodySmall" weight="bold">
                      {review.author?.name ?? "Kaptan"}
                    </Text>
                    <Rating value={review.rating} />
                  </View>
                  {review.comment ? (
                    <Text variant="bodySmall" color="secondary" style={{ marginTop: 4 }}>
                      {review.comment}
                    </Text>
                  ) : null}
                  <Text variant="caption" color="secondary" style={{ marginTop: 4 }}>
                    {formatDate(review.createdAt)}
                  </Text>
                </Card>
              ))
            )}
          </Reveal>
        ) : loadError ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="alert-circle-outline" size={32} color={theme.textSecondary} />
            <Text variant="body" color="secondary" style={{ marginTop: spacing.sm, textAlign: "center" }}>
              {loadError}
            </Text>
          </View>
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={theme.primary} />
          </View>
        )}
      </ScrollView>

      {craftsman ? (
        <UserActionsSheet
          visible={isActionsSheetVisible}
          onClose={() => setIsActionsSheetVisible(false)}
          targetUserId={craftsman.userId}
          targetUserName={craftsman.businessName ?? "Usta"}
          contextType="CRAFTSMAN_PROFILE"
          contextId={craftsmanId}
          onBlocked={() => navigation.goBack()}
        />
      ) : null}
    </ScreenContainer>
  );
}

function InfoRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const { theme } = useTheme();
  if (!text) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.xs }}>
      <Ionicons name={icon} size={16} color={theme.textSecondary} />
      <Text variant="bodySmall" color="secondary" style={{ marginLeft: spacing.xs, flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}

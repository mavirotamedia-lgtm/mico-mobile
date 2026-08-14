import { useCallback, useState } from "react";
import { FlatList, View, StyleSheet, RefreshControl, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as offersApi from "@/api/offers";
import * as craftsmenApi from "@/api/craftsmen";
import * as conversationsApi from "@/api/conversations";
import { useTheme } from "@/theme/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import { Text, Card, Avatar, Rating, Badge, Button, Header, ScreenContainer, Reveal, Skeleton, useToast } from "@/components/ui";
import type { AppStackParamList } from "@/navigation/RootNavigator";
import type { Craftsman, ServiceOffer } from "@/types/mico";
import { ApiError } from "@/api/client";

type Props = NativeStackScreenProps<AppStackParamList, "Offers">;

type OfferWithCraftsman = ServiceOffer & { craftsmanInfo?: Craftsman };
type BusyAction = { id: string; kind: "accept" | "message" } | null;

function formatPrice(value: number | null) {
  if (value === null) return "Fiyat belirtilmedi";
  return `${value.toLocaleString("tr-TR")} TL`;
}

const STATUS_TONE: Record<ServiceOffer["status"], "success" | "warning" | "danger" | "neutral"> = {
  PENDING: "warning",
  ACCEPTED: "success",
  DECLINED: "danger",
  WITHDRAWN: "neutral",
};

const STATUS_LABEL: Record<ServiceOffer["status"], string> = {
  PENDING: "Bekliyor",
  ACCEPTED: "Kabul edildi",
  DECLINED: "Reddedildi",
  WITHDRAWN: "Geri çekildi",
};

export function OffersScreen({ route, navigation }: Props) {
  const { serviceRequestId, requestTitle } = route.params;
  const { theme } = useTheme();
  const { show } = useToast();
  const [offers, setOffers] = useState<OfferWithCraftsman[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busy, setBusy] = useState<BusyAction>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setIsRefreshing(true);
      try {
        const res = await offersApi.listOffersForRequest(serviceRequestId);
        const withCraftsmen = await Promise.all(
          res.items.map(async (offer) => {
            try {
              const craftsmanInfo = await craftsmenApi.getCraftsman(offer.craftsmanId);
              return { ...offer, craftsmanInfo };
            } catch {
              return offer;
            }
          })
        );
        setOffers(withCraftsmen);
      } catch (e) {
        show(e instanceof ApiError ? e.message : "Teklifler yüklenemedi.", "error");
      } finally {
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    },
    [serviceRequestId, show]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function handleAccept(offer: OfferWithCraftsman) {
    Alert.alert(
      "Teklifi Kabul Et",
      `${offer.craftsmanInfo?.businessName ?? "Bu usta"} ile anlaşılacak, diğer teklifler otomatik reddedilecek. Onaylıyor musun?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Kabul Et",
          onPress: async () => {
            setBusy({ id: offer.id, kind: "accept" });
            try {
              await offersApi.acceptOffer(offer.id);
              show("Teklif kabul edildi", "success");
              load();
            } catch (e) {
              show(e instanceof ApiError ? e.message : "Teklif kabul edilemedi.", "error");
            } finally {
              setBusy(null);
            }
          },
        },
      ]
    );
  }

  async function handleMessage(offer: OfferWithCraftsman) {
    if (!offer.craftsmanInfo) return;
    setBusy({ id: offer.id, kind: "message" });
    try {
      const conversation = await conversationsApi.getOrCreateConversation(offer.craftsmanInfo.userId);
      navigation.navigate("Chat", {
        conversationId: conversation.id,
        otherUserName: offer.craftsmanInfo.businessName ?? "Usta",
      });
    } catch (e) {
      show(e instanceof ApiError ? e.message : "Sohbet başlatılamadı.", "error");
    } finally {
      setBusy(null);
    }
  }

  if (isInitialLoading) {
    return (
      <ScreenContainer>
        <Header title={requestTitle ?? "Gelen Teklifler"} onBack={() => navigation.goBack()} />
        <View style={{ padding: spacing.lg }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={120} radius={radius.xl} style={{ marginBottom: spacing.sm }} />
          ))}
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Header title={requestTitle ?? "Gelen Teklifler"} onBack={() => navigation.goBack()} />

      <FlatList
        data={offers}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} tintColor={theme.primary} />}
        contentContainerStyle={{ padding: spacing.lg, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="hourglass-outline" size={36} color={theme.textSecondary} />
            <Text variant="body" color="secondary" style={{ marginTop: spacing.sm, textAlign: "center" }}>
              Henüz teklif gelmedi. Ustalar talebini inceliyor.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Reveal delay={index * 60}>
            <Card style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Avatar name={item.craftsmanInfo?.businessName ?? "Usta"} uri={item.craftsmanInfo?.avatar} size={44} />
                <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                  <Text variant="body" weight="bold" numberOfLines={1}>
                    {item.craftsmanInfo?.businessName ?? "Usta"}
                  </Text>
                  {item.craftsmanInfo ? <Rating value={item.craftsmanInfo.ratingAvg} count={item.craftsmanInfo.ratingCount} /> : null}
                </View>
                <Badge label={STATUS_LABEL[item.status]} tone={STATUS_TONE[item.status]} />
              </View>

              {item.message ? (
                <Text variant="bodySmall" color="secondary" style={{ marginTop: spacing.sm }}>
                  {item.message}
                </Text>
              ) : null}

              <View style={styles.statsRow}>
                <View>
                  <Text variant="caption" color="secondary">
                    Tahmini Fiyat
                  </Text>
                  <Text variant="body" weight="bold">
                    {formatPrice(item.priceEstimate)}
                  </Text>
                </View>
              </View>

              <View style={styles.actionsRow}>
                <Button
                  label="Mesaj"
                  variant="secondary"
                  icon="chatbubble-outline"
                  fullWidth={false}
                  style={{ flex: 1 }}
                  onPress={() => handleMessage(item)}
                  loading={busy?.id === item.id && busy.kind === "message"}
                  disabled={busy !== null && busy.id !== item.id}
                />
                {item.status === "PENDING" ? (
                  <Button
                    label="Kabul Et"
                    fullWidth={false}
                    style={{ flex: 1, marginLeft: spacing.sm }}
                    onPress={() => handleAccept(item)}
                    loading={busy?.id === item.id && busy.kind === "accept"}
                    disabled={busy !== null && busy.id !== item.id}
                  />
                ) : null}
              </View>
            </Card>
          </Reveal>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: "center", paddingTop: spacing.xxxl },
  statsRow: { flexDirection: "row", marginTop: spacing.sm },
  actionsRow: { flexDirection: "row", marginTop: spacing.sm },
});

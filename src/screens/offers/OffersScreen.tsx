import { useCallback, useState } from "react";
import { FlatList, View, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as offersApi from "@/api/offers";
import * as craftsmenApi from "@/api/craftsmen";
import * as conversationsApi from "@/api/conversations";
import { useTheme } from "@/theme/ThemeContext";
import { spacing } from "@/theme/tokens";
import { Text, Card, Avatar, Rating, Badge, Button, Header, ScreenContainer, useToast } from "@/components/ui";
import type { AppStackParamList } from "@/navigation/RootNavigator";
import type { Craftsman, ServiceOffer } from "@/types/mico";
import { ApiError } from "@/api/client";

type Props = NativeStackScreenProps<AppStackParamList, "Offers">;

type OfferWithCraftsman = ServiceOffer & { craftsmanInfo?: Craftsman };

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
  const [isLoading, setIsLoading] = useState(false);
  const [busyOfferId, setBusyOfferId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  }, [serviceRequestId, show]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleAccept(offerId: string) {
    setBusyOfferId(offerId);
    try {
      await offersApi.acceptOffer(offerId);
      show("Teklif kabul edildi", "success");
      load();
    } catch (e) {
      show(e instanceof ApiError ? e.message : "Teklif kabul edilemedi.", "error");
    } finally {
      setBusyOfferId(null);
    }
  }

  async function handleMessage(offer: OfferWithCraftsman) {
    if (!offer.craftsmanInfo) return;
    setBusyOfferId(offer.id);
    try {
      const conversation = await conversationsApi.getOrCreateConversation(offer.craftsmanInfo.userId);
      navigation.navigate("Chat", {
        conversationId: conversation.id,
        otherUserName: offer.craftsmanInfo.businessName ?? "Usta",
      });
    } catch (e) {
      show(e instanceof ApiError ? e.message : "Sohbet başlatılamadı.", "error");
    } finally {
      setBusyOfferId(null);
    }
  }

  return (
    <ScreenContainer>
      <Header title={requestTitle ?? "Gelen Teklifler"} onBack={() => navigation.goBack()} />

      <FlatList
        data={offers}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={theme.primary} />}
        contentContainerStyle={{ padding: spacing.lg, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="hourglass-outline" size={36} color={theme.textSecondary} />
            <Text variant="body" color="secondary" style={{ marginTop: spacing.sm, textAlign: "center" }}>
              Henüz teklif gelmedi. Ustalar talebini inceliyor.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Avatar name={item.craftsmanInfo?.businessName ?? "Usta"} uri={item.craftsmanInfo?.avatar} size={44} />
              <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                <Text variant="body" weight="semibold" numberOfLines={1}>
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
                loading={busyOfferId === item.id}
              />
              {item.status === "PENDING" ? (
                <Button
                  label="Kabul Et"
                  fullWidth={false}
                  style={{ flex: 1, marginLeft: spacing.sm }}
                  onPress={() => handleAccept(item.id)}
                  loading={busyOfferId === item.id}
                />
              ) : null}
            </View>
          </Card>
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

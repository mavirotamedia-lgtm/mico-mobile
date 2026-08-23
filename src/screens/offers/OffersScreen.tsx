import { useCallback, useState } from "react";
import { FlatList, View, Image, Pressable, StyleSheet, RefreshControl, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as offersApi from "@/api/offers";
import * as craftsmenApi from "@/api/craftsmen";
import * as conversationsApi from "@/api/conversations";
import * as serviceRequestsApi from "@/api/serviceRequests";
import * as reviewsApi from "@/api/reviews";
import { uploadImage } from "@/api/uploads";
import { resolveMediaUrl } from "@/lib/media";
import { useTheme } from "@/theme/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import { Text, Card, Avatar, Rating, Badge, Button, Header, ScreenContainer, Reveal, Skeleton, useToast } from "@/components/ui";
import type { AppStackParamList } from "@/navigation/RootNavigator";
import type { Craftsman, ServiceOffer, ServiceRequestStatus } from "@/types/mico";
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
  const { serviceRequest } = route.params;
  const { theme } = useTheme();
  const { show } = useToast();
  const [offers, setOffers] = useState<OfferWithCraftsman[]>([]);
  const [photos, setPhotos] = useState<string[]>(serviceRequest.photos);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busy, setBusy] = useState<BusyAction>(null);
  const [requestStatus, setRequestStatus] = useState<ServiceRequestStatus>(serviceRequest.status);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setIsRefreshing(true);
      try {
        const [freshRequest, res] = await Promise.all([
          serviceRequestsApi.getServiceRequest(serviceRequest.id),
          offersApi.listOffersForRequest(serviceRequest.id),
        ]);
        setRequestStatus(freshRequest.status);

        const withCraftsmen = await Promise.all(
          res.map(async (offer) => {
            try {
              const craftsmanInfo = await craftsmenApi.getCraftsman(offer.craftsmanId);
              return { ...offer, craftsmanInfo };
            } catch {
              return offer;
            }
          })
        );
        setOffers(withCraftsmen);

        // Değerlendirme sadece kabul edilmiş teklifin ustasına yapılabilir —
        // bu talebe daha önce değerlendirme yapılmış mı diye bakılıyor.
        const acceptedOffer = withCraftsmen.find((o) => o.status === "ACCEPTED");
        if (freshRequest.status === "COMPLETED" && acceptedOffer) {
          const reviews = await reviewsApi.listReviews("CRAFTSMAN", acceptedOffer.craftsmanId);
          setHasReviewed(reviews.items.some((r) => r.serviceRequestId === serviceRequest.id));
        }
      } catch (e) {
        show(e instanceof ApiError ? e.message : "Teklifler yüklenemedi.", "error");
      } finally {
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    },
    [serviceRequest.id, show]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleAddPhotos() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      show("Fotoğraf seçmek için galeri izni gerekiyor.", "error");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (result.canceled || result.assets.length === 0) return;

    setIsUploadingPhoto(true);
    try {
      const urls = await Promise.all(result.assets.map((asset) => uploadImage(asset.uri, asset.mimeType)));
      const updatedPhotos = [...photos, ...urls];
      await serviceRequestsApi.updateServiceRequest(serviceRequest.id, { photos: updatedPhotos });
      setPhotos(updatedPhotos);
      show("Fotoğraflar eklendi", "success");
    } catch (e) {
      show(e instanceof ApiError ? e.message : "Fotoğraf eklenemedi.", "error");
    } finally {
      setIsUploadingPhoto(false);
    }
  }

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

  function handleComplete() {
    Alert.alert("Talebi Tamamla", "Bu iş tamamlandı olarak işaretlensin mi? Ardından ustayı değerlendirebilirsin.", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Tamamlandı",
        onPress: async () => {
          setIsCompleting(true);
          try {
            await serviceRequestsApi.completeServiceRequest(serviceRequest.id);
            show("Talep tamamlandı olarak işaretlendi", "success");
            load();
          } catch (e) {
            show(e instanceof ApiError ? e.message : "Talep tamamlanamadı.", "error");
          } finally {
            setIsCompleting(false);
          }
        },
      },
    ]);
  }

  function handleCancel() {
    Alert.alert("Talebi İptal Et", "Bu servis talebini iptal etmek istediğine emin misin? Bu işlem geri alınamaz.", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Talebi İptal Et",
        style: "destructive",
        onPress: async () => {
          setIsCancelling(true);
          try {
            await serviceRequestsApi.cancelServiceRequest(serviceRequest.id);
            show("Talep iptal edildi", "success");
            load();
          } catch (e) {
            show(e instanceof ApiError ? e.message : "Talep iptal edilemedi.", "error");
          } finally {
            setIsCancelling(false);
          }
        },
      },
    ]);
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
        <Header title={serviceRequest.title} onBack={() => navigation.goBack()} />
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
      <Header title={serviceRequest.title} onBack={() => navigation.goBack()} />

      <FlatList
        data={offers}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} tintColor={theme.primary} />}
        contentContainerStyle={{ padding: spacing.lg, flexGrow: 1 }}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.lg }}>
            <Text variant="bodySmall" weight="semibold" color="secondary" style={{ marginBottom: 6 }}>
              Arıza / Motor Fotoğrafları
            </Text>
            <View style={styles.photoRow}>
              {photos.map((url) => (
                <Image key={url} source={{ uri: resolveMediaUrl(url) }} style={[styles.photoThumb, { borderColor: theme.border }]} resizeMode="cover" />
              ))}
              <Pressable onPress={handleAddPhotos} style={[styles.photoAdd, { borderColor: theme.border }]}>
                {isUploadingPhoto ? (
                  <ActivityIndicator color={theme.primary} size="small" />
                ) : (
                  <Ionicons name="camera-outline" size={20} color={theme.textSecondary} />
                )}
              </Pressable>
            </View>

            {requestStatus === "ASSIGNED" ? (
              <Card style={{ marginTop: spacing.lg }}>
                <Text variant="body" weight="bold">
                  İş tamamlandı mı?
                </Text>
                <Text variant="bodySmall" color="secondary" style={{ marginTop: 2, marginBottom: spacing.sm }}>
                  Usta işi bitirdiyse talebi tamamlandı olarak işaretle, ardından ustayı değerlendirebilirsin.
                </Text>
                <Button
                  label="Tamamlandı Olarak İşaretle"
                  variant="secondary"
                  icon="checkmark-done-outline"
                  onPress={handleComplete}
                  loading={isCompleting}
                />
              </Card>
            ) : null}

            {requestStatus === "COMPLETED" ? (
              <Card style={{ marginTop: spacing.lg }}>
                {hasReviewed ? (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="checkmark-circle" size={18} color={theme.success} />
                    <Text variant="bodySmall" weight="semibold" style={{ marginLeft: spacing.xs }}>
                      Bu iş için ustayı değerlendirdin.
                    </Text>
                  </View>
                ) : (
                  (() => {
                    const acceptedOffer = offers.find((o) => o.status === "ACCEPTED");
                    if (!acceptedOffer) return null;
                    return (
                      <>
                        <Text variant="body" weight="bold">
                          Bu iş tamamlandı
                        </Text>
                        <Text variant="bodySmall" color="secondary" style={{ marginTop: 2, marginBottom: spacing.sm }}>
                          Diğer tekne sahiplerine yardımcı olmak için ustayı değerlendir.
                        </Text>
                        <Button
                          label="Ustayı Değerlendir"
                          icon="star-outline"
                          onPress={() =>
                            navigation.navigate("LeaveReview", {
                              serviceRequestId: serviceRequest.id,
                              craftsmanId: acceptedOffer.craftsmanId,
                              craftsmanName: acceptedOffer.craftsmanInfo?.businessName ?? "Usta",
                            })
                          }
                        />
                      </>
                    );
                  })()
                )}
              </Card>
            ) : null}

            {requestStatus === "OPEN" || requestStatus === "OFFER_RECEIVED" || requestStatus === "ASSIGNED" ? (
              <Pressable onPress={handleCancel} disabled={isCancelling} style={styles.cancelRow}>
                {isCancelling ? (
                  <ActivityIndicator color={theme.danger} size="small" />
                ) : (
                  <>
                    <Ionicons name="close-circle-outline" size={16} color={theme.danger} />
                    <Text variant="bodySmall" weight="semibold" color="danger" style={{ marginLeft: 6 }}>
                      Talebi İptal Et
                    </Text>
                  </>
                )}
              </Pressable>
            ) : null}
          </View>
        }
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
                {item.status === "PENDING" && (requestStatus === "OPEN" || requestStatus === "OFFER_RECEIVED") ? (
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
  cancelRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: spacing.md, padding: spacing.sm },
  statsRow: { flexDirection: "row", marginTop: spacing.sm },
  actionsRow: { flexDirection: "row", marginTop: spacing.sm },
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  photoThumb: { width: 64, height: 64, borderRadius: radius.md, borderWidth: 1.5 },
  photoAdd: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
});

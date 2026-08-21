import { useCallback, useState } from "react";
import { FlatList, View, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as serviceRequestsApi from "@/api/serviceRequests";
import { useTheme } from "@/theme/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import { Text, Card, Badge, Header, ScreenContainer, Reveal, Skeleton, useToast } from "@/components/ui";
import type { AppStackParamList } from "@/navigation/RootNavigator";
import type { ServiceRequest } from "@/types/mico";
import { SPECIALTY_LABELS } from "@/types/mico";
import { ApiError } from "@/api/client";

type Props = NativeStackScreenProps<AppStackParamList, "IncomingRequests">;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

export function IncomingRequestsScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { show } = useToast();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Admin henuz onaylamamis ustalar icin backend 403 doner — bunu genel bir
  // hata toast'i yerine ayri, anlasilir bir "onay bekliyor" durumu olarak
  // gosteriyoruz (aksi halde bos liste + belirsiz bir hata mesaji goruyorlardi).
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setIsRefreshing(true);
      try {
        const res = await serviceRequestsApi.listNearbyServiceRequests();
        setRequests(res.items);
        setIsPendingApproval(false);
      } catch (e) {
        if (e instanceof ApiError && e.status === 403) {
          setIsPendingApproval(true);
        } else {
          show(e instanceof ApiError ? e.message : "Talepler yüklenemedi.", "error");
        }
      } finally {
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    },
    [show]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (isInitialLoading) {
    return (
      <ScreenContainer>
        <Header title="Usta Panelim" onBack={() => navigation.goBack()} />
        <View style={{ padding: spacing.lg }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={84} radius={radius.xl} style={{ marginBottom: spacing.sm }} />
          ))}
        </View>
      </ScreenContainer>
    );
  }

  if (isPendingApproval) {
    return (
      <ScreenContainer>
        <Header title="Usta Panelim" onBack={() => navigation.goBack()} />
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={36} color={theme.textSecondary} />
          <Text variant="body" weight="semibold" style={{ marginTop: spacing.sm, textAlign: "center" }}>
            Başvurun inceleniyor
          </Text>
          <Text variant="bodySmall" color="secondary" style={{ marginTop: 4, textAlign: "center", paddingHorizontal: spacing.lg }}>
            Admin onayından sonra buradan gelen talepleri görüp teklif verebileceksin.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Header title="Usta Panelim" onBack={() => navigation.goBack()} />

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} tintColor={theme.primary} />}
        contentContainerStyle={{ padding: spacing.lg, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="file-tray-outline" size={36} color={theme.textSecondary} />
            <Text variant="body" color="secondary" style={{ marginTop: spacing.sm, textAlign: "center" }}>
              Şu an şehrinde/uzmanlığında sana uygun açık talep yok.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Reveal delay={index * 50}>
            <Card
              onPress={() => navigation.navigate("SubmitOffer", { serviceRequest: item })}
              style={{ marginBottom: spacing.sm }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Text variant="body" weight="bold" style={{ flex: 1 }} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.isUrgent ? <Badge label="Acil" tone="danger" /> : null}
              </View>
              <Text variant="bodySmall" color="secondary" numberOfLines={2} style={{ marginTop: 4 }}>
                {item.description}
              </Text>
              <Text variant="caption" color="secondary" style={{ marginTop: spacing.xs }}>
                {SPECIALTY_LABELS[item.specialty]} · {item.city}
                {item.marina ? ` · ${item.marina}` : ""} · {formatDate(item.createdAt)}
              </Text>
            </Card>
          </Reveal>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: "center", paddingTop: spacing.xxxl },
});

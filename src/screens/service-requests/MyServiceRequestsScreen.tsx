import { useCallback, useState } from "react";
import { FlatList, View, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as serviceRequestsApi from "@/api/serviceRequests";
import { useTheme } from "@/theme/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import { Text, Card, Badge, ScreenContainer, Reveal, Skeleton, useToast } from "@/components/ui";
import type { MainTabParamList } from "@/navigation/MainTabs";
import type { AppStackParamList } from "@/navigation/RootNavigator";
import type { ServiceRequest, ServiceRequestStatus } from "@/types/mico";
import { SPECIALTY_LABELS } from "@/types/mico";
import { ApiError } from "@/api/client";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "ServiceRequests">,
  NativeStackScreenProps<AppStackParamList>
>;

const STATUS_TONE: Record<ServiceRequestStatus, "success" | "warning" | "danger" | "neutral"> = {
  OPEN: "neutral",
  OFFER_RECEIVED: "warning",
  ASSIGNED: "success",
  COMPLETED: "success",
  CANCELLED: "danger",
};

const STATUS_LABEL: Record<ServiceRequestStatus, string> = {
  OPEN: "Teklif bekleniyor",
  OFFER_RECEIVED: "Teklif geldi",
  ASSIGNED: "Usta atandı",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal edildi",
};

const STATUS_ICON: Partial<Record<ServiceRequestStatus, keyof typeof Ionicons.glyphMap>> = {
  OPEN: "hourglass-outline",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

export function MyServiceRequestsScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { show } = useToast();
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setIsRefreshing(true);
      try {
        const res = await serviceRequestsApi.listMyServiceRequests();
        setRequests(res.items);
      } catch (e) {
        show(e instanceof ApiError ? e.message : "Servis talepleri yüklenemedi.", "error");
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
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: insets.top + spacing.sm, paddingBottom: spacing.sm }}>
          <Text variant="h1" weight="extrabold">
            Teklifler
          </Text>
        </View>
        <View style={{ paddingHorizontal: spacing.lg }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={72} radius={radius.xl} style={{ marginBottom: spacing.sm }} />
          ))}
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: insets.top + spacing.sm, paddingBottom: spacing.sm }}>
        <Text variant="h1" weight="extrabold">
          Teklifler
        </Text>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} tintColor={theme.primary} />}
        contentContainerStyle={{ padding: spacing.lg, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="pricetag-outline" size={36} color={theme.textSecondary} />
            <Text variant="body" color="secondary" style={{ marginTop: spacing.sm, textAlign: "center" }}>
              Henüz servis talebin yok. Alttaki + butonuyla oluşturabilirsin.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Reveal delay={index * 50}>
            <Card
              onPress={() => navigation.navigate("Offers", { serviceRequest: item })}
              style={{ marginBottom: spacing.sm }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Text variant="body" weight="bold" style={{ flex: 1 }} numberOfLines={1}>
                  {item.title}
                </Text>
                <Badge label={STATUS_LABEL[item.status]} tone={STATUS_TONE[item.status]} icon={STATUS_ICON[item.status]} />
              </View>
              <Text variant="caption" color="secondary" style={{ marginTop: 4 }}>
                {SPECIALTY_LABELS[item.specialty]} · {item.city} · {formatDate(item.createdAt)}
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

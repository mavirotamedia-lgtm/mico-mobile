import { useCallback, useState } from "react";
import { FlatList, View, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as serviceRequestsApi from "@/api/serviceRequests";
import * as conversationsApi from "@/api/conversations";
import { useTheme } from "@/theme/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import { Text, Card, Badge, Button, Header, ScreenContainer, Reveal, Skeleton, ServiceStatusStepper, useToast } from "@/components/ui";
import type { AppStackParamList } from "@/navigation/RootNavigator";
import type { ServiceRequest } from "@/types/mico";
import { SPECIALTY_LABELS } from "@/types/mico";
import { ApiError } from "@/api/client";

type Props = NativeStackScreenProps<AppStackParamList, "MyJobs">;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

export function MyJobsScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { show } = useToast();
  const [jobs, setJobs] = useState<ServiceRequest[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [messagingId, setMessagingId] = useState<string | null>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setIsRefreshing(true);
      try {
        const res = await serviceRequestsApi.listMyJobs();
        setJobs(res.items);
      } catch (e) {
        show(e instanceof ApiError ? e.message : "İşler yüklenemedi.", "error");
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

  async function handleMessage(item: ServiceRequest) {
    if (!item.owner) return;
    setMessagingId(item.id);
    try {
      const conversation = await conversationsApi.getOrCreateConversation(item.owner.id);
      navigation.navigate("Chat", { conversationId: conversation.id, otherUserName: item.owner.name });
    } catch (e) {
      show(e instanceof ApiError ? e.message : "Sohbet başlatılamadı.", "error");
    } finally {
      setMessagingId(null);
    }
  }

  if (isInitialLoading) {
    return (
      <ScreenContainer>
        <Header title="Yaptığım İşler" onBack={() => navigation.goBack()} />
        <View style={{ padding: spacing.lg }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={140} radius={radius.xl} style={{ marginBottom: spacing.sm }} />
          ))}
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Header title="Yaptığım İşler" onBack={() => navigation.goBack()} />

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} tintColor={theme.primary} />}
        contentContainerStyle={{ padding: spacing.lg, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="briefcase-outline" size={36} color={theme.textSecondary} />
            <Text variant="body" color="secondary" style={{ marginTop: spacing.sm, textAlign: "center" }}>
              Henüz kabul edilmiş bir teklifin yok. İş kaydın burada birikecek.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Reveal delay={index * 60}>
            <Card style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Text variant="body" weight="bold" style={{ flex: 1 }} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.isUrgent ? <Badge label="Acil" tone="danger" /> : null}
              </View>
              <Text variant="caption" color="secondary" style={{ marginTop: 4 }}>
                {SPECIALTY_LABELS[item.specialty]} · {item.city}
                {item.marina ? ` · ${item.marina}` : ""} · {formatDate(item.createdAt)}
              </Text>
              {item.owner ? (
                <Text variant="bodySmall" weight="semibold" style={{ marginTop: spacing.xs }}>
                  Tekne sahibi: {item.owner.name}
                </Text>
              ) : null}

              <View style={{ marginTop: spacing.md }}>
                <ServiceStatusStepper status={item.status} />
              </View>

              <Button
                label="Mesaj"
                variant="secondary"
                icon="chatbubble-outline"
                onPress={() => handleMessage(item)}
                loading={messagingId === item.id}
                disabled={messagingId !== null && messagingId !== item.id}
                style={{ marginTop: spacing.md }}
              />
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

import { useCallback, useState } from "react";
import { FlatList, View, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as notificationsApi from "@/api/notifications";
import { useTheme } from "@/theme/ThemeContext";
import { spacing } from "@/theme/tokens";
import { Text, Card, Header, ScreenContainer, useToast } from "@/components/ui";
import type { AppStackParamList } from "@/navigation/RootNavigator";
import type { AppNotification, NotificationType } from "@/types/mico";
import { ApiError } from "@/api/client";

type Props = NativeStackScreenProps<AppStackParamList, "Notifications">;

const NOTIFICATION_ICON: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  MAINTENANCE_DUE: "construct-outline",
  SERVICE_OFFER_RECEIVED: "pricetag-outline",
  SERVICE_OFFER_ACCEPTED: "checkmark-circle-outline",
  SERVICE_OFFER_DECLINED: "close-circle-outline",
  SERVICE_REQUEST_CANCELLED: "close-circle-outline",
  SERVICE_REQUEST_COMPLETED: "checkmark-done-circle-outline",
  NEW_MESSAGE: "chatbubble-outline",
  REVIEW_RECEIVED: "star-outline",
  CRAFTSMAN_APPROVED: "shield-checkmark-outline",
  CRAFTSMAN_REJECTED: "close-circle-outline",
  TOKEN_LOW: "wallet-outline",
  ADMIN_ANNOUNCEMENT: "megaphone-outline",
};

function formatTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  return isToday
    ? date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
}

export function NotificationsScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { show } = useToast();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await notificationsApi.listNotifications();
      setNotifications(res.items);
    } catch (e) {
      show(e instanceof ApiError ? e.message : "Bildirimler yüklenemedi.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [show]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  async function handlePress(notification: AppNotification) {
    if (notification.readAt) return;
    setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, readAt: new Date().toISOString() } : n)));
    try {
      await notificationsApi.markAsRead(notification.id);
    } catch (e) {
      show(e instanceof ApiError ? e.message : "Bildirim güncellenemedi.", "error");
      load();
    }
  }

  async function handleMarkAllRead() {
    const previous = notifications;
    setNotifications((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })));
    try {
      await notificationsApi.markAllAsRead();
    } catch (e) {
      show(e instanceof ApiError ? e.message : "Bildirimler güncellenemedi.", "error");
      setNotifications(previous);
    }
  }

  return (
    <ScreenContainer>
      <Header title="Bildirimler" onBack={() => navigation.goBack()} />

      {unreadCount > 0 ? (
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xs, alignItems: "flex-end" }}>
          <Text variant="bodySmall" weight="semibold" color="accent" onPress={handleMarkAllRead}>
            Tümünü Okundu İşaretle
          </Text>
        </View>
      ) : null}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={theme.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-outline" size={36} color={theme.textSecondary} />
            <Text variant="body" color="secondary" style={{ marginTop: spacing.sm, textAlign: "center" }}>
              Henüz bildirimin yok.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isUnread = !item.readAt;
          return (
            <Card
              onPress={() => handlePress(item)}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                marginBottom: spacing.sm,
                backgroundColor: isUnread ? theme.surfaceAlt : theme.surface,
              }}
            >
              <View style={[styles.icon, { backgroundColor: theme.surface }]}>
                <Ionicons name={NOTIFICATION_ICON[item.type]} size={18} color={theme.primary} />
              </View>
              <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text variant="body" weight={isUnread ? "bold" : "semibold"} style={{ flex: 1 }} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {isUnread ? <View style={[styles.dot, { backgroundColor: theme.primary }]} /> : null}
                </View>
                <Text variant="bodySmall" color="secondary" numberOfLines={2} style={{ marginTop: 2 }}>
                  {item.body}
                </Text>
                <Text variant="caption" color="secondary" style={{ marginTop: 4 }}>
                  {formatTime(item.createdAt)}
                </Text>
              </View>
            </Card>
          );
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: "center", paddingTop: spacing.xxxl },
  icon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  dot: { width: 8, height: 8, borderRadius: 4, marginLeft: spacing.xs },
});

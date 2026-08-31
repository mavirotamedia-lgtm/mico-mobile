import { useCallback, useState } from "react";
import { FlatList, View, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as conversationsApi from "@/api/conversations";
import { useAuth } from "@/store/AuthContext";
import { useTheme } from "@/theme/ThemeContext";
import { spacing } from "@/theme/tokens";
import { Text, Card, Avatar, Header, ScreenContainer, useToast } from "@/components/ui";
import type { AppStackParamList } from "@/navigation/RootNavigator";
import type { Conversation } from "@/types/mico";
import { ApiError } from "@/api/client";

type Props = NativeStackScreenProps<AppStackParamList, "Conversations">;

function formatLastMessageTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  return isToday
    ? date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
}

export function ConversationsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { show } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await conversationsApi.listMyConversations();
      setConversations(res.items);
    } catch (e) {
      show(e instanceof ApiError ? e.message : "Mesajlar yüklenemedi.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [show]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScreenContainer>
      <Header title="Mesajlarım" onBack={() => navigation.goBack()} />

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={theme.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={36} color={theme.textSecondary} />
            <Text variant="body" color="secondary" style={{ marginTop: spacing.sm, textAlign: "center" }}>
              Henüz mesajın yok. Bir ustayla iletişime geçtiğinde sohbetlerin burada görünecek.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const other = item.participantAId === user?.id ? item.participantB : item.participantA;
          return (
            <Card
              onPress={() => navigation.navigate("Chat", { conversationId: item.id, otherUserName: other.name, otherUserId: other.id })}
              style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.sm }}
            >
              <Avatar name={other.name} size={48} />
              <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                <Text variant="body" weight="semibold" numberOfLines={1}>
                  {other.name}
                </Text>
                <Text variant="caption" color="secondary" numberOfLines={1}>
                  {formatLastMessageTime(item.lastMessageAt)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </Card>
          );
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: "center", paddingTop: spacing.xxxl },
});

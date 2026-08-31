import { useCallback, useState } from "react";
import { FlatList, View, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as blocksApi from "@/api/blocks";
import { useTheme } from "@/theme/ThemeContext";
import { spacing } from "@/theme/tokens";
import { Text, Card, Avatar, Button, Header, ScreenContainer, useToast } from "@/components/ui";
import type { AppStackParamList } from "@/navigation/RootNavigator";
import type { BlockedUser } from "@/types/mico";
import { ApiError } from "@/api/client";

type Props = NativeStackScreenProps<AppStackParamList, "BlockedUsers">;

export function BlockedUsersScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { show } = useToast();
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await blocksApi.listBlockedUsers();
      setBlocked(res.items);
    } catch (e) {
      show(e instanceof ApiError ? e.message : "Liste yüklenemedi.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [show]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleUnblock(user: BlockedUser) {
    setUnblockingId(user.id);
    try {
      await blocksApi.unblockUser(user.id);
      setBlocked((prev) => prev.filter((u) => u.id !== user.id));
      show(`${user.name} için engel kaldırıldı.`, "success");
    } catch (e) {
      show(e instanceof ApiError ? e.message : "Engel kaldırılamadı.", "error");
    } finally {
      setUnblockingId(null);
    }
  }

  return (
    <ScreenContainer>
      <Header title="Engellenen Kullanıcılar" onBack={() => navigation.goBack()} />
      <FlatList
        data={blocked}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={theme.primary} />}
        contentContainerStyle={{ padding: spacing.lg, flexGrow: 1 }}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Ionicons name="ban-outline" size={36} color={theme.textSecondary} />
              <Text variant="body" color="secondary" style={{ marginTop: spacing.sm, textAlign: "center" }}>
                Engellediğin kimse yok.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Card style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.sm }}>
            <Avatar name={item.name} uri={item.avatarUrl} size={40} />
            <Text variant="body" weight="semibold" style={{ marginLeft: spacing.sm, flex: 1 }} numberOfLines={1}>
              {item.name}
            </Text>
            <Button
              label="Engeli Kaldır"
              variant="secondary"
              fullWidth={false}
              onPress={() => handleUnblock(item)}
              loading={unblockingId === item.id}
              disabled={unblockingId !== null && unblockingId !== item.id}
            />
          </Card>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: "center", paddingTop: spacing.xxxl },
});

import { useCallback, useState } from "react";
import { FlatList, View, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as favoritesApi from "@/api/favorites";
import * as craftsmenApi from "@/api/craftsmen";
import { useTheme } from "@/theme/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import { Text, Card, Avatar, Rating, Badge, Header, ScreenContainer, Reveal, Skeleton, useToast } from "@/components/ui";
import type { AppStackParamList } from "@/navigation/RootNavigator";
import type { Craftsman } from "@/types/mico";
import { SPECIALTY_LABELS } from "@/types/mico";
import { ApiError } from "@/api/client";

type Props = NativeStackScreenProps<AppStackParamList, "Favorites">;

export function FavoritesScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { show } = useToast();
  const [craftsmen, setCraftsmen] = useState<Craftsman[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setIsRefreshing(true);
      try {
        const favorites = await favoritesApi.listFavorites("CRAFTSMAN");
        const resolved = await Promise.all(
          favorites.items.map((f) => craftsmenApi.getCraftsman(f.targetId).catch(() => null))
        );
        setCraftsmen(resolved.filter((c): c is Craftsman => c !== null));
      } catch (e) {
        show(e instanceof ApiError ? e.message : "Favoriler yüklenemedi.", "error");
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
        <Header title="Favori Ustalarım" onBack={() => navigation.goBack()} />
        <View style={{ padding: spacing.lg }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={76} radius={radius.xl} style={{ marginBottom: spacing.sm }} />
          ))}
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Header title="Favori Ustalarım" onBack={() => navigation.goBack()} />

      <FlatList
        data={craftsmen}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} tintColor={theme.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="heart-outline" size={36} color={theme.textSecondary} />
            <Text variant="body" color="secondary" style={{ marginTop: spacing.sm, textAlign: "center" }}>
              Henüz favori ustan yok. Bir usta profilindeki kalp ikonuna dokunarak ekleyebilirsin.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Reveal delay={index * 50}>
            <Card
              onPress={() => navigation.navigate("CraftsmanDetail", { craftsmanId: item.id })}
              style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.sm }}
            >
              <Avatar name={item.businessName ?? "Usta"} uri={item.avatar} size={48} />
              <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text variant="body" weight="bold" numberOfLines={1} style={{ flex: 1 }}>
                    {item.businessName ?? SPECIALTY_LABELS[item.specialty]}
                  </Text>
                  {item.isVerified ? <Ionicons name="checkmark-circle" size={16} color={theme.success} /> : null}
                </View>
                <Rating value={item.ratingAvg} count={item.ratingCount} />
                <Text variant="caption" color="secondary" numberOfLines={1}>
                  {item.city}
                  {item.marina ? ` · ${item.marina}` : ""}
                </Text>
              </View>
              <Badge label={SPECIALTY_LABELS[item.specialty]} tone="neutral" />
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

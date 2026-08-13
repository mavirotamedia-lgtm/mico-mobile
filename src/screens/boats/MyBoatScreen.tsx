import { useCallback, useState } from "react";
import { FlatList, View, StyleSheet, Image, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as boatsApi from "@/api/boats";
import { Text, Card, Button, ScreenContainer, useToast } from "@/components/ui";
import { useTheme } from "@/theme/ThemeContext";
import { spacing } from "@/theme/tokens";
import type { Boat } from "@/types/api";
import { ApiError } from "@/api/client";
import type { MainTabParamList } from "@/navigation/MainTabs";
import type { AppStackParamList } from "@/navigation/RootNavigator";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "MyBoat">,
  NativeStackScreenProps<AppStackParamList>
>;

const BOAT_TYPE_LABEL: Record<Boat["type"], string> = {
  SAILBOAT: "Yelkenli",
  MOTORBOAT: "Motorbot",
  YACHT: "Yat",
  OTHER: "Diğer",
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=600&q=60";

export function MyBoatScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { show } = useToast();
  const insets = useSafeAreaInsets();
  const [boats, setBoats] = useState<Boat[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    setIsRefreshing(true);
    try {
      setBoats(await boatsApi.listBoats());
    } catch (e) {
      show(e instanceof ApiError ? e.message : "Tekneler yüklenemedi.", "error");
    } finally {
      setIsRefreshing(false);
    }
  }, [show]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScreenContainer>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: insets.top + spacing.sm, paddingBottom: spacing.sm }}>
        <Text variant="h1" weight="bold">
          Teknem
        </Text>
      </View>

      <FlatList
        data={boats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={load} tintColor={theme.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="boat-outline" size={40} color={theme.textSecondary} />
            <Text variant="body" color="secondary" style={{ marginTop: spacing.sm, textAlign: "center" }}>
              Henüz tekne eklemedin.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card
            onPress={() => navigation.navigate("BoatDetail", { boatId: item.id })}
            style={{ padding: 0, overflow: "hidden", marginBottom: spacing.md }}
          >
            <Image source={{ uri: item.image ?? FALLBACK_IMAGE }} style={{ width: "100%", height: 140 }} />
            <View style={{ padding: spacing.md }}>
              <Text variant="h2" weight="bold">
                {item.name}
              </Text>
              <Text variant="bodySmall" color="secondary" style={{ marginTop: 2 }}>
                {[BOAT_TYPE_LABEL[item.type], item.brand, item.homePort].filter(Boolean).join(" · ")}
              </Text>
            </View>
          </Card>
        )}
      />

      <View style={{ padding: spacing.lg, paddingTop: 0 }}>
        <Button label="+ Tekne Ekle" onPress={() => navigation.navigate("AddBoat")} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: "center", justifyContent: "center", paddingTop: spacing.xxxl },
});

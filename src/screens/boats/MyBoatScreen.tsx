import { useCallback, useState } from "react";
import { FlatList, View, StyleSheet, RefreshControl, Alert, Pressable, Animated } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as boatsApi from "@/api/boats";
import { Text, Card, Button, BoatVisual, ScreenContainer, useToast } from "@/components/ui";
import { useTheme } from "@/theme/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
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

export function MyBoatScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { show } = useToast();
  const insets = useSafeAreaInsets();
  const [boats, setBoats] = useState<Boat[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  function confirmDelete(boat: Boat) {
    Alert.alert("Tekneyi Sil", `"${boat.name}" kalıcı olarak silinecek. Emin misin?`, [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          setDeletingId(boat.id);
          try {
            await boatsApi.deleteBoat(boat.id);
            setBoats((prev) => prev.filter((b) => b.id !== boat.id));
            show("Tekne silindi", "success");
          } catch (e) {
            show(e instanceof ApiError ? e.message : "Tekne silinemedi.", "error");
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  }

  return (
    <ScreenContainer>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: insets.top + spacing.sm, paddingBottom: spacing.sm }}>
        <Text variant="h1" weight="extrabold">
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
          <Swipeable
            renderRightActions={(_progress, dragX) => (
              <DeleteAction dragX={dragX} isDeleting={deletingId === item.id} onPress={() => confirmDelete(item)} />
            )}
            overshootRight={false}
          >
            <Card
              onPress={() => navigation.navigate("BoatDetail", { boatId: item.id })}
              style={{ padding: 0, overflow: "hidden", marginBottom: spacing.md }}
            >
              <BoatVisual image={item.image} type={item.type} style={{ width: "100%", height: 140 }} />
              <View style={{ padding: spacing.md }}>
                <Text variant="h2" weight="bold">
                  {item.name}
                </Text>
                <Text variant="bodySmall" color="secondary" style={{ marginTop: 2 }}>
                  {[BOAT_TYPE_LABEL[item.type], item.brand, item.homePort].filter(Boolean).join(" · ")}
                </Text>
              </View>
            </Card>
          </Swipeable>
        )}
      />

      <View style={{ padding: spacing.lg, paddingTop: 0 }}>
        <Button label="+ Tekne Ekle" onPress={() => navigation.navigate("AddBoat")} />
      </View>
    </ScreenContainer>
  );
}

function DeleteAction({ dragX, isDeleting, onPress }: { dragX: Animated.AnimatedInterpolation<number>; isDeleting: boolean; onPress: () => void }) {
  const { theme } = useTheme();
  const scale = dragX.interpolate({ inputRange: [-80, 0], outputRange: [1, 0.5], extrapolate: "clamp" });

  return (
    <Pressable
      onPress={onPress}
      disabled={isDeleting}
      style={[styles.deleteAction, { backgroundColor: theme.danger, opacity: isDeleting ? 0.6 : 1 }]}
    >
      <Animated.View style={{ transform: [{ scale }], alignItems: "center" }}>
        <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
        <Text variant="caption" weight="semibold" style={{ color: "#FFFFFF", marginTop: 4 }}>
          Sil
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: "center", justifyContent: "center", paddingTop: spacing.xxxl },
  deleteAction: {
    width: 76,
    marginBottom: spacing.md,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
});

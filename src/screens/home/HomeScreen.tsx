import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, View, StyleSheet, Image } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "@/store/AuthContext";
import { useTheme } from "@/theme/ThemeContext";
import { spacing, radius, palette } from "@/theme/tokens";
import { Text, Card, Rating, Badge, Avatar, ScreenContainer, Touchable, useToast } from "@/components/ui";
import * as boatsApi from "@/api/boats";
import * as craftsmenApi from "@/api/craftsmen";
import { ApiError } from "@/api/client";
import type { Boat } from "@/types/api";
import type { Craftsman } from "@/types/mico";
import { SPECIALTY_LABELS } from "@/types/mico";
import type { MainTabParamList } from "@/navigation/MainTabs";
import type { AppStackParamList } from "@/navigation/RootNavigator";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Home">,
  NativeStackScreenProps<AppStackParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { show } = useToast();
  const insets = useSafeAreaInsets();
  const [boat, setBoat] = useState<Boat | null>(null);
  const [craftsmen, setCraftsmen] = useState<Craftsman[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [boats, craftsmenRes] = await Promise.all([boatsApi.listBoats(), craftsmenApi.listCraftsmen()]);
      setBoat(boats[0] ?? null);
      setCraftsmen(craftsmenRes.items.slice(0, 4));
    } catch (e) {
      show(e instanceof ApiError ? e.message : "Ana sayfa yüklenemedi.", "error");
    } finally {
      setIsInitialLoading(false);
    }
  }, [show]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Ustanin bir teknesi varsa "Bakim Takibi" dogrudan o teknenin detayina
  // gider (bakim gecmisi orada) — teknesi yoksa once tekne eklemeye yonlendirir.
  const quickActions: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }[] = [
    { icon: "construct-outline", label: "Servis Bul", onPress: () => navigation.navigate("CraftsmanList") },
    {
      icon: "time-outline",
      label: "Bakım Takibi",
      onPress: () => (boat ? navigation.navigate("BoatDetail", { boatId: boat.id }) : navigation.navigate("AddBoat")),
    },
    { icon: "pricetag-outline", label: "Teklifler", onPress: () => navigation.navigate("ServiceRequests") },
  ];

  if (isInitialLoading) {
    return (
      <ScreenContainer>
        <View style={styles.centerFill}>
          <ActivityIndicator color={theme.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: palette.navy950, paddingTop: insets.top + spacing.sm }]}>
          <View style={styles.headerRow}>
            <Text variant="h1" color="onDark" weight="bold">
              Merhaba, {user?.name?.split(" ")[0] ?? "Kaptan"}
            </Text>
            <View style={styles.bellButton}>
              <Ionicons name="notifications-outline" size={20} color={theme.textOnDark} />
            </View>
          </View>

          {boat ? (
            <Card
              onPress={() => navigation.navigate("BoatDetail", { boatId: boat.id })}
              style={{ padding: 0, overflow: "hidden", marginTop: spacing.lg }}
            >
              <View style={{ flexDirection: "row", height: 96 }}>
                <View style={{ flex: 1, padding: spacing.md, justifyContent: "center" }}>
                  <Text variant="caption" color="secondary">
                    Teknem
                  </Text>
                  <Text variant="h2" weight="bold" numberOfLines={1}>
                    {boat.name}
                  </Text>
                  {boat.homePort ? (
                    <Text variant="bodySmall" color="secondary" numberOfLines={1}>
                      {boat.homePort}
                    </Text>
                  ) : null}
                </View>
                <Image
                  source={{ uri: boat.image ?? "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=400&q=60" }}
                  style={{ width: 130, height: "100%" }}
                />
              </View>
            </Card>
          ) : (
            <Card onPress={() => navigation.navigate("AddBoat")} style={{ marginTop: spacing.lg }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="add-circle-outline" size={28} color={theme.primary} />
                <View style={{ marginLeft: spacing.sm }}>
                  <Text variant="body" weight="semibold">
                    İlk tekneni ekle
                  </Text>
                  <Text variant="caption" color="secondary">
                    Miço tekneni tanısın, bakımını takip etsin.
                  </Text>
                </View>
              </View>
            </Card>
          )}
        </View>

        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <SectionTitle>Hızlı İşlemler</SectionTitle>
          <View style={styles.quickRow}>
            {quickActions.map((action) => (
              <Touchable
                key={action.label}
                haptic
                scaleTo={0.95}
                onPress={action.onPress}
                style={[styles.quickItem, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadowColor }]}
              >
                <View style={[styles.quickIcon, { backgroundColor: theme.surfaceAlt }]}>
                  <Ionicons name={action.icon} size={22} color={theme.primary} />
                </View>
                <Text variant="caption" weight="semibold" style={{ marginTop: spacing.xs, textAlign: "center" }}>
                  {action.label}
                </Text>
              </Touchable>
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <View style={styles.sectionHeaderRow}>
            <SectionTitle>Yakındaki Ustalar</SectionTitle>
            <Text variant="bodySmall" weight="semibold" color="accent" onPress={() => navigation.navigate("CraftsmanList")}>
              Tümünü Gör
            </Text>
          </View>

          {craftsmen.length === 0 ? (
            <Card>
              <Text variant="bodySmall" color="secondary">
                Henüz onaylı usta bulunmuyor.
              </Text>
            </Card>
          ) : (
            craftsmen.map((c) => (
              <Card
                key={c.id}
                onPress={() => navigation.navigate("CraftsmanDetail", { craftsmanId: c.id })}
                style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.sm }}
              >
                <Avatar name={c.businessName ?? "Usta"} uri={c.avatar} size={52} />
                <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                  <Text variant="body" weight="semibold" numberOfLines={1}>
                    {c.businessName ?? SPECIALTY_LABELS[c.specialty]}
                  </Text>
                  <Rating value={c.ratingAvg} count={c.ratingCount} />
                  <Text variant="caption" color="secondary" numberOfLines={1} style={{ marginTop: 2 }}>
                    {c.city}
                  </Text>
                </View>
                <Badge label={SPECIALTY_LABELS[c.specialty]} tone="neutral" />
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text variant="h2" weight="bold" style={{ marginBottom: spacing.sm }}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  centerFill: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  quickRow: { flexDirection: "row", gap: spacing.sm },
  quickItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  quickIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});

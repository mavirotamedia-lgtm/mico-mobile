import { useCallback, useState } from "react";
import { ScrollView, View, StyleSheet, Image, Pressable } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "@/store/AuthContext";
import { useTheme } from "@/theme/ThemeContext";
import { spacing, radius } from "@/theme/tokens";
import { Text, Card, Rating, Badge, Avatar, ScreenContainer } from "@/components/ui";
import * as boatsApi from "@/api/boats";
import * as craftsmenApi from "@/api/craftsmen";
import type { Boat } from "@/types/api";
import type { Craftsman } from "@/types/mico";
import { SPECIALTY_LABELS } from "@/types/mico";
import type { MainTabParamList } from "@/navigation/MainTabs";
import type { AppStackParamList } from "@/navigation/RootNavigator";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Home">,
  NativeStackScreenProps<AppStackParamList>
>;

const QUICK_ACTIONS: { icon: keyof typeof Ionicons.glyphMap; label: string; target: keyof AppStackParamList | "MyBoat" | "ServiceRequests" }[] = [
  { icon: "construct-outline", label: "Servis Bul", target: "CraftsmanList" },
  { icon: "boat-outline", label: "Teknem", target: "MyBoat" },
  { icon: "pricetag-outline", label: "Teklifler", target: "ServiceRequests" },
];

export function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [boat, setBoat] = useState<Boat | null>(null);
  const [craftsmen, setCraftsmen] = useState<Craftsman[]>([]);

  const load = useCallback(async () => {
    const [boats, craftsmenRes] = await Promise.all([boatsApi.listBoats(), craftsmenApi.listCraftsmen()]);
    setBoat(boats[0] ?? null);
    setCraftsmen(craftsmenRes.items.slice(0, 4));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
          <View>
            <Text variant="bodySmall" color="secondary">
              Merhaba,
            </Text>
            <Text variant="h1" weight="bold">
              {user?.name ?? "Kaptan"}
            </Text>
          </View>
          <Pressable style={[styles.bellButton, { backgroundColor: theme.surfaceAlt }]} hitSlop={8}>
            <Ionicons name="notifications-outline" size={20} color={theme.textPrimary} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
          {boat ? (
            <Card onPress={() => navigation.navigate("BoatDetail", { boatId: boat.id })} style={{ padding: 0, overflow: "hidden" }}>
              <View style={{ flexDirection: "row" }}>
                <Image
                  source={{ uri: boat.image ?? "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=400&q=60" }}
                  style={{ width: 96, height: 96 }}
                />
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
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} style={{ alignSelf: "center", marginRight: spacing.md }} />
              </View>
            </Card>
          ) : (
            <Card onPress={() => navigation.navigate("AddBoat")}>
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
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.label}
                style={[styles.quickItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() =>
                  action.target === "MyBoat" || action.target === "ServiceRequests"
                    ? navigation.navigate(action.target)
                    : navigation.navigate(action.target as "CraftsmanList")
                }
              >
                <View style={[styles.quickIcon, { backgroundColor: theme.surfaceAlt }]}>
                  <Ionicons name={action.icon} size={20} color={theme.primary} />
                </View>
                <Text variant="caption" weight="semibold" style={{ marginTop: 6, textAlign: "center" }}>
                  {action.label}
                </Text>
              </Pressable>
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
                <Avatar name={c.businessName ?? "Usta"} uri={c.avatar} size={44} />
                <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                  <Text variant="body" weight="semibold" numberOfLines={1}>
                    {c.businessName ?? SPECIALTY_LABELS[c.specialty]}
                  </Text>
                  <Rating value={c.ratingAvg} count={c.ratingCount} />
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: spacing.lg },
  bellButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  quickRow: { flexDirection: "row", gap: spacing.sm },
  quickItem: { flex: 1, alignItems: "center", padding: spacing.sm, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth },
  quickIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});

import { useCallback, useState } from "react";
import { ScrollView, View, StyleSheet, Image, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "@/store/AuthContext";
import { useTheme } from "@/theme/ThemeContext";
import { spacing, radius } from "@/theme/tokens";
import { Text, Card, Rating, Badge, Avatar, ScreenContainer, Touchable, Reveal, Skeleton, useToast } from "@/components/ui";
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

type QuickAction = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  primary?: boolean;
};

export function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { show } = useToast();
  const insets = useSafeAreaInsets();
  const [boat, setBoat] = useState<Boat | null>(null);
  const [craftsmen, setCraftsmen] = useState<Craftsman[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setIsRefreshing(true);
      try {
        const [boats, craftsmenRes] = await Promise.all([boatsApi.listBoats(), craftsmenApi.listCraftsmen()]);
        setBoat(boats[0] ?? null);
        setCraftsmen(craftsmenRes.items.slice(0, 4));
      } catch (e) {
        show(e instanceof ApiError ? e.message : "Ana sayfa yüklenemedi.", "error");
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

  // Tekne varsa "Bakim Takibi" dogrudan o teknenin detayina gider (bakim
  // gecmisi orada) — teknesi yoksa once tekne eklemeye yonlendirir.
  const quickActions: QuickAction[] = [
    { key: "newRequest", icon: "add-circle", label: "Yeni Talep", primary: true, onPress: () => navigation.navigate("CreateServiceRequest") },
    { key: "findCraftsman", icon: "construct-outline", label: "Usta Bul", onPress: () => navigation.navigate("CraftsmanList") },
    {
      key: "maintenance",
      icon: "build-outline",
      label: "Bakım Takibi",
      onPress: () => (boat ? navigation.navigate("BoatDetail", { boatId: boat.id }) : navigation.navigate("AddBoat")),
    },
    { key: "offers", icon: "pricetag-outline", label: "Tekliflerim", onPress: () => navigation.navigate("ServiceRequests") },
    { key: "myBoat", icon: "boat-outline", label: "Teknem", onPress: () => navigation.navigate("MyBoat") },
    { key: "profile", icon: "person-outline", label: "Profilim", onPress: () => navigation.navigate("Profile") },
  ];

  if (isInitialLoading) {
    return (
      <ScreenContainer>
        <LinearGradient
          colors={theme.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}
        >
          <View style={styles.headerRow}>
            <Skeleton width={150} height={26} style={{ backgroundColor: "rgba(255,255,255,0.14)" }} />
            <View style={styles.bellButton} />
          </View>
          <Skeleton width="100%" height={96} radius={radius.xl} style={{ marginTop: spacing.lg, backgroundColor: "rgba(255,255,255,0.10)" }} />
        </LinearGradient>

        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <Skeleton width={140} height={20} style={{ marginBottom: spacing.sm }} />
          <View style={styles.quickGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} width="31%" height={84} radius={radius.lg} style={{ marginBottom: spacing.sm }} />
            ))}
          </View>

          <Skeleton width={170} height={20} style={{ marginTop: spacing.md, marginBottom: spacing.sm }} />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={74} radius={radius.xl} style={{ marginBottom: spacing.sm }} />
          ))}
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} tintColor={theme.primary} />}
      >
        <LinearGradient
          colors={theme.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}
        >
          <Reveal>
            <View style={styles.headerRow}>
              <Text variant="display" color="onDark" weight="extrabold" style={{ fontSize: 26, lineHeight: 32 }}>
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
                <View style={{ flexDirection: "row", height: 104 }}>
                  <View style={{ flex: 1, padding: spacing.md, justifyContent: "center" }}>
                    <Text variant="caption" color="secondary">
                      Teknem
                    </Text>
                    <Text variant="h1" weight="extrabold" numberOfLines={1}>
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
                  <View style={[styles.emptyBoatIcon, { backgroundColor: theme.surfaceAlt }]}>
                    <Ionicons name="add" size={22} color={theme.primary} />
                  </View>
                  <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                    <Text variant="body" weight="semibold">
                      İlk tekneni ekle
                    </Text>
                    <Text variant="caption" color="secondary">
                      Miço tekneni tanısın, bakımını takip etsin.
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
                </View>
              </Card>
            )}
          </Reveal>
        </LinearGradient>

        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <Reveal delay={70}>
            <SectionTitle>Hızlı İşlemler</SectionTitle>
            <View style={styles.quickGrid}>
              {quickActions.map((action) => (
                <Touchable
                  key={action.key}
                  haptic
                  scaleTo={0.95}
                  onPress={action.onPress}
                  style={[
                    styles.quickItem,
                    action.primary
                      ? { backgroundColor: theme.primary, borderColor: theme.primary }
                      : { backgroundColor: theme.surface, borderColor: theme.border },
                    { shadowColor: theme.shadowColor },
                  ]}
                >
                  <View
                    style={[
                      styles.quickIcon,
                      { backgroundColor: action.primary ? "rgba(255,255,255,0.18)" : theme.surfaceAlt },
                    ]}
                  >
                    <Ionicons name={action.icon} size={22} color={action.primary ? theme.onPrimary : theme.primary} />
                  </View>
                  <Text
                    variant="bodySmall"
                    weight="bold"
                    style={{ marginTop: spacing.xs, textAlign: "center", color: action.primary ? theme.onPrimary : theme.textPrimary }}
                  >
                    {action.label}
                  </Text>
                </Touchable>
              ))}
            </View>
          </Reveal>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <Reveal delay={130}>
            <View style={styles.sectionHeaderRow}>
              <SectionTitle>Öne Çıkan Ustalar</SectionTitle>
              <Text variant="bodySmall" weight="semibold" color="accent" onPress={() => navigation.navigate("CraftsmanList")}>
                Tümünü Gör
              </Text>
            </View>
          </Reveal>

          {craftsmen.length === 0 ? (
            <Reveal delay={170}>
              <Card>
                <View style={{ alignItems: "center", paddingVertical: spacing.sm }}>
                  <Ionicons name="construct-outline" size={28} color={theme.textSecondary} />
                  <Text variant="bodySmall" color="secondary" style={{ marginTop: spacing.xs, textAlign: "center" }}>
                    Henüz onaylı usta bulunmuyor.
                  </Text>
                </View>
              </Card>
            </Reveal>
          ) : (
            craftsmen.map((c, index) => (
              <Reveal key={c.id} delay={170 + index * 60}>
                <Card
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
                  <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} style={{ marginLeft: spacing.xs }} />
                </Card>
              </Reveal>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text variant="h1" weight="extrabold" style={{ marginBottom: spacing.sm }}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
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
  emptyBoatIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  quickItem: {
    width: "31%",
    alignItems: "center",
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
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

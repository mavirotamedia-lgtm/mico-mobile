import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, FlatList, View, Image, StyleSheet, RefreshControl, useWindowDimensions } from "react-native";
import type { ImageSourcePropType } from "react-native";
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
import { Text, Card, Rating, Badge, Avatar, BoatVisual, ScreenContainer, Touchable, Reveal, Skeleton, useToast } from "@/components/ui";
import * as boatsApi from "@/api/boats";
import * as craftsmenApi from "@/api/craftsmen";
import * as notificationsApi from "@/api/notifications";
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
  icon: ImageSourcePropType;
  label: string;
  onPress: () => void;
  primary?: boolean;
};

const QUICK_ACTION_ICON = {
  newRequest: require("../../../assets/home-icons/home-newrequest.png"),
  findCraftsman: require("../../../assets/home-icons/home-find-craftsman.png"),
  maintenance: require("../../../assets/home-icons/home-maintenance.png"),
  offers: require("../../../assets/home-icons/home-offers.png"),
  myBoat: require("../../../assets/home-icons/home-myboat.png"),
  profile: require("../../../assets/home-icons/home-profile.png"),
} as const;

type PromoBanner = {
  key: string;
  source: ImageSourcePropType;
  onPress: () => void;
};

/** Basliklari, alt yaziyi ve gorseli tek parca iceren hazir banner kartlari. */
const PROMO_BANNER_ASPECT = 1774 / 887;

const PROMO_IMAGE = {
  calendar: require("../../../assets/promo-icons/promo-calendar.png"),
  support: require("../../../assets/promo-icons/promo-support.png"),
  craftsmen: require("../../../assets/promo-icons/promo-craftsmen.png"),
  boat: require("../../../assets/promo-icons/promo-boat.png"),
  offers: require("../../../assets/promo-icons/promo-offers.png"),
} as const;

export function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { show } = useToast();
  const insets = useSafeAreaInsets();
  const [boat, setBoat] = useState<Boat | null>(null);
  const [craftsmen, setCraftsmen] = useState<Craftsman[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setIsRefreshing(true);
      try {
        const [boats, craftsmenRes, notificationsRes] = await Promise.all([
          boatsApi.listBoats(),
          craftsmenApi.listCraftsmen(),
          notificationsApi.listNotifications(),
        ]);
        setBoat(boats[0] ?? null);
        setCraftsmen(craftsmenRes.items.slice(0, 4));
        setUnreadCount(notificationsRes.items.filter((n) => !n.readAt).length);
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
    { key: "newRequest", icon: QUICK_ACTION_ICON.newRequest, label: "Yeni Talep", primary: true, onPress: () => navigation.navigate("CreateServiceRequest") },
    { key: "findCraftsman", icon: QUICK_ACTION_ICON.findCraftsman, label: "Usta Bul", onPress: () => navigation.navigate("CraftsmanList") },
    {
      key: "maintenance",
      icon: QUICK_ACTION_ICON.maintenance,
      label: "Bakım Takibi",
      onPress: () => (boat ? navigation.navigate("BoatDetail", { boatId: boat.id }) : navigation.navigate("AddBoat")),
    },
    { key: "offers", icon: QUICK_ACTION_ICON.offers, label: "Tekliflerim", onPress: () => navigation.navigate("ServiceRequests") },
    { key: "myBoat", icon: QUICK_ACTION_ICON.myBoat, label: "Teknem", onPress: () => navigation.navigate("MyBoat") },
    { key: "profile", icon: QUICK_ACTION_ICON.profile, label: "Profilim", onPress: () => navigation.navigate("Profile") },
  ];

  const promoBanners: PromoBanner[] = [
    {
      key: "promo-calendar",
      source: PROMO_IMAGE.calendar,
      onPress: () => (boat ? navigation.navigate("BoatDetail", { boatId: boat.id }) : navigation.navigate("AddBoat")),
    },
    {
      key: "promo-support",
      source: PROMO_IMAGE.support,
      onPress: () => navigation.navigate("CraftsmanList"),
    },
    {
      key: "promo-craftsmen",
      source: PROMO_IMAGE.craftsmen,
      onPress: () => navigation.navigate("CraftsmanList"),
    },
    {
      key: "promo-boat",
      source: PROMO_IMAGE.boat,
      onPress: () => (boat ? navigation.navigate("BoatDetail", { boatId: boat.id }) : navigation.navigate("AddBoat")),
    },
    {
      key: "promo-offers",
      source: PROMO_IMAGE.offers,
      onPress: () => navigation.navigate("ServiceRequests"),
    },
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
              <Touchable
                onPress={() => navigation.navigate("Notifications")}
                haptic
                scaleTo={0.9}
                style={styles.bellButton}
              >
                <Ionicons name="notifications-outline" size={20} color={theme.textOnDark} />
                {unreadCount > 0 ? (
                  <View style={[styles.bellBadge, { backgroundColor: theme.danger, borderColor: theme.heroGradient[0] }]} />
                ) : null}
              </Touchable>
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
                  <BoatVisual image={boat.image} type={boat.type} style={{ width: 130, height: "100%" }} />
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

          <Reveal delay={50}>
            <PromoBannerCarousel banners={promoBanners} theme={theme} />
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
                    <Image source={action.icon} style={styles.quickIconImage} resizeMode="contain" />
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

/**
 * Teknem kartinin hemen altinda, hero'nun lacivert zeminiyle kaynasik
 * (ayri bir kart/kutu degil) 5 kartlik tanitim serisi. Hem elle
 * kaydirilabiliyor (yatay FlatList, pagingEnabled) hem de 5 saniyede
 * bir kendiliginden bir sonraki karta geciyor — elle kaydirma sirasinda
 * otomatik gecis sayaci sifirlanir.
 */
function PromoBannerCarousel({ banners, theme }: { banners: PromoBanner[]; theme: ReturnType<typeof useTheme>["theme"] }) {
  const { width } = useWindowDimensions();
  const cardWidth = width - spacing.lg * 2;
  const [activeIndex, setActiveIndex] = useState(0);
  const indexRef = useRef(0);
  const listRef = useRef<FlatList<PromoBanner>>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoplay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (banners.length <= 1) return;
    intervalRef.current = setInterval(() => {
      const next = (indexRef.current + 1) % banners.length;
      listRef.current?.scrollToIndex({ index: next, animated: true });
    }, 5000);
  }, [banners.length]);

  useEffect(() => {
    startAutoplay();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startAutoplay]);

  if (banners.length === 0) return null;

  return (
    <View style={{ marginTop: spacing.lg }}>
      <FlatList
        ref={listRef}
        data={banners}
        keyExtractor={(b) => b.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({ length: cardWidth, offset: cardWidth * index, index })}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / cardWidth);
          const clamped = Math.max(0, Math.min(idx, banners.length - 1));
          setActiveIndex(clamped);
          indexRef.current = clamped;
          startAutoplay();
        }}
        renderItem={({ item }) => (
          <Touchable onPress={item.onPress} haptic scaleTo={0.99} style={{ width: cardWidth }}>
            <Image
              source={item.source}
              style={{ width: cardWidth, height: cardWidth / PROMO_BANNER_ASPECT }}
              resizeMode="contain"
            />
          </Touchable>
        )}
      />
      {banners.length > 1 ? (
        <View style={styles.dotsRow}>
          {banners.map((b, i) => (
            <View
              key={b.key}
              style={[styles.dot, { backgroundColor: i === activeIndex ? theme.accent : "rgba(255,255,255,0.3)" }]}
            />
          ))}
        </View>
      ) : null}
    </View>
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
  bellBadge: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
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
  quickIconImage: { width: 30, height: 30 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dotsRow: { flexDirection: "row", justifyContent: "center", marginTop: spacing.sm, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});

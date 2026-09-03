import { useCallback, useState } from "react";
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
import { spacing, radius, palette } from "@/theme/tokens";
import { Text, Card, Rating, Badge, Avatar, BoatVisual, ScreenContainer, Touchable, Reveal, Skeleton, useToast } from "@/components/ui";
import * as boatsApi from "@/api/boats";
import * as craftsmenApi from "@/api/craftsmen";
import * as notificationsApi from "@/api/notifications";
import * as maintenanceApi from "@/api/maintenance";
import { ApiError } from "@/api/client";
import type { Boat, MaintenanceRecord } from "@/types/api";
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

type HomeBanner = {
  key: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: readonly [string, string];
  onPress: () => void;
};

const QUICK_ACTION_ICON = {
  newRequest: require("../../../assets/home-icons/home-newrequest.png"),
  findCraftsman: require("../../../assets/home-icons/home-find-craftsman.png"),
  maintenance: require("../../../assets/home-icons/home-maintenance.png"),
  offers: require("../../../assets/home-icons/home-offers.png"),
  myBoat: require("../../../assets/home-icons/home-myboat.png"),
  profile: require("../../../assets/home-icons/home-profile.png"),
} as const;

export function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { show } = useToast();
  const insets = useSafeAreaInsets();
  const [boat, setBoat] = useState<Boat | null>(null);
  const [craftsmen, setCraftsmen] = useState<Craftsman[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
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
        const primaryBoat = boats[0] ?? null;
        setBoat(primaryBoat);
        setCraftsmen(craftsmenRes.items.slice(0, 4));
        setUnreadCount(notificationsRes.items.filter((n) => !n.readAt).length);
        setMaintenanceRecords(primaryBoat ? await maintenanceApi.listMaintenance(primaryBoat.id).catch(() => []) : []);
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

  // Bakim rehberindeki en yakin planli tarihe gore kisisellestirilmis
  // hatirlatma banner'i — sadece gecikmis veya 30 gun icinde olan varsa gosterilir.
  const reminderBanners: HomeBanner[] = [];
  const nextDue = maintenanceRecords
    .filter((r) => r.nextDueDate)
    .sort((a, b) => new Date(a.nextDueDate as string).getTime() - new Date(b.nextDueDate as string).getTime())[0];
  if (nextDue && boat) {
    const diffDays = Math.ceil((new Date(nextDue.nextDueDate as string).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    if (diffDays < 0) {
      reminderBanners.push({
        key: "maint-overdue",
        title: `${nextDue.title} bakımı gecikti`,
        subtitle: `${boat.name} için ${Math.abs(diffDays)} gün önce planlanmıştı`,
        icon: "alert-circle",
        colors: [palette.danger500, palette.navy900],
        onPress: () => navigation.navigate("BoatDetail", { boatId: boat.id }),
      });
    } else if (diffDays <= 30) {
      reminderBanners.push({
        key: "maint-upcoming",
        title: `${nextDue.title} zamanı yaklaşıyor`,
        subtitle: diffDays === 0 ? `${boat.name} için bugün planlandı` : `${boat.name} için ${diffDays} gün kaldı`,
        icon: "time-outline",
        colors: [palette.gold500, palette.navy800],
        onPress: () => navigation.navigate("BoatDetail", { boatId: boat.id }),
      });
    }
  }

  const featureBanners: HomeBanner[] = [
    {
      key: "feature-guide",
      title: "Bakım Rehberini Keşfet",
      subtitle: "Teknenin geçmişini ve gelecek bakımlarını tek yerden takip et",
      icon: "book-outline",
      colors: [palette.navy600, palette.navy950],
      onPress: () => (boat ? navigation.navigate("BoatDetail", { boatId: boat.id }) : navigation.navigate("AddBoat")),
    },
    {
      key: "feature-craftsmen",
      title: "Güvenilir Ustalarla Tanış",
      subtitle: "Bölgendeki onaylı ustaları incele, en uygun teklifi seç",
      icon: "construct-outline",
      colors: [palette.navy700, palette.navy950],
      onPress: () => navigation.navigate("CraftsmanList"),
    },
    {
      key: "feature-request",
      title: "Hızlı Talep Oluştur",
      subtitle: "İhtiyacını anlat, ustalar sana teklif göndersin",
      icon: "flash-outline",
      colors: [palette.navy600, palette.navy800],
      onPress: () => navigation.navigate("CreateServiceRequest"),
    },
  ];

  const banners: HomeBanner[] = [...reminderBanners, ...featureBanners];

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
          <Skeleton width="100%" height={112} radius={radius.xl} style={{ marginBottom: spacing.lg }} />

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
        </LinearGradient>

        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <Reveal delay={40}>
            <BannerCarousel banners={banners} theme={theme} />
          </Reveal>
        </View>

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

function BannerCarousel({ banners, theme }: { banners: HomeBanner[]; theme: ReturnType<typeof useTheme>["theme"] }) {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const cardWidth = width - spacing.lg * 2;

  if (banners.length === 0) return null;

  return (
    <View>
      <FlatList
        data={banners}
        keyExtractor={(b) => b.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / cardWidth);
          setActiveIndex(Math.max(0, Math.min(idx, banners.length - 1)));
        }}
        renderItem={({ item }) => (
          <Touchable onPress={item.onPress} haptic scaleTo={0.98} style={{ width: cardWidth }}>
            <LinearGradient colors={item.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bannerCard}>
              <View style={{ flex: 1 }}>
                <Text variant="h2" weight="extrabold" color="onDark">
                  {item.title}
                </Text>
                <Text variant="bodySmall" color="onDark" style={{ marginTop: 4, opacity: 0.85 }}>
                  {item.subtitle}
                </Text>
              </View>
              <View style={styles.bannerIconWrap}>
                <Ionicons name={item.icon} size={26} color={theme.textOnDark} />
              </View>
            </LinearGradient>
          </Touchable>
        )}
      />
      {banners.length > 1 ? (
        <View style={styles.dotsRow}>
          {banners.map((b, i) => (
            <View
              key={b.key}
              style={[styles.dot, { backgroundColor: i === activeIndex ? theme.primary : theme.border }]}
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
  bannerCard: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 112,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  bannerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginLeft: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  dotsRow: { flexDirection: "row", justifyContent: "center", marginTop: spacing.sm, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});

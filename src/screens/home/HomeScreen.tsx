import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, View, Image, StyleSheet, RefreshControl, Animated, Easing } from "react-native";
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

/** Gorseldeki tek bir objeyi (siren isigi, altin M rozeti vb.) isaret eden,
 * kaynak gorsele gore oranli (0-1) konum/boyut. */
type PromoGlowSpec = { relX: number; relY: number; relSize: number; colorA: string; colorB: string };

/** Bos takvim hucrelerine sirayla "isaretlenen" yesil tik noktalari. */
type PromoChecklistSpec = { relX: number; relY: number; relSize: number };

type PromoBanner = {
  key: string;
  titleLine1: string;
  titleLine2: string;
  accentColor: string;
  subtitle: string;
  source: ImageSourcePropType;
  aspect: number;
  glow: PromoGlowSpec;
  checklist?: readonly PromoChecklistSpec[];
  onPress: () => void;
};

const GOLD_GLOW = { colorA: "#C9A227", colorB: "#FCE9A8" };

const PROMO_IMAGE = {
  support: {
    source: require("../../../assets/promo-icons/promo-support.png"),
    aspect: 780 / 697,
    glow: { relX: 0.842, relY: 0.724, relSize: 0.2, colorA: "#3D8BFF", colorB: "#FF4D4D" },
  },
  craftsmen: {
    source: require("../../../assets/promo-icons/promo-craftsmen.png"),
    aspect: 298 / 261,
    glow: { relX: 0.857, relY: 0.163, relSize: 0.2, ...GOLD_GLOW },
  },
  boat: {
    source: require("../../../assets/promo-icons/promo-boat.png"),
    aspect: 900 / 652,
    glow: { relX: 0.873, relY: 0.861, relSize: 0.16, ...GOLD_GLOW },
  },
  offers: {
    source: require("../../../assets/promo-icons/promo-offers.png"),
    aspect: 900 / 751,
    glow: { relX: 0.906, relY: 0.744, relSize: 0.16, ...GOLD_GLOW },
  },
  calendar: {
    source: require("../../../assets/promo-icons/promo-calendar.png"),
    aspect: 900 / 647,
    glow: { relX: 0.115, relY: 0.71, relSize: 0.18, ...GOLD_GLOW },
    // Takvimin ust sirasindaki 3 bos hucreye sirayla "isleniyor" gibi
    // beliren yesil tikler.
    checklist: [
      { relX: 0.201, relY: 0.339, relSize: 0.06 },
      { relX: 0.314, relY: 0.339, relSize: 0.06 },
      { relX: 0.54, relY: 0.339, relSize: 0.06 },
    ],
  },
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
      titleLine1: "Bakım takvimini",
      titleLine2: "oluştur",
      accentColor: theme.accent,
      subtitle: "Bakım tarihlerini unutma, tek yerden takip et.",
      ...PROMO_IMAGE.calendar,
      onPress: () => (boat ? navigation.navigate("BoatDetail", { boatId: boat.id }) : navigation.navigate("AddBoat")),
    },
    {
      key: "promo-support",
      titleLine1: "İhtiyacın olduğunda",
      titleLine2: "MİÇO yanında",
      accentColor: theme.accent,
      subtitle: "Denizde yalnız değilsin, doğru desteğe hızlıca ulaş.",
      ...PROMO_IMAGE.support,
      onPress: () => navigation.navigate("CraftsmanList"),
    },
    {
      key: "promo-craftsmen",
      titleLine1: "Doğru ustayı",
      titleLine2: "kolayca bul",
      accentColor: theme.accent,
      subtitle: "Bölgendeki onaylı ustalara hızlıca ulaş.",
      ...PROMO_IMAGE.craftsmen,
      onPress: () => navigation.navigate("CraftsmanList"),
    },
    {
      key: "promo-boat",
      titleLine1: "Tekneni tek",
      titleLine2: "yerde yönet",
      accentColor: theme.accent,
      subtitle: "Teknenle ilgili bilgileri tek bir yerde tut.",
      ...PROMO_IMAGE.boat,
      onPress: () => (boat ? navigation.navigate("BoatDetail", { boatId: boat.id }) : navigation.navigate("AddBoat")),
    },
    {
      key: "promo-offers",
      titleLine1: "Teklifleri",
      titleLine2: "karşılaştır",
      accentColor: theme.accent,
      subtitle: "Gelen teklifleri incele, en uygun ustayı seç.",
      ...PROMO_IMAGE.offers,
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
        </LinearGradient>

        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <Reveal delay={50}>
            <PromoBannerCarousel banners={promoBanners} theme={theme} />
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

/**
 * Yemeksepeti anasayfasindaki kampanya banner'ina benzer, kendi basina
 * duran dikdortgen kart: sol tarafta baslik/alt yazi, sag tarafta
 * animasyonlu illustrasyon. Elle kaydirilamiyor — 5 saniyede bir
 * kendiliginden bir sonraki karta geciyor (crossfade).
 */
function PromoBannerCarousel({ banners, theme }: { banners: PromoBanner[]; theme: ReturnType<typeof useTheme>["theme"] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(() => {
      Animated.timing(opacity, { toValue: 0, duration: 260, useNativeDriver: true }).start(() => {
        setActiveIndex((i) => (i + 1) % banners.length);
        Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true }).start();
      });
    }, 5000);
    return () => clearInterval(id);
  }, [banners.length, opacity]);

  if (banners.length === 0) return null;
  const banner = banners[Math.min(activeIndex, banners.length - 1)];

  return (
    <View>
      <Touchable onPress={banner.onPress} haptic scaleTo={0.99}>
        <LinearGradient colors={theme.heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.promoCard}>
          <Animated.View style={[styles.promoRow, { opacity }]}>
            <View style={{ flex: 1 }}>
              <Text variant="h1" weight="extrabold" color="onDark">
                {banner.titleLine1}
              </Text>
              <Text variant="h1" weight="extrabold" style={{ color: banner.accentColor }}>
                {banner.titleLine2}
              </Text>
              <Text variant="bodySmall" color="onDark" style={{ marginTop: spacing.xs, opacity: 0.75 }}>
                {banner.subtitle}
              </Text>
            </View>
            <PromoImage source={banner.source} aspect={banner.aspect} glow={banner.glow} checklist={banner.checklist} />
          </Animated.View>
        </LinearGradient>
      </Touchable>
      {banners.length > 1 ? (
        <View style={styles.dotsRow}>
          {banners.map((b, i) => (
            <View key={b.key} style={[styles.dot, { backgroundColor: i === activeIndex ? theme.primary : theme.border }]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** "contain" ile sigan gorselin, konteynir icindeki gercek dikdortgenini hesaplar. */
function containFit(containerW: number, containerH: number, sourceAspect: number) {
  const containerAspect = containerW / containerH;
  let w: number, h: number;
  if (containerAspect > sourceAspect) {
    h = containerH;
    w = h * sourceAspect;
  } else {
    w = containerW;
    h = w / sourceAspect;
  }
  return { w, h, offsetX: (containerW - w) / 2, offsetY: (containerH - h) / 2 };
}

/** Gorsel + hafif nefes alan zoom + tek bir odak noktasinda animasyonlu isik rozeti. */
const CHECKLIST_GREEN = "#1FA669";

function PromoImage({
  source,
  aspect,
  glow,
  checklist,
}: {
  source: ImageSourcePropType;
  aspect: number;
  glow: PromoGlowSpec;
  checklist?: readonly PromoChecklistSpec[];
}) {
  const [containerSize, setContainerSize] = useState<{ w: number; h: number } | null>(null);
  const pulse = useRef(new Animated.Value(0)).current;
  const colorPhase = useRef(new Animated.Value(0)).current;
  const checklistAnims = useRef((checklist ?? []).map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const zoomLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    const colorLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(colorPhase, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(colorPhase, { toValue: 0, duration: 900, useNativeDriver: false }),
      ])
    );
    zoomLoop.start();
    colorLoop.start();
    return () => {
      zoomLoop.stop();
      colorLoop.stop();
    };
  }, [pulse, colorPhase]);

  // Bos takvim hucrelerine sirayla "isleniyor" gibi beliren yesil tikler:
  // bir bir pop-in, bir sure ekranda kal, birlikte sonup basa dön.
  useEffect(() => {
    if (checklistAnims.length === 0) return;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const cycle = () => {
      if (cancelled) return;
      checklistAnims.forEach((v) => v.setValue(0));
      Animated.stagger(
        420,
        checklistAnims.map((v) => Animated.spring(v, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }))
      ).start(() => {
        if (cancelled) return;
        timeoutId = setTimeout(() => {
          if (cancelled) return;
          Animated.parallel(checklistAnims.map((v) => Animated.timing(v, { toValue: 0, duration: 300, useNativeDriver: true }))).start(() => {
            if (cancelled) return;
            timeoutId = setTimeout(cycle, 500);
          });
        }, 1600);
      });
    };

    cycle();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [checklistAnims]);

  const imageScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  const glowColor = colorPhase.interpolate({ inputRange: [0, 1], outputRange: [glow.colorA, glow.colorB] });
  const fit = containerSize ? containFit(containerSize.w, containerSize.h, aspect) : null;
  const glowSize = fit ? glow.relSize * fit.w : 0;

  return (
    <View style={styles.promoImageBox} onLayout={(e) => setContainerSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Animated.Image source={source} style={[styles.promoImage, { transform: [{ scale: imageScale }] }]} resizeMode="contain" />
      {fit ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: fit.offsetX + glow.relX * fit.w - glowSize / 2,
            top: fit.offsetY + glow.relY * fit.h - glowSize / 2,
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
            backgroundColor: glowColor,
            opacity: 0.6,
            shadowColor: glow.colorA,
            shadowOpacity: 0.9,
            shadowRadius: glowSize * 0.6,
            shadowOffset: { width: 0, height: 0 },
          }}
        />
      ) : null}
      {fit
        ? checklist?.map((c, i) => {
            const size = c.relSize * fit.w;
            const v = checklistAnims[i];
            return (
              <Animated.View
                key={i}
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: fit.offsetX + c.relX * fit.w - size / 2,
                  top: fit.offsetY + c.relY * fit.h - size / 2,
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  backgroundColor: CHECKLIST_GREEN,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: v,
                  transform: [{ scale: v }],
                }}
              >
                <Ionicons name="checkmark" size={size * 0.62} color="#FFFFFF" />
              </Animated.View>
            );
          })
        : null}
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
  promoCard: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    minHeight: 240,
    justifyContent: "center",
  },
  promoRow: { flexDirection: "row", alignItems: "center" },
  promoImageBox: { width: 190, height: 210, marginLeft: spacing.sm },
  promoImage: { width: "100%", height: "100%" },
  dotsRow: { flexDirection: "row", justifyContent: "center", marginTop: spacing.sm, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});

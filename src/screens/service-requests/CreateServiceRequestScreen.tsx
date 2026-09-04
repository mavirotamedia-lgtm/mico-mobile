import { useEffect, useState } from "react";
import { ScrollView, View, Pressable, Image, StyleSheet, ActivityIndicator } from "react-native";
import type { ImageSourcePropType } from "react-native";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as boatsApi from "@/api/boats";
import * as serviceRequestsApi from "@/api/serviceRequests";
import { uploadImage } from "@/api/uploads";
import { useTheme } from "@/theme/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import { Text, Button, Card, Input, ScreenContainer, Touchable, BoatVisual, useToast } from "@/components/ui";
import type { AppStackParamList } from "@/navigation/RootNavigator";
import { ApiError } from "@/api/client";
import { resolveMediaUrl } from "@/lib/media";
import type { Boat } from "@/types/api";
import { SPECIALTY_LABELS, type CraftsmanSpecialty } from "@/types/mico";

type Props = NativeStackScreenProps<AppStackParamList, "CreateServiceRequest">;

const SPECIALTIES = Object.entries(SPECIALTY_LABELS) as [CraftsmanSpecialty, string][];

const SPECIALTY_ICON: Record<CraftsmanSpecialty, ImageSourcePropType> = {
  ENGINE: require("../../../assets/categories/category-engine.png"),
  ELECTRICAL: require("../../../assets/categories/category-electrical.png"),
  HULL_FIBERGLASS: require("../../../assets/categories/category-hull.png"),
  UPHOLSTERY_CANVAS: require("../../../assets/categories/category-upholstery.png"),
  WINTERIZATION_MAINTENANCE: require("../../../assets/categories/category-winterization.png"),
  OTHER: require("../../../assets/categories/category-other.png"),
};

const BOAT_TYPE_LABEL: Record<Boat["type"], string> = {
  SAILBOAT: "Yelkenli",
  MOTORBOAT: "Motorbot",
  YACHT: "Yat",
  OTHER: "Diğer",
};

const ISSUE_TYPES = ["Arıza", "Bakım", "Parça değişimi", "Performans sorunu", "Diğer"] as const;
type IssueType = (typeof ISSUE_TYPES)[number];

const PROBLEM_TYPES = ["Çalışmıyor", "Zor çalışıyor", "Hararet yapıyor", "Ses / titreşim", "Yağ / su kaçağı", "Diğer"] as const;
type ProblemType = (typeof PROBLEM_TYPES)[number];

const SCHEDULE_OPTIONS = [
  { key: "asap", label: "En kısa sürede" },
  { key: "scheduled", label: "Belirli bir tarih" },
  { key: "flexible", label: "Esnek" },
] as const;
type ScheduleOption = (typeof SCHEDULE_OPTIONS)[number]["key"];

const URGENCY_OPTIONS = [
  { key: "normal", label: "Normal", sub: "Uygun zamanda", tone: "success" },
  { key: "priority", label: "Öncelikli", sub: "Kısa sürede", tone: "warning" },
  { key: "urgent", label: "Acil", sub: "Hemen gerekli", tone: "danger" },
] as const;
type UrgencyLevel = (typeof URGENCY_OPTIONS)[number]["key"];

const STEP_LABELS = ["Talep", "Detaylar", "Konum", "Gönder"] as const;
const STEP_SUBTITLES: Record<number, string> = {
  1: "Teknen için doğru ustaya, en hızlı şekilde ulaş.",
  2: "Detayları paylaş, doğru ustalara ulaşalım.",
  3: "Ustaların sana en yakın konumda ulaşsın.",
  4: "Son bir kez kontrol et, talebini gönder.",
};

export function CreateServiceRequestScreen({ route, navigation }: Props) {
  const { theme } = useTheme();
  const { show } = useToast();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [boats, setBoats] = useState<Boat[]>([]);
  const [boatId, setBoatId] = useState<string | undefined>(route.params?.boatId);
  const [specialty, setSpecialty] = useState<CraftsmanSpecialty>("ENGINE");

  const [issueType, setIssueType] = useState<IssueType>("Arıza");
  const [problemType, setProblemType] = useState<ProblemType>("Çalışmıyor");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [locationMode, setLocationMode] = useState<"boat" | "other">("boat");
  const [city, setCity] = useState("");
  const [marina, setMarina] = useState("");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [scheduleOption, setScheduleOption] = useState<ScheduleOption>("asap");
  const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel>("normal");

  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentAt, setSentAt] = useState("");

  const selectedBoat = boats.find((b) => b.id === boatId);

  useEffect(() => {
    // Bilerek sadece mount'ta bir kez calisir — boatId'yi bagimliliga eklemek
    // kullanici bir tekne cip'ine her dokundugunda gereksiz yere tekne
    // listesini yeniden cekiyordu.
    (async () => {
      let boatHomePort = "";
      try {
        const list = await boatsApi.listBoats();
        setBoats(list);
        setBoatId((current) => {
          if (current || !list[0]) return current;
          if (list[0].homePort) boatHomePort = list[0].homePort;
          return list[0].id;
        });
      } catch (e) {
        show(e instanceof ApiError ? e.message : "Tekneler yüklenemedi.", "error");
      }

      if (boatHomePort) {
        setCity(boatHomePort);
        return;
      }

      // Tekne icin varsayilan liman yoksa, konum izni zaten verilmisse
      // (kullaniciya izin diyalogu GOSTERMEDEN) konumu sessizce varsayilan
      // olarak doldur — "Konumumu Kullan" butonu hala manuel yenilemek icin
      // duruyor.
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        if (!permission.granted) return;
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        const places = await Location.reverseGeocodeAsync(position.coords).catch(() => []);
        const place = places[0];
        const label = place ? [place.district, place.city ?? place.subregion ?? place.region].filter(Boolean).join(", ") : "";
        if (label) {
          setCity(label);
          setLocationMode("other");
        }
      } catch {
        // sessiz basarisizlik — kullanici manuel "Konumumu Kullan"a basabilir
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (locationMode === "boat" && selectedBoat?.homePort) {
      setCity(selectedBoat.homePort);
      setMarina("");
    }
  }, [locationMode, selectedBoat]);

  async function handleUseLocation() {
    setIsLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        show("Konum izni verilmedi.", "error");
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });

      const places = await Location.reverseGeocodeAsync(position.coords).catch(() => []);
      const place = places[0];
      const label = place ? [place.district, place.city ?? place.subregion ?? place.region].filter(Boolean).join(", ") : "";
      setCity(label || "Konumum");
    } catch {
      show("Konum alınamadı.", "error");
    } finally {
      setIsLocating(false);
    }
  }

  async function handlePickPhotos() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      show("Fotoğraf seçmek için galeri izni gerekiyor.", "error");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (result.canceled || result.assets.length === 0) return;

    setIsUploadingPhoto(true);
    try {
      const urls = await Promise.all(result.assets.map((asset) => uploadImage(asset.uri, asset.mimeType)));
      setPhotos((current) => [...current, ...urls]);
    } catch (e) {
      show(e instanceof ApiError ? e.message : "Fotoğraf yüklenemedi.", "error");
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  function handleRemovePhoto(url: string) {
    setPhotos((current) => current.filter((p) => p !== url));
  }

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      const scheduleLabel = SCHEDULE_OPTIONS.find((o) => o.key === scheduleOption)?.label ?? "";
      const urgencyLabel = URGENCY_OPTIONS.find((o) => o.key === urgencyLevel)?.label ?? "";
      const detailHeader = [
        `İşlem Türü: ${issueType}`,
        `Sorun: ${problemType}`,
        `Zamanlama: ${scheduleLabel}`,
        `Aciliyet: ${urgencyLabel}`,
      ].join("\n");

      await serviceRequestsApi.createServiceRequest({
        boatId,
        specialty,
        title: `${issueType} – ${problemType}`,
        description: description.trim() ? `${detailHeader}\n\n${description.trim()}` : detailHeader,
        photos,
        city: city.trim(),
        marina: marina.trim() || undefined,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        isUrgent: urgencyLevel === "urgent",
      });
      setSentAt(new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }));
      setIsSubmitted(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Talep oluşturulamadı.");
      show(e instanceof ApiError ? e.message : "Talep oluşturulamadı.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  function goBack() {
    if (step > 1) {
      setStep((s) => (s - 1) as 1 | 2 | 3 | 4);
    } else {
      navigation.goBack();
    }
  }

  const canContinueStep1 = boats.length === 0 || !!boatId;
  const canContinueStep3 = city.trim().length > 0;

  if (isSubmitted) {
    return (
      <ScreenContainer>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: insets.top + spacing.lg, flexGrow: 1 }}>
          <View style={{ alignItems: "center", marginTop: spacing.xl }}>
            <View style={[styles.successIcon, { backgroundColor: theme.accent }]}>
              <Ionicons name="paper-plane" size={36} color={theme.onAccent} />
            </View>
            <Text variant="h1" weight="extrabold" style={{ marginTop: spacing.lg, textAlign: "center" }}>
              Talebin gönderildi!
            </Text>
            <Text variant="body" color="secondary" style={{ marginTop: spacing.xs, textAlign: "center" }}>
              Uygun ustalar talebini inceleyip sana teklif verecek.
            </Text>
          </View>

          <Card style={{ marginTop: spacing.xl, flexDirection: "row", alignItems: "center" }}>
            <View style={[styles.successStatIcon, { backgroundColor: theme.surfaceAlt }]}>
              <Ionicons name="people-outline" size={20} color={theme.primary} />
            </View>
            <View style={{ marginLeft: spacing.sm, flex: 1 }}>
              <Text variant="bodySmall" color="secondary">
                Tahmini dönüş süresi
              </Text>
              <Text variant="body" weight="bold">
                5 – 30 dakika
              </Text>
              <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
                Acil taleplerde daha hızlı dönüş sağlanır.
              </Text>
            </View>
          </Card>

          <View style={{ marginTop: spacing.lg }}>
            <TimelineRow icon="checkmark" done label="Talebin ustalara iletildi" sub={sentAt} theme={theme} />
            <TimelineRow icon="people-outline" label="Uygun ustalar inceliyor" sub="Tahmini 5 – 30 dakika" theme={theme} />
            <TimelineRow icon="pricetag-outline" label="Ustalar teklif verecek" theme={theme} />
            <TimelineRow icon="checkmark-done-outline" label="Sen en uygun ustayı seçeceksin" isLast theme={theme} />
          </View>

          <View style={{ flex: 1 }} />

          <Button
            label="Taleplerim'e Git"
            onPress={() => navigation.navigate("MainTabs", { screen: "ServiceRequests" })}
            style={{ marginTop: spacing.xl }}
          />
          <Touchable
            onPress={() => navigation.navigate("MainTabs", { screen: "Home" })}
            style={{ alignItems: "center", marginTop: spacing.md, paddingVertical: spacing.xs }}
          >
            <Text variant="body" weight="semibold" color="accent">
              Ana Sayfaya Dön
            </Text>
          </Touchable>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Touchable onPress={goBack} hitSlop={10} style={[styles.headerIconBtn, { backgroundColor: theme.surfaceAlt }]}>
            <Ionicons name="chevron-back" size={20} color={theme.textPrimary} />
          </Touchable>
          <Image source={require("../../../assets/branding/logo-wordmark.png")} style={{ width: 74, height: 26 }} resizeMode="contain" />
          <Touchable
            onPress={() => show("Yardım yakında eklenecek.", "info")}
            hitSlop={10}
            style={[styles.headerIconBtn, { backgroundColor: theme.surfaceAlt }]}
          >
            <Ionicons name="help-circle-outline" size={20} color={theme.textPrimary} />
          </Touchable>
        </View>

        <Text variant="h1" weight="extrabold" style={{ textAlign: "center", marginTop: spacing.md }}>
          Servis Talebi Oluştur
        </Text>
        <Text variant="bodySmall" color="secondary" style={{ textAlign: "center", marginTop: 2 }}>
          {STEP_SUBTITLES[step]}
        </Text>

        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: spacing.lg }}>
          {STEP_LABELS.map((label, i) => {
            const stepNumber = i + 1;
            const isDone = stepNumber < step;
            const isActive = stepNumber === step;
            return (
              <View key={label} style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <View style={{ alignItems: "center", width: 56 }}>
                  <View
                    style={[
                      styles.stepDot,
                      {
                        backgroundColor: isDone ? theme.primary : isActive ? theme.accent : "transparent",
                        borderColor: isActive || isDone ? "transparent" : theme.border,
                      },
                    ]}
                  >
                    {isDone ? (
                      <Ionicons name="checkmark" size={13} color={theme.onPrimary} />
                    ) : (
                      <Text variant="caption" weight="bold" style={{ color: isActive ? theme.onAccent : theme.textSecondary }}>
                        {stepNumber}
                      </Text>
                    )}
                  </View>
                  <Text
                    variant="caption"
                    weight={isActive ? "bold" : "regular"}
                    color={isActive ? "primary" : "secondary"}
                    style={{ marginTop: 4 }}
                  >
                    {label}
                  </Text>
                </View>
                {i < STEP_LABELS.length - 1 ? (
                  <View style={{ width: 20, height: 1.5, backgroundColor: theme.border, marginTop: 13 }} />
                ) : null}
              </View>
            );
          })}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }} keyboardShouldPersistTaps="handled">
        {step === 1 ? (
          <>
            {boats.length > 0 ? (
              <>
                <View style={styles.sectionHeaderRow}>
                  <Text variant="bodySmall" weight="semibold" color="secondary">
                    Hangi teknen için?
                  </Text>
                  <Touchable onPress={() => navigation.navigate("AddBoat")}>
                    <Text variant="bodySmall" weight="bold" color="accent">
                      Tekne ekle +
                    </Text>
                  </Touchable>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
                  {boats.map((b) => (
                    <BoatPickCard key={b.id} boat={b} active={boatId === b.id} onPress={() => setBoatId(b.id)} theme={theme} />
                  ))}
                </ScrollView>
              </>
            ) : null}

            <Text variant="bodySmall" weight="semibold" color="secondary" style={{ marginBottom: 6 }}>
              Ne için usta arıyorsun?
            </Text>
            <View style={styles.categoryGrid}>
              {SPECIALTIES.map(([value, label]) => (
                <CategoryCard
                  key={value}
                  label={label}
                  icon={SPECIALTY_ICON[value]}
                  active={specialty === value}
                  onPress={() => setSpecialty(value)}
                  theme={theme}
                />
              ))}
            </View>

            <Button label="Devam Et" trailingIcon="chevron-forward" onPress={() => setStep(2)} disabled={!canContinueStep1} style={{ marginTop: spacing.sm }} />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Card style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.lg }}>
              <Image source={SPECIALTY_ICON[specialty]} style={{ width: 44, height: 44 }} resizeMode="contain" />
              <Text variant="body" weight="bold" style={{ marginLeft: spacing.sm, flex: 1 }}>
                {SPECIALTY_LABELS[specialty]}
              </Text>
              <Touchable onPress={() => setStep(1)}>
                <Text variant="bodySmall" weight="bold" color="accent">
                  Değiştir ✎
                </Text>
              </Touchable>
            </Card>

            <Text variant="bodySmall" weight="semibold" color="secondary" style={{ marginBottom: 6 }}>
              Ne tür bir işlem gerekiyor?
            </Text>
            <View style={styles.chipRow}>
              {ISSUE_TYPES.map((v) => (
                <ChipOption key={v} label={v} active={issueType === v} onPress={() => setIssueType(v)} theme={theme} />
              ))}
            </View>

            <Text variant="bodySmall" weight="semibold" color="secondary" style={{ marginTop: spacing.sm, marginBottom: 6 }}>
              Sorun nedir?
            </Text>
            <View style={styles.chipRow}>
              {PROBLEM_TYPES.map((v) => (
                <ChipOption key={v} label={v} active={problemType === v} onPress={() => setProblemType(v)} theme={theme} />
              ))}
            </View>

            <Text variant="bodySmall" weight="semibold" color="secondary" style={{ marginTop: spacing.sm, marginBottom: 6 }}>
              Sorunu bize anlat
            </Text>
            <Input
              placeholder="Örn. Marşa basıyorum ancak motor dönmüyor..."
              value={description}
              onChangeText={(t) => setDescription(t.slice(0, 500))}
              multiline
              numberOfLines={4}
              style={{ minHeight: 90, textAlignVertical: "top" }}
            />
            <Text variant="caption" color="secondary" style={{ textAlign: "right", marginTop: -4, marginBottom: spacing.sm }}>
              {description.length}/500
            </Text>

            <Text variant="bodySmall" weight="semibold" color="secondary" style={{ marginBottom: 6 }}>
              Fotoğraflar (opsiyonel)
            </Text>
            <View style={styles.photoRow}>
              {photos.map((url) => (
                <View key={url} style={[styles.photoThumb, { borderColor: theme.border }]}>
                  <Image source={{ uri: resolveMediaUrl(url) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  <Touchable onPress={() => handleRemovePhoto(url)} style={styles.photoRemove}>
                    <Ionicons name="close" size={12} color="#FFFFFF" />
                  </Touchable>
                </View>
              ))}
              <Pressable onPress={handlePickPhotos} style={[styles.photoAdd, { borderColor: theme.border }]}>
                {isUploadingPhoto ? (
                  <ActivityIndicator color={theme.primary} size="small" />
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={20} color={theme.textSecondary} />
                    <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
                      Fotoğraf ekle
                    </Text>
                  </>
                )}
              </Pressable>
            </View>

            <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
              <Button label="Geri" variant="secondary" onPress={() => setStep(1)} style={{ flex: 1 }} />
              <Button label="Devam Et" trailingIcon="chevron-forward" onPress={() => setStep(3)} style={{ flex: 2 }} />
            </View>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Text variant="bodySmall" weight="semibold" color="secondary" style={{ marginBottom: 6 }}>
              Servis nerede?
            </Text>
            <View style={styles.toggleRow}>
              <ToggleOption
                label="Teknenin bulunduğu yer"
                active={locationMode === "boat"}
                onPress={() => setLocationMode("boat")}
                theme={theme}
              />
              <ToggleOption label="Başka bir konum" active={locationMode === "other"} onPress={() => setLocationMode("other")} theme={theme} />
            </View>

            <Card style={{ padding: 0, overflow: "hidden", marginBottom: spacing.md }}>
              <View style={[styles.mapPlaceholder, { backgroundColor: theme.surfaceAlt }]}>
                <Ionicons name="location" size={30} color={theme.accent} />
              </View>
              <View style={{ padding: spacing.md, flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="location-outline" size={18} color={theme.textSecondary} />
                <View style={{ marginLeft: spacing.xs, flex: 1 }}>
                  <Text variant="body" weight="bold" numberOfLines={1}>
                    {city || "Konum seçilmedi"}
                  </Text>
                  {marina ? (
                    <Text variant="caption" color="secondary" numberOfLines={1}>
                      {marina}
                    </Text>
                  ) : null}
                </View>
              </View>
            </Card>

            {locationMode === "other" ? (
              <>
                <Input placeholder="ör. Bodrum Marina" value={city} onChangeText={setCity} icon="location-outline" />
                <Input placeholder="İskele / bağlama yeri (opsiyonel)" value={marina} onChangeText={setMarina} icon="pin-outline" />
                <Touchable onPress={handleUseLocation} haptic disabled={isLocating} style={{ marginBottom: spacing.md }}>
                  <Text variant="bodySmall" weight="bold" color="accent">
                    {isLocating ? "Bulunuyor..." : "📍 Konumumu Kullan"}
                  </Text>
                </Touchable>
              </>
            ) : null}

            <Text variant="caption" color="secondary" style={{ marginBottom: spacing.md }}>
              Ustalar, belirtilen konuma göre sana ulaşacaktır.
            </Text>

            <Text variant="bodySmall" weight="semibold" color="secondary" style={{ marginBottom: 6 }}>
              Ne zaman hizmet almak istiyorsun?
            </Text>
            <View style={styles.chipRow}>
              {SCHEDULE_OPTIONS.map((o) => (
                <ChipOption key={o.key} label={o.label} active={scheduleOption === o.key} onPress={() => setScheduleOption(o.key)} theme={theme} />
              ))}
            </View>

            <Text variant="bodySmall" weight="semibold" color="secondary" style={{ marginTop: spacing.sm, marginBottom: 6 }}>
              Ne kadar acil?
            </Text>
            <View style={styles.urgencyRow}>
              {URGENCY_OPTIONS.map((o) => (
                <UrgencyCard key={o.key} option={o} active={urgencyLevel === o.key} onPress={() => setUrgencyLevel(o.key)} theme={theme} />
              ))}
            </View>
            {urgencyLevel === "urgent" ? (
              <Text variant="caption" color="secondary" style={{ marginTop: spacing.xs, marginBottom: spacing.md }}>
                Acil talepler öncelikli olarak ustalara iletilir.
              </Text>
            ) : null}

            <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
              <Button label="Geri" variant="secondary" onPress={() => setStep(2)} style={{ flex: 1 }} />
              <Button label="Devam Et" trailingIcon="chevron-forward" onPress={() => setStep(4)} disabled={!canContinueStep3} style={{ flex: 2 }} />
            </View>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text variant="h2" weight="extrabold">
                Talep Özeti
              </Text>
              <Touchable onPress={() => setStep(1)}>
                <Text variant="bodySmall" weight="bold" color="accent">
                  Düzenle ✎
                </Text>
              </Touchable>
            </View>

            <Card style={{ padding: 0, overflow: "hidden", marginBottom: spacing.lg }}>
              {selectedBoat ? (
                <SummaryRow
                  icon={<BoatVisual image={selectedBoat.image} type={selectedBoat.type} style={{ width: 44, height: 44, borderRadius: radius.md }} />}
                  label="Tekne"
                  value={selectedBoat.name}
                  sub={[BOAT_TYPE_LABEL[selectedBoat.type], selectedBoat.homePort].filter(Boolean).join(" · ")}
                  theme={theme}
                />
              ) : null}
              <SummaryRow iconName="construct-outline" label="Kategori" value={SPECIALTY_LABELS[specialty]} theme={theme} />
              <SummaryRow iconName="build-outline" label="İşlem Türü" value={issueType} theme={theme} />
              <SummaryRow iconName="alert-circle-outline" label="Sorun" value={problemType} sub={description || undefined} theme={theme} />
              <SummaryRow iconName="location-outline" label="Konum" value={city} sub={marina || undefined} theme={theme} />
              <SummaryRow
                iconName="calendar-outline"
                label="Zaman"
                value={SCHEDULE_OPTIONS.find((o) => o.key === scheduleOption)?.label ?? ""}
                theme={theme}
              />
              <SummaryRow
                iconName="alert-outline"
                label="Aciliyet"
                value={URGENCY_OPTIONS.find((o) => o.key === urgencyLevel)?.label ?? ""}
                valueColor={urgencyLevel === "urgent" ? theme.danger : urgencyLevel === "priority" ? theme.warning : theme.success}
                isLast
                theme={theme}
              />
            </Card>

            <Text variant="bodySmall" weight="semibold" color="secondary" style={{ marginBottom: 6 }}>
              Eklenen Dosyalar ({photos.length})
            </Text>
            <View style={styles.photoRow}>
              {photos.map((url) => (
                <View key={url} style={[styles.photoThumb, { borderColor: theme.border }]}>
                  <Image source={{ uri: resolveMediaUrl(url) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  <Touchable onPress={() => handleRemovePhoto(url)} style={styles.photoRemove}>
                    <Ionicons name="close" size={12} color="#FFFFFF" />
                  </Touchable>
                </View>
              ))}
              <Pressable onPress={handlePickPhotos} style={[styles.photoAdd, { borderColor: theme.border }]}>
                {isUploadingPhoto ? (
                  <ActivityIndicator color={theme.primary} size="small" />
                ) : (
                  <>
                    <Ionicons name="add" size={18} color={theme.textSecondary} />
                    <Text variant="caption" color="secondary">
                      Ekle
                    </Text>
                  </>
                )}
              </Pressable>
            </View>

            <Touchable
              onPress={() => setAgreed((v) => !v)}
              style={{ flexDirection: "row", alignItems: "center", marginTop: spacing.md, marginBottom: spacing.md }}
            >
              <View
                style={[
                  styles.checkbox,
                  { borderColor: agreed ? theme.primary : theme.border, backgroundColor: agreed ? theme.primary : "transparent" },
                ]}
              >
                {agreed ? <Ionicons name="checkmark" size={13} color={theme.onPrimary} /> : null}
              </View>
              <Text variant="bodySmall" color="secondary" style={{ marginLeft: spacing.xs, flex: 1 }}>
                Talebimin uygun ustalara iletilmesini onaylıyorum.
              </Text>
            </Touchable>

            {error ? (
              <Text variant="bodySmall" color="danger" style={{ marginBottom: spacing.sm }}>
                {error}
              </Text>
            ) : null}

            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Button label="Geri" variant="secondary" onPress={() => setStep(3)} style={{ flex: 1 }} />
              <Button
                label="Talebi Gönder"
                icon="paper-plane-outline"
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={!agreed || isUploadingPhoto}
                style={{ flex: 2 }}
              />
            </View>
          </>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

function BoatPickCard({
  boat,
  active,
  onPress,
  theme,
}: {
  boat: Boat;
  active: boolean;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>["theme"];
}) {
  return (
    <Touchable
      onPress={onPress}
      haptic
      scaleTo={0.97}
      style={[styles.boatCard, { borderColor: active ? theme.primary : theme.border, backgroundColor: theme.surface }]}
    >
      <View style={{ width: "100%", height: 84, borderRadius: radius.md, overflow: "hidden" }}>
        <BoatVisual image={boat.image} type={boat.type} style={{ width: "100%", height: "100%" }} />
      </View>
      {active ? (
        <View style={[styles.boatCheck, { backgroundColor: theme.accent, borderColor: theme.surface }]}>
          <Ionicons name="checkmark" size={12} color={theme.onAccent} />
        </View>
      ) : null}
      <Text variant="bodySmall" weight="bold" numberOfLines={1} style={{ marginTop: spacing.xs }}>
        {boat.name}
      </Text>
      <Text variant="caption" color="secondary" numberOfLines={1}>
        {[BOAT_TYPE_LABEL[boat.type], boat.homePort].filter(Boolean).join(" · ")}
      </Text>
    </Touchable>
  );
}

function CategoryCard({
  label,
  icon,
  active,
  onPress,
  theme,
}: {
  label: string;
  icon: ImageSourcePropType;
  active: boolean;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>["theme"];
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.categoryCard, { borderColor: active ? theme.primary : theme.border, backgroundColor: theme.surface }]}
    >
      {active ? (
        <View style={[styles.categoryCheck, { backgroundColor: theme.primary, borderColor: theme.surface }]}>
          <Ionicons name="checkmark" size={11} color={theme.onPrimary} />
        </View>
      ) : null}
      <Image source={icon} style={styles.categoryIcon} resizeMode="contain" />
      <Text
        variant="bodySmall"
        weight="semibold"
        style={{ color: active ? theme.primary : theme.textPrimary, marginTop: 6, textAlign: "center" }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ChipOption({
  label,
  active,
  onPress,
  theme,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>["theme"];
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, { borderColor: active ? theme.primary : theme.border, backgroundColor: active ? theme.primary : theme.surface }]}
    >
      <Text variant="bodySmall" weight="semibold" style={{ color: active ? theme.onPrimary : theme.textSecondary }}>
        {label}
      </Text>
    </Pressable>
  );
}

function ToggleOption({
  label,
  active,
  onPress,
  theme,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>["theme"];
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.toggleOption, { borderColor: active ? theme.primary : theme.border, backgroundColor: active ? theme.primary : theme.surface }]}
    >
      <Text variant="bodySmall" weight="semibold" style={{ color: active ? theme.onPrimary : theme.textSecondary, textAlign: "center" }}>
        {label}
      </Text>
    </Pressable>
  );
}

function UrgencyCard({
  option,
  active,
  onPress,
  theme,
}: {
  option: (typeof URGENCY_OPTIONS)[number];
  active: boolean;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>["theme"];
}) {
  const tones: Record<(typeof URGENCY_OPTIONS)[number]["tone"], string> = {
    success: theme.success,
    warning: theme.warning,
    danger: theme.danger,
  };
  const dotColor = tones[option.tone];
  return (
    <Pressable onPress={onPress} style={[styles.urgencyCard, { borderColor: active ? dotColor : theme.border, backgroundColor: theme.surface }]}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={[styles.urgencyDot, { backgroundColor: dotColor }]} />
        <Text variant="bodySmall" weight="bold" style={{ marginLeft: 6 }}>
          {option.label}
        </Text>
      </View>
      <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
        {option.sub}
      </Text>
    </Pressable>
  );
}

function SummaryRow({
  icon,
  iconName,
  label,
  value,
  sub,
  valueColor,
  isLast,
  theme,
}: {
  icon?: React.ReactNode;
  iconName?: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
  isLast?: boolean;
  theme: ReturnType<typeof useTheme>["theme"];
}) {
  return (
    <View style={[styles.summaryRow, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}>
      {icon ?? (
        <View style={[styles.summaryIcon, { backgroundColor: theme.surfaceAlt }]}>
          <Ionicons name={iconName ?? "ellipse-outline"} size={18} color={theme.primary} />
        </View>
      )}
      <View style={{ marginLeft: spacing.sm, flex: 1 }}>
        <Text variant="caption" color="secondary">
          {label}
        </Text>
        <Text variant="body" weight="bold" numberOfLines={1} style={valueColor ? { color: valueColor } : undefined}>
          {value}
        </Text>
        {sub ? (
          <Text variant="caption" color="secondary" numberOfLines={2} style={{ marginTop: 2 }}>
            {sub}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function TimelineRow({
  icon,
  label,
  sub,
  done,
  isLast,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub?: string;
  done?: boolean;
  isLast?: boolean;
  theme: ReturnType<typeof useTheme>["theme"];
}) {
  return (
    <View style={{ flexDirection: "row" }}>
      <View style={{ alignItems: "center" }}>
        <View style={[styles.timelineIcon, { backgroundColor: done ? theme.primary : theme.surfaceAlt }]}>
          <Ionicons name={icon} size={14} color={done ? theme.onPrimary : theme.textSecondary} />
        </View>
        {!isLast ? <View style={{ width: 1.5, flex: 1, backgroundColor: theme.border, marginVertical: 4 }} /> : null}
      </View>
      <View style={{ marginLeft: spacing.sm, paddingBottom: spacing.md, flex: 1 }}>
        <Text variant="bodySmall" weight={done ? "bold" : "semibold"} color={done ? "primary" : "secondary"}>
          {label}
        </Text>
        {sub ? (
          <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
            {sub}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerIconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  stepDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  boatCard: {
    width: 150,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  boatCheck: {
    position: "absolute",
    top: spacing.sm + 6,
    right: spacing.sm + 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  categoryCard: {
    width: "47%",
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryIcon: { width: 112, height: 112 },
  categoryCheck: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.md },
  chip: { borderWidth: 1.5, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14 },
  toggleRow: { flexDirection: "row", gap: spacing.xs, marginBottom: spacing.md },
  toggleOption: { flex: 1, borderWidth: 1.5, borderRadius: radius.lg, paddingVertical: 12, alignItems: "center" },
  mapPlaceholder: { height: 110, alignItems: "center", justifyContent: "center" },
  urgencyRow: { flexDirection: "row", gap: spacing.xs },
  urgencyCard: { flex: 1, borderWidth: 1.5, borderRadius: radius.lg, padding: spacing.sm },
  urgencyDot: { width: 9, height: 9, borderRadius: 5 },
  summaryRow: { flexDirection: "row", alignItems: "center", padding: spacing.md },
  summaryIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.md },
  photoThumb: { width: 64, height: 64, borderRadius: radius.md, borderWidth: 1.5, overflow: "hidden" },
  photoRemove: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(6,15,32,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoAdd: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  successIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  successStatIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  timelineIcon: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
});

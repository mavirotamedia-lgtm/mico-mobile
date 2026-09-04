import { useEffect, useState } from "react";
import { ScrollView, View, Pressable, Image, StyleSheet, Switch, ActivityIndicator } from "react-native";
import type { ImageSourcePropType } from "react-native";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as boatsApi from "@/api/boats";
import * as serviceRequestsApi from "@/api/serviceRequests";
import { uploadImage } from "@/api/uploads";
import { useTheme } from "@/theme/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import { Text, Button, Input, Header, ScreenContainer, Touchable, useToast } from "@/components/ui";
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

export function CreateServiceRequestScreen({ route, navigation }: Props) {
  const { theme } = useTheme();
  const { show } = useToast();
  const [boats, setBoats] = useState<Boat[]>([]);
  const [boatId, setBoatId] = useState<string | undefined>(route.params?.boatId);
  const [specialty, setSpecialty] = useState<CraftsmanSpecialty>("ENGINE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        if (label) setCity(label);
      } catch {
        // sessiz basarisizlik — kullanici manuel "Konumumu Kullan"a basabilir
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const request = await serviceRequestsApi.createServiceRequest({
        boatId,
        specialty,
        title: title.trim(),
        description: description.trim(),
        photos,
        city: city.trim(),
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        isUrgent,
      });
      show("Servis talebi oluşturuldu", "success");
      navigation.replace("Offers", { serviceRequest: request });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Talep oluşturulamadı.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isValid = title.trim().length > 0 && description.trim().length > 0 && city.trim().length > 0;

  return (
    <ScreenContainer>
      <Header title="Servis Talebi Oluştur" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        {boats.length > 0 ? (
          <>
            <Text variant="bodySmall" weight="semibold" color="secondary" style={{ marginBottom: 6 }}>
              Tekne
            </Text>
            <View style={styles.chipRow}>
              {boats.map((b) => (
                <ChipOption key={b.id} label={b.name} active={boatId === b.id} onPress={() => setBoatId(b.id)} theme={theme} />
              ))}
            </View>
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

        <Input label="Arıza / Talep Başlığı" placeholder="ör. Motor çalışmıyor" value={title} onChangeText={setTitle} icon="alert-circle-outline" />
        <Input
          label="Detaylı Açıklama"
          placeholder="Marşa basıyorum ancak motor dönmüyor..."
          value={description}
          onChangeText={setDescription}
          icon="document-text-outline"
          multiline
          numberOfLines={4}
          style={{ minHeight: 90, textAlignVertical: "top" }}
        />
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
              <Ionicons name="camera-outline" size={20} color={theme.textSecondary} />
            )}
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <Text variant="bodySmall" weight="semibold" color="secondary">
            Konum
          </Text>
          <Touchable onPress={handleUseLocation} haptic disabled={isLocating}>
            <Text variant="bodySmall" weight="bold" color="accent">
              {isLocating ? "Bulunuyor..." : "📍 Konumumu Kullan"}
            </Text>
          </Touchable>
        </View>
        <Input
          placeholder="ör. Bodrum Marina"
          value={city}
          onChangeText={(t) => {
            setCity(t);
            setCoords(null);
          }}
          icon="location-outline"
        />

        <View style={[styles.urgentRow, { borderColor: theme.border }]}>
          <View>
            <Text variant="body" weight="semibold">
              Acil durum
            </Text>
            <Text variant="caption" color="secondary">
              Ustalar bu talebi öncelikli görür
            </Text>
          </View>
          <Switch value={isUrgent} onValueChange={setIsUrgent} trackColor={{ true: theme.primary }} />
        </View>

        {error ? (
          <Text variant="bodySmall" color="danger" style={{ marginBottom: spacing.sm }}>
            {error}
          </Text>
        ) : null}

        <Button
          label="Devam Et"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={!isValid || isUploadingPhoto}
          style={{ marginTop: spacing.xs }}
        />
      </ScrollView>
    </ScreenContainer>
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
      style={[
        styles.chip,
        { borderColor: active ? theme.primary : theme.border, backgroundColor: active ? theme.primary : theme.surface },
      ]}
    >
      <Text variant="bodySmall" weight="semibold" style={{ color: active ? theme.onPrimary : theme.textSecondary }}>
        {label}
      </Text>
    </Pressable>
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
      style={[
        styles.categoryCard,
        { borderColor: active ? theme.primary : theme.border, backgroundColor: theme.surface },
      ]}
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

const styles = StyleSheet.create({
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.md },
  chip: { borderWidth: 1.5, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  categoryCard: {
    width: "47%",
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryIcon: { width: 84, height: 84 },
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
  urgentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
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
});

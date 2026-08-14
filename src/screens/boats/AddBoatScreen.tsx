import { useState } from "react";
import { ScrollView, View, Pressable, Image, StyleSheet, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as boatsApi from "@/api/boats";
import { uploadImage } from "@/api/uploads";
import { useTheme } from "@/theme/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import { Text, Button, Input, Header, BoatVisual, ScreenContainer, useToast } from "@/components/ui";
import type { AppStackParamList } from "@/navigation/RootNavigator";
import { ApiError } from "@/api/client";
import type { BoatType } from "@/types/api";

type Props = NativeStackScreenProps<AppStackParamList, "AddBoat">;

// Backend su an sadece 4 tip destekliyor (SAILBOAT/MOTORBOAT/YACHT/OTHER).
// Kullanicinin gormek istedigi daha zengin liste icin fazla olanlar OTHER'a
// esleniyor — "value" ayni olsa da "key" ile secili sip ayirt ediliyor.
const BOAT_TYPES: { key: string; label: string; value: BoatType }[] = [
  { key: "sailboat", label: "Yelkenli", value: "SAILBOAT" },
  { key: "motoryacht", label: "Motoryat", value: "YACHT" },
  { key: "gulet", label: "Gulet", value: "OTHER" },
  { key: "catamaran", label: "Katamaran", value: "OTHER" },
  { key: "fishing", label: "Balıkçı Teknesi", value: "OTHER" },
  { key: "jetski", label: "Jetski", value: "OTHER" },
  { key: "other", label: "Diğer", value: "OTHER" },
];

export function AddBoatScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { show } = useToast();
  const [name, setName] = useState("");
  const [typeKey, setTypeKey] = useState("motoryacht");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [buildYear, setBuildYear] = useState("");
  const [engineType, setEngineType] = useState("");
  const [homePort, setHomePort] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const selectedType = BOAT_TYPES.find((t) => t.key === typeKey) ?? BOAT_TYPES[0];

  async function handlePickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      show("Fotoğraf seçmek için galeri izni gerekiyor.", "error");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      // Sabit bir aspect vermiyoruz: onizleme kutusu (asagida) genis/kisa bir
      // oranda (~2.2:1) — 4:3 gibi sabit bir kirpma zorlarsak, kutunun "cover"
      // modu bu kirpilmis gorseli tekrar kirpip tuhaf/yakinlastirilmis
      // gosterirdi. Kullanici nasil kirparsa kirpsin, kutu onu duzgunce kaplar.
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    setPhotoUri(uri);
    setUploadedImageUrl(null);
    setIsUploadingPhoto(true);
    try {
      const url = await uploadImage(uri);
      setUploadedImageUrl(url);
    } catch (e) {
      show(e instanceof ApiError ? e.message : "Fotoğraf yüklenemedi.", "error");
      setPhotoUri(null);
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      const parsedYear = buildYear.trim() ? Number(buildYear.trim()) : undefined;
      await boatsApi.createBoat({
        name: name.trim(),
        type: selectedType.value,
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        buildYear: parsedYear && !Number.isNaN(parsedYear) ? parsedYear : undefined,
        engineType: engineType.trim() || undefined,
        homePort: homePort.trim() || undefined,
        image: uploadedImageUrl || undefined,
      });
      show("Tekne eklendi", "success");
      navigation.goBack();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Tekne eklenemedi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <Header title="Yeni Tekne" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Pressable onPress={handlePickPhoto} style={[styles.photoBox, { borderColor: theme.border }]}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          ) : (
            <BoatVisual image={null} type={selectedType.value} style={StyleSheet.absoluteFillObject} />
          )}
          <View style={styles.photoOverlay}>
            {isUploadingPhoto ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="camera" size={18} color="#FFFFFF" />
                <Text variant="bodySmall" weight="semibold" style={{ color: "#FFFFFF", marginLeft: 6 }}>
                  {photoUri ? "Fotoğrafı Değiştir" : "Fotoğraf Ekle"}
                </Text>
              </>
            )}
          </View>
        </Pressable>

        <Input label="Tekne Adı" placeholder="ör. Sea Ray 320" value={name} onChangeText={setName} icon="boat-outline" />

        <Text variant="bodySmall" weight="semibold" color="secondary" style={{ marginBottom: 6 }}>
          Tip
        </Text>
        <View style={styles.typeRow}>
          {BOAT_TYPES.map((t) => {
            const active = typeKey === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => setTypeKey(t.key)}
                style={[
                  styles.chip,
                  { borderColor: active ? theme.primary : theme.border, backgroundColor: active ? theme.primary : theme.surface },
                ]}
              >
                <Text variant="bodySmall" weight="semibold" style={{ color: active ? theme.onPrimary : theme.textSecondary }}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Input label="Marka (opsiyonel)" placeholder="ör. Sea Ray" value={brand} onChangeText={setBrand} icon="pricetag-outline" />
        <Input label="Model (opsiyonel)" placeholder="ör. 320 Sundancer" value={model} onChangeText={setModel} icon="document-text-outline" />
        <Input
          label="Üretim Yılı (opsiyonel)"
          placeholder="ör. 2018"
          value={buildYear}
          onChangeText={(t) => setBuildYear(t.replace(/[^0-9]/g, ""))}
          keyboardType="number-pad"
          maxLength={4}
          icon="calendar-outline"
        />
        <Input
          label="Motor Markası (opsiyonel)"
          placeholder="ör. Yamaha, Volvo Penta"
          value={engineType}
          onChangeText={setEngineType}
          icon="cog-outline"
        />
        <Input label="Bağlama Limanı (opsiyonel)" placeholder="ör. Bodrum Marina" value={homePort} onChangeText={setHomePort} icon="location-outline" />

        {error ? (
          <Text variant="bodySmall" color="danger" style={{ marginBottom: spacing.sm }}>
            {error}
          </Text>
        ) : null}

        <Button
          label="Kaydet"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={!name.trim() || isUploadingPhoto}
          style={{ marginTop: spacing.xs }}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  photoBox: {
    width: "100%",
    height: 160,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: "dashed",
    overflow: "hidden",
    marginBottom: spacing.lg,
    justifyContent: "flex-end",
  },
  photoOverlay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(6,15,32,0.55)",
    paddingVertical: spacing.sm,
  },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.sm },
  chip: { borderWidth: 1.5, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14 },
});

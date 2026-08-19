import { useState } from "react";
import { ScrollView, View, Pressable, StyleSheet } from "react-native";
import * as Location from "expo-location";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as craftsmenApi from "@/api/craftsmen";
import { useTheme } from "@/theme/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import { Text, Button, Input, Header, ScreenContainer, Touchable, useToast } from "@/components/ui";
import type { AppStackParamList } from "@/navigation/RootNavigator";
import { ApiError } from "@/api/client";
import { SPECIALTY_LABELS, type CraftsmanSpecialty } from "@/types/mico";

type Props = NativeStackScreenProps<AppStackParamList, "BecomeCraftsman">;

const SPECIALTIES = Object.entries(SPECIALTY_LABELS) as [CraftsmanSpecialty, string][];

export function BecomeCraftsmanScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { show } = useToast();
  const [specialty, setSpecialty] = useState<CraftsmanSpecialty>("ENGINE");
  const [businessName, setBusinessName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [marina, setMarina] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const label = place ? (place.city ?? place.subregion ?? place.region ?? "") : "";
      if (label) setCity(label);
    } catch {
      show("Konum alınamadı.", "error");
    } finally {
      setIsLocating(false);
    }
  }

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      await craftsmenApi.createCraftsmanProfile({
        specialty,
        businessName: businessName.trim() || undefined,
        bio: bio.trim() || undefined,
        city: city.trim(),
        marina: marina.trim() || undefined,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        experienceYears: experienceYears.trim() ? Number(experienceYears.trim()) : undefined,
      });
      show("Usta başvurun alındı! Admin onayından sonra uygulamada görünürsün.", "success");
      navigation.goBack();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Başvuru gönderilemedi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isValid = city.trim().length > 0;

  return (
    <ScreenContainer>
      <Header title="Usta Ol" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Text variant="bodySmall" color="secondary" style={{ marginBottom: spacing.md }}>
          Bilgilerini gir, başvurun admin onayından geçtikten sonra Usta Bul listesinde görünmeye başlarsın.
        </Text>

        <Text variant="bodySmall" weight="semibold" color="secondary" style={{ marginBottom: 6 }}>
          Uzmanlık Alanı
        </Text>
        <View style={styles.chipRow}>
          {SPECIALTIES.map(([value, label]) => (
            <ChipOption key={value} label={label} active={specialty === value} onPress={() => setSpecialty(value)} theme={theme} />
          ))}
        </View>

        <Input
          label="İşletme Adı (opsiyonel)"
          placeholder="ör. Ege Motor Servisi"
          value={businessName}
          onChangeText={setBusinessName}
          icon="briefcase-outline"
        />
        <Input
          label="Hakkında (opsiyonel)"
          placeholder="Tecrüben, uzmanlaştığın markalar..."
          value={bio}
          onChangeText={setBio}
          icon="document-text-outline"
          multiline
          numberOfLines={3}
          style={{ minHeight: 70, textAlignVertical: "top" }}
        />
        <Input
          label="Deneyim (Yıl, opsiyonel)"
          placeholder="ör. 5"
          value={experienceYears}
          onChangeText={setExperienceYears}
          icon="ribbon-outline"
          keyboardType="number-pad"
        />

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <Text variant="bodySmall" weight="semibold" color="secondary">
            Şehir
          </Text>
          <Touchable onPress={handleUseLocation} haptic disabled={isLocating}>
            <Text variant="bodySmall" weight="bold" color="accent">
              {isLocating ? "Bulunuyor..." : "📍 Konumumu Kullan"}
            </Text>
          </Touchable>
        </View>
        <Input
          placeholder="ör. Bodrum"
          value={city}
          onChangeText={(t) => {
            setCity(t);
            setCoords(null);
          }}
          icon="location-outline"
        />
        <Input
          label="Marina (opsiyonel)"
          placeholder="ör. Milta Marina"
          value={marina}
          onChangeText={setMarina}
          icon="boat-outline"
        />

        {error ? (
          <Text variant="bodySmall" color="danger" style={{ marginBottom: spacing.sm }}>
            {error}
          </Text>
        ) : null}

        <Button label="Başvuruyu Gönder" onPress={handleSubmit} loading={isSubmitting} disabled={!isValid} style={{ marginTop: spacing.xs }} />
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

const styles = StyleSheet.create({
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.md },
  chip: { borderWidth: 1.5, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14 },
});

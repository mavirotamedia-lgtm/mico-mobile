import { useEffect, useState } from "react";
import { ScrollView, View, Pressable, StyleSheet, Switch } from "react-native";
import * as Location from "expo-location";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as boatsApi from "@/api/boats";
import * as serviceRequestsApi from "@/api/serviceRequests";
import { useTheme } from "@/theme/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import { Text, Button, Input, Header, ScreenContainer, Touchable, useToast } from "@/components/ui";
import type { AppStackParamList } from "@/navigation/RootNavigator";
import { ApiError } from "@/api/client";
import type { Boat } from "@/types/api";
import { SPECIALTY_LABELS, type CraftsmanSpecialty } from "@/types/mico";

type Props = NativeStackScreenProps<AppStackParamList, "CreateServiceRequest">;

const SPECIALTIES = Object.entries(SPECIALTY_LABELS) as [CraftsmanSpecialty, string][];

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
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Bilerek sadece mount'ta bir kez calisir — boatId'yi bagimliliga eklemek
    // kullanici bir tekne cip'ine her dokundugunda gereksiz yere tekne
    // listesini yeniden cekiyordu.
    boatsApi
      .listBoats()
      .then((list) => {
        setBoats(list);
        setBoatId((current) => {
          if (current || !list[0]) return current;
          if (list[0].homePort) setCity(list[0].homePort);
          return list[0].id;
        });
      })
      .catch((e) => show(e instanceof ApiError ? e.message : "Tekneler yüklenemedi.", "error"));
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

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      const request = await serviceRequestsApi.createServiceRequest({
        boatId,
        specialty,
        title: title.trim(),
        description: description.trim(),
        city: city.trim(),
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        isUrgent,
      });
      show("Servis talebi oluşturuldu", "success");
      navigation.replace("Offers", { serviceRequestId: request.id, requestTitle: request.title });
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
          Kategori
        </Text>
        <View style={styles.chipRow}>
          {SPECIALTIES.map(([value, label]) => (
            <ChipOption key={value} label={label} active={specialty === value} onPress={() => setSpecialty(value)} theme={theme} />
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

        <Button label="Devam Et" onPress={handleSubmit} loading={isSubmitting} disabled={!isValid} style={{ marginTop: spacing.xs }} />
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
  urgentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
});

import { useState } from "react";
import { ScrollView, View, Pressable, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as boatsApi from "@/api/boats";
import { useTheme } from "@/theme/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import { Text, Button, Input, Header, ScreenContainer, useToast } from "@/components/ui";
import type { AppStackParamList } from "@/navigation/RootNavigator";
import { ApiError } from "@/api/client";
import type { BoatType } from "@/types/api";

type Props = NativeStackScreenProps<AppStackParamList, "AddBoat">;

const BOAT_TYPES: { value: BoatType; label: string }[] = [
  { value: "MOTORBOAT", label: "Motorbot" },
  { value: "SAILBOAT", label: "Yelkenli" },
  { value: "YACHT", label: "Yat" },
  { value: "OTHER", label: "Diğer" },
];

export function AddBoatScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { show } = useToast();
  const [name, setName] = useState("");
  const [type, setType] = useState<BoatType>("MOTORBOAT");
  const [brand, setBrand] = useState("");
  const [homePort, setHomePort] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      await boatsApi.createBoat({
        name: name.trim(),
        type,
        brand: brand.trim() || undefined,
        homePort: homePort.trim() || undefined,
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
        <Input label="Tekne Adı" placeholder="ör. Sea Ray 320" value={name} onChangeText={setName} icon="boat-outline" />

        <Text variant="bodySmall" weight="semibold" color="secondary" style={{ marginBottom: 6 }}>
          Tip
        </Text>
        <View style={styles.typeRow}>
          {BOAT_TYPES.map((t) => {
            const active = type === t.value;
            return (
              <Pressable
                key={t.value}
                onPress={() => setType(t.value)}
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
        <Input label="Bağlama Limanı (opsiyonel)" placeholder="ör. Bodrum Marina" value={homePort} onChangeText={setHomePort} icon="location-outline" />

        {error ? (
          <Text variant="bodySmall" color="danger" style={{ marginBottom: spacing.sm }}>
            {error}
          </Text>
        ) : null}

        <Button label="Kaydet" onPress={handleSubmit} loading={isSubmitting} disabled={!name.trim()} style={{ marginTop: spacing.xs }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.sm },
  chip: { borderWidth: 1.5, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14 },
});

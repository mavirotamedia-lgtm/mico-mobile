import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as boatsApi from "@/api/boats";
import { colors } from "@/theme/colors";
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
      navigation.goBack();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Tekne eklenemedi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Yeni tekne</Text>

      <TextInput
        style={styles.input}
        placeholder="Tekne adı"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
      />

      <View style={styles.typeRow}>
        {BOAT_TYPES.map((t) => (
          <Pressable
            key={t.value}
            style={[styles.typeChip, type === t.value && styles.typeChipActive]}
            onPress={() => setType(t.value)}
          >
            <Text style={type === t.value ? styles.typeChipTextActive : styles.typeChipText}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Marka (opsiyonel)"
        placeholderTextColor={colors.textMuted}
        value={brand}
        onChangeText={setBrand}
      />
      <TextInput
        style={styles.input}
        placeholder="Bağlama limanı (opsiyonel)"
        placeholderTextColor={colors.textMuted}
        value={homePort}
        onChangeText={setHomePort}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={isSubmitting || !name.trim()}>
        {isSubmitting ? <ActivityIndicator color={colors.text} /> : <Text style={styles.buttonText}>Kaydet</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 20 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    color: colors.text,
    marginBottom: 12,
  },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  typeChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeChipText: { color: colors.textMuted },
  typeChipTextActive: { color: colors.text, fontWeight: "600" },
  button: { backgroundColor: colors.primary, borderRadius: 10, padding: 14, alignItems: "center", marginTop: 8 },
  buttonText: { color: colors.text, fontWeight: "600" },
  error: { color: colors.danger, marginBottom: 8 },
});

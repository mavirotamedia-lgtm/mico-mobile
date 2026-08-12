import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as boatsApi from "@/api/boats";
import * as maintenanceApi from "@/api/maintenance";
import { colors } from "@/theme/colors";
import type { AppStackParamList } from "@/navigation/RootNavigator";
import type { Boat, MaintenanceRecord } from "@/types/api";

type Props = NativeStackScreenProps<AppStackParamList, "BoatDetail">;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

export function BoatDetailScreen({ route }: Props) {
  const { boatId } = route.params;
  const [boat, setBoat] = useState<Boat | null>(null);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const load = useCallback(async () => {
    const [boatData, maintenanceData] = await Promise.all([
      boatsApi.getBoat(boatId),
      maintenanceApi.listMaintenance(boatId),
    ]);
    setBoat(boatData);
    setRecords(maintenanceData);
  }, [boatId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleAddRecord() {
    if (!title.trim() || !description.trim()) return;
    await maintenanceApi.addMaintenance(boatId, {
      title: title.trim(),
      description: description.trim(),
      performedAt: new Date().toISOString(),
    });
    setTitle("");
    setDescription("");
    setIsAdding(false);
    load();
  }

  return (
    <View style={styles.container}>
      {boat ? (
        <View style={styles.header}>
          <Text style={styles.boatName}>{boat.name}</Text>
          <Text style={styles.boatMeta}>
            {[boat.brand, boat.model, boat.homePort].filter(Boolean).join(" · ") || "Detay bilgisi eklenmedi"}
          </Text>
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Bakım defteri</Text>
        <Pressable onPress={() => setIsAdding((v) => !v)}>
          <Text style={styles.link}>{isAdding ? "Vazgeç" : "+ Kayıt ekle"}</Text>
        </Pressable>
      </View>

      {isAdding ? (
        <View style={styles.addForm}>
          <TextInput
            style={styles.input}
            placeholder="Başlık (ör. Yağ değişimi)"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.input}
            placeholder="Açıklama"
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <Pressable style={styles.button} onPress={handleAddRecord}>
            <Text style={styles.buttonText}>Kaydet</Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>Henüz bakım kaydı yok.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDesc}>{item.description}</Text>
            <Text style={styles.cardDate}>{formatDate(item.performedAt)}</Text>
            {item.nextDueDate ? (
              <Text style={styles.reminder}>Sonraki bakım: {formatDate(item.nextDueDate)}</Text>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  header: { marginBottom: 20 },
  boatName: { fontSize: 24, fontWeight: "700", color: colors.text },
  boatMeta: { color: colors.textMuted, marginTop: 4 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: colors.text },
  link: { color: colors.primary },
  addForm: { marginBottom: 16 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    marginBottom: 8,
  },
  button: { backgroundColor: colors.primary, borderRadius: 10, padding: 12, alignItems: "center" },
  buttonText: { color: colors.text, fontWeight: "600" },
  emptyText: { color: colors.textMuted, textAlign: "center", marginTop: 20 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: { color: colors.text, fontWeight: "600" },
  cardDesc: { color: colors.textMuted, marginTop: 2 },
  cardDate: { color: colors.textMuted, fontSize: 12, marginTop: 6 },
  reminder: { color: colors.accent, fontSize: 12, marginTop: 4 },
});

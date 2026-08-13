import { useCallback, useState } from "react";
import { ScrollView, View, Image, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as boatsApi from "@/api/boats";
import * as maintenanceApi from "@/api/maintenance";
import { useTheme } from "@/theme/ThemeContext";
import { spacing } from "@/theme/tokens";
import { Text, Card, Badge, Button, Input, Header, Modal, ScreenContainer, useToast } from "@/components/ui";
import type { AppStackParamList } from "@/navigation/RootNavigator";
import type { Boat, MaintenanceRecord } from "@/types/api";
import { ApiError } from "@/api/client";

type Props = NativeStackScreenProps<AppStackParamList, "BoatDetail">;

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&q=70";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

export function BoatDetailScreen({ route, navigation }: Props) {
  const { boatId } = route.params;
  const { theme } = useTheme();
  const { show } = useToast();
  const [boat, setBoat] = useState<Boat | null>(null);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [boatData, maintenanceData] = await Promise.all([
        boatsApi.getBoat(boatId),
        maintenanceApi.listMaintenance(boatId),
      ]);
      setBoat(boatData);
      setRecords(maintenanceData);
    } catch (e) {
      show(e instanceof ApiError ? e.message : "Tekne bilgileri yüklenemedi.", "error");
    }
  }, [boatId, show]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleAddRecord() {
    if (!title.trim() || !description.trim()) return;
    setIsSaving(true);
    try {
      await maintenanceApi.addMaintenance(boatId, {
        title: title.trim(),
        description: description.trim(),
        performedAt: new Date().toISOString(),
      });
      setTitle("");
      setDescription("");
      setIsAdding(false);
      show("Bakım kaydı eklendi", "success");
      load();
    } catch (e) {
      show(e instanceof ApiError ? e.message : "Bakım kaydı eklenemedi.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScreenContainer>
      <Header title={boat?.name ?? "Tekne"} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <Image source={{ uri: boat?.image ?? FALLBACK_IMAGE }} style={{ width: "100%", height: 200 }} />

        <View style={{ padding: spacing.lg }}>
          <Card>
            <Text variant="h2" weight="bold" style={{ marginBottom: spacing.sm }}>
              Genel Bilgiler
            </Text>
            <InfoRow label="Marka" value={boat?.brand ?? "—"} />
            <InfoRow label="Model" value={boat?.model ?? "—"} />
            <InfoRow label="Yıl" value={boat?.buildYear ? String(boat.buildYear) : "—"} />
            <InfoRow label="Motor" value={boat?.engineType ?? "—"} />
            <InfoRow label="Liman" value={boat?.homePort ?? "—"} last />
          </Card>

          <View style={styles.sectionHeaderRow}>
            <Text variant="h2" weight="bold">
              Bakım Takvimi
            </Text>
            <Text variant="bodySmall" weight="semibold" color="accent" onPress={() => setIsAdding(true)}>
              + Bakım Ekle
            </Text>
          </View>

          {records.length === 0 ? (
            <Card>
              <Text variant="bodySmall" color="secondary">
                Henüz bakım kaydı yok.
              </Text>
            </Card>
          ) : (
            records.map((r) => (
              <Card key={r.id} style={{ marginBottom: spacing.sm, flexDirection: "row", alignItems: "flex-start" }}>
                <View style={[styles.recordIcon, { backgroundColor: theme.surfaceAlt }]}>
                  <Ionicons name="construct-outline" size={16} color={theme.primary} />
                </View>
                <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                  <Text variant="body" weight="semibold">
                    {r.title}
                  </Text>
                  <Text variant="caption" color="secondary" numberOfLines={2}>
                    {r.description}
                  </Text>
                  <Text variant="caption" color="secondary" style={{ marginTop: 4 }}>
                    {formatDate(r.performedAt)}
                  </Text>
                </View>
                {r.nextDueDate ? <Badge label={`Sonraki: ${formatDate(r.nextDueDate)}`} tone="warning" /> : null}
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={isAdding} onClose={() => setIsAdding(false)} title="Bakım Kaydı Ekle">
        <Input label="Başlık" placeholder="ör. Yağ değişimi" value={title} onChangeText={setTitle} icon="construct-outline" />
        <Input label="Açıklama" placeholder="Detay" value={description} onChangeText={setDescription} icon="document-text-outline" />
        <Button label="Kaydet" onPress={handleAddRecord} loading={isSaving} disabled={!title.trim() || !description.trim()} />
      </Modal>
    </ScreenContainer>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.infoRow, !last && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <Text variant="bodySmall" color="secondary">
        {label}
      </Text>
      <Text variant="bodySmall" weight="semibold">
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  recordIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
});

import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as boatsApi from "@/api/boats";
import { useAuth } from "@/store/AuthContext";
import { colors } from "@/theme/colors";
import type { Boat } from "@/types/api";
import type { AppStackParamList } from "@/navigation/RootNavigator";

type Props = NativeStackScreenProps<AppStackParamList, "BoatList">;

const BOAT_TYPE_LABEL: Record<Boat["type"], string> = {
  SAILBOAT: "Yelkenli",
  MOTORBOAT: "Motorbot",
  YACHT: "Yat",
  OTHER: "Diğer",
};

export function BoatListScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [boats, setBoats] = useState<Boat[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadBoats = useCallback(async () => {
    setIsRefreshing(true);
    try {
      setBoats(await boatsApi.listBoats());
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBoats();
    }, [loadBoats])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Teknelerim</Text>
        <Pressable onPress={logout}>
          <Text style={styles.logout}>Çıkış</Text>
        </Pressable>
      </View>

      <FlatList
        data={boats}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={loadBoats} tintColor={colors.primary} />}
        contentContainerStyle={boats.length === 0 && styles.emptyContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Henüz tekne eklemedin. Aşağıdaki butonla ilk tekneni ekle.</Text>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => navigation.navigate("BoatDetail", { boatId: item.id })}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSubtitle}>
              {BOAT_TYPE_LABEL[item.type]}
              {item.brand ? ` · ${item.brand}` : ""}
              {item.homePort ? ` · ${item.homePort}` : ""}
            </Text>
          </Pressable>
        )}
      />

      <Pressable style={styles.fab} onPress={() => navigation.navigate("AddBoat")}>
        <Text style={styles.fabText}>+ Tekne ekle</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "700", color: colors.text },
  logout: { color: colors.danger },
  emptyContainer: { flexGrow: 1, justifyContent: "center" },
  emptyText: { color: colors.textMuted, textAlign: "center" },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: "600" },
  cardSubtitle: { color: colors.textMuted, marginTop: 4 },
  fab: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
  },
  fabText: { color: colors.background, fontWeight: "700" },
});

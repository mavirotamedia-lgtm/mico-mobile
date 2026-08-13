import { useCallback, useEffect, useState } from "react";
import { FlatList, View, Pressable, StyleSheet, RefreshControl } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as craftsmenApi from "@/api/craftsmen";
import { useTheme } from "@/theme/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import { Text, Card, Avatar, Rating, Badge, Header, ScreenContainer } from "@/components/ui";
import type { AppStackParamList } from "@/navigation/RootNavigator";
import type { Craftsman } from "@/types/mico";
import { SPECIALTY_LABELS, type CraftsmanSpecialty } from "@/types/mico";

type Props = NativeStackScreenProps<AppStackParamList, "CraftsmanList">;

const SPECIALTIES = Object.entries(SPECIALTY_LABELS) as [CraftsmanSpecialty, string][];
// [deger, etiket] sirasi SPECIALTIES ile ayni tutuluyor — "Tumu" filtresi icin deger yok (undefined).
const CATEGORY_FILTERS: [CraftsmanSpecialty | undefined, string][] = [[undefined, "Tümü"], ...SPECIALTIES];

export function CraftsmanListScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const [craftsmen, setCraftsmen] = useState<Craftsman[]>([]);
  const [specialty, setSpecialty] = useState<CraftsmanSpecialty | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await craftsmenApi.listCraftsmen(specialty ? { specialty } : {});
      setCraftsmen(res.items);
    } finally {
      setIsLoading(false);
    }
  }, [specialty]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScreenContainer>
      <Header title="Usta Listesi" onBack={() => navigation.goBack()} />

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={CATEGORY_FILTERS}
        keyExtractor={([, label]) => label}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.xs, paddingBottom: spacing.sm }}
        style={{ flexGrow: 0 }}
        renderItem={({ item: [value, label] }) => {
          const active = specialty === value;
          return (
            <Pressable
              onPress={() => setSpecialty(value)}
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
        }}
      />

      <FlatList
        data={craftsmen}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={theme.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={36} color={theme.textSecondary} />
            <Text variant="body" color="secondary" style={{ marginTop: spacing.sm }}>
              Bu filtreyle usta bulunamadı.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card
            onPress={() => navigation.navigate("CraftsmanDetail", { craftsmanId: item.id })}
            style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.sm }}
          >
            <Avatar name={item.businessName ?? "Usta"} uri={item.avatar} size={48} />
            <View style={{ marginLeft: spacing.sm, flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text variant="body" weight="semibold" numberOfLines={1} style={{ flex: 1 }}>
                  {item.businessName ?? SPECIALTY_LABELS[item.specialty]}
                </Text>
                {item.isVerified ? <Ionicons name="checkmark-circle" size={16} color={theme.success} /> : null}
              </View>
              <Rating value={item.ratingAvg} count={item.ratingCount} />
              <Text variant="caption" color="secondary" numberOfLines={1}>
                {item.city}
                {item.marina ? ` · ${item.marina}` : ""}
              </Text>
            </View>
            <Badge label={SPECIALTY_LABELS[item.specialty]} tone="neutral" />
          </Card>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  chip: { borderWidth: 1.5, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14 },
  empty: { alignItems: "center", paddingTop: spacing.xxxl },
});

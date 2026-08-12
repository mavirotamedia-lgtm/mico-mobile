import { View, StyleSheet, Pressable } from "react-native";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/store/AuthContext";
import { useTheme } from "@/theme/ThemeContext";
import { spacing } from "@/theme/tokens";
import { Text, Card, Avatar, ScreenContainer } from "@/components/ui";
import type { MainTabParamList } from "@/navigation/MainTabs";
import type { AppStackParamList } from "@/navigation/RootNavigator";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Profile">,
  NativeStackScreenProps<AppStackParamList>
>;

export function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const { theme, preference, setPreference } = useTheme();

  const menuItems: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }[] = [
    { icon: "boat-outline", label: "Teknelerim", onPress: () => navigation.navigate("MyBoat") },
    { icon: "pricetag-outline", label: "Servis Taleplerim", onPress: () => navigation.navigate("ServiceRequests") },
    { icon: "construct-outline", label: "Usta Bul", onPress: () => navigation.navigate("CraftsmanList") },
  ];

  const themeOptions: { key: "light" | "dark" | "system"; label: string }[] = [
    { key: "light", label: "Açık" },
    { key: "dark", label: "Koyu" },
    { key: "system", label: "Sistem" },
  ];

  return (
    <ScreenContainer>
      <View style={{ padding: spacing.lg }}>
        <Text variant="h1" weight="bold" style={{ marginBottom: spacing.md }}>
          Profil
        </Text>

        <Card style={{ flexDirection: "row", alignItems: "center" }}>
          <Avatar name={user?.name ?? "Kaptan"} size={56} />
          <View style={{ marginLeft: spacing.sm, flex: 1 }}>
            <Text variant="h2" weight="bold" numberOfLines={1}>
              {user?.name}
            </Text>
            <Text variant="bodySmall" color="secondary" numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
        </Card>

        <Text variant="bodySmall" weight="semibold" color="secondary" style={styles.sectionLabel}>
          MENÜ
        </Text>
        <Card style={{ padding: 0 }}>
          {menuItems.map((item, index) => (
            <Pressable
              key={item.label}
              onPress={item.onPress}
              style={[
                styles.menuRow,
                index < menuItems.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
              ]}
            >
              <Ionicons name={item.icon} size={20} color={theme.textSecondary} />
              <Text variant="body" style={{ marginLeft: spacing.sm, flex: 1 }}>
                {item.label}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </Pressable>
          ))}
        </Card>

        <Text variant="bodySmall" weight="semibold" color="secondary" style={styles.sectionLabel}>
          GÖRÜNÜM
        </Text>
        <Card style={{ flexDirection: "row", padding: spacing.xs }}>
          {themeOptions.map((opt) => {
            const active = preference === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setPreference(opt.key)}
                style={[
                  styles.themeOption,
                  { backgroundColor: active ? theme.primary : "transparent" },
                ]}
              >
                <Text variant="bodySmall" weight="semibold" style={{ color: active ? theme.onPrimary : theme.textSecondary }}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </Card>

        <Pressable onPress={logout} style={styles.logoutRow}>
          <Ionicons name="log-out-outline" size={20} color={theme.danger} />
          <Text variant="body" weight="semibold" color="danger" style={{ marginLeft: spacing.sm }}>
            Çıkış Yap
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { marginTop: spacing.lg, marginBottom: spacing.xs, marginLeft: 4, letterSpacing: 0.5 },
  menuRow: { flexDirection: "row", alignItems: "center", padding: spacing.md },
  themeOption: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 10 },
  logoutRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: spacing.xl, padding: spacing.sm },
});

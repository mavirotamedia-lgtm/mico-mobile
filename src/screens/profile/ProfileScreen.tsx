import { useCallback, useState } from "react";
import { ScrollView, View, StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as craftsmenApi from "@/api/craftsmen";
import { useAuth } from "@/store/AuthContext";
import { useTheme } from "@/theme/ThemeContext";
import { spacing } from "@/theme/tokens";
import { Text, Card, Avatar, ScreenContainer, Touchable, Reveal } from "@/components/ui";
import type { MainTabParamList } from "@/navigation/MainTabs";
import type { AppStackParamList } from "@/navigation/RootNavigator";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Profile">,
  NativeStackScreenProps<AppStackParamList>
>;

export function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const { theme, preference, setPreference } = useTheme();
  const insets = useSafeAreaInsets();
  const [isCraftsman, setIsCraftsman] = useState(false);

  // useFocusEffect (mount-only useEffect degil): Usta Ol formunu doldurup
  // geri donuldugunde bu ekran menusunun (Usta Panelim/Usta Profilim) hemen
  // gorunmesi icin durum her odaklanmada tazelenmeli.
  useFocusEffect(
    useCallback(() => {
      craftsmenApi
        .getMyCraftsmanProfile()
        .then(() => setIsCraftsman(true))
        .catch(() => setIsCraftsman(false));
    }, [])
  );

  const menuItems: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }[] = [
    { icon: "boat-outline", label: "Teknelerim", onPress: () => navigation.navigate("MyBoat") },
    { icon: "pricetag-outline", label: "Servis Taleplerim", onPress: () => navigation.navigate("ServiceRequests") },
    { icon: "construct-outline", label: "Usta Bul", onPress: () => navigation.navigate("CraftsmanList") },
    { icon: "chatbubbles-outline", label: "Mesajlarım", onPress: () => navigation.navigate("Conversations") },
    ...(isCraftsman
      ? [
          { icon: "briefcase-outline" as const, label: "Usta Panelim", onPress: () => navigation.navigate("IncomingRequests") },
          { icon: "person-circle-outline" as const, label: "Usta Profilim", onPress: () => navigation.navigate("CraftsmanProfile") },
        ]
      : [{ icon: "hammer-outline" as const, label: "Usta Ol", onPress: () => navigation.navigate("BecomeCraftsman") }]),
  ];

  function handleLogout() {
    Alert.alert("Çıkış Yap", "Hesabından çıkmak istediğine emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Çıkış Yap", style: "destructive", onPress: logout },
    ]);
  }

  const themeOptions: { key: "light" | "dark" | "system"; label: string }[] = [
    { key: "light", label: "Açık" },
    { key: "dark", label: "Koyu" },
    { key: "system", label: "Sistem" },
  ];

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: insets.top + spacing.sm, paddingBottom: spacing.xxl }}>
        <Text variant="h1" weight="extrabold" style={{ marginBottom: spacing.md }}>
          Profil
        </Text>

        <Reveal>
          <Card style={{ flexDirection: "row", alignItems: "center" }}>
            <Avatar name={user?.name ?? "Kaptan"} size={56} />
            <View style={{ marginLeft: spacing.sm, flex: 1 }}>
              <Text variant="h2" weight="extrabold" numberOfLines={1}>
                {user?.name}
              </Text>
              <Text variant="bodySmall" color="secondary">
                {user?.email}
              </Text>
            </View>
          </Card>
        </Reveal>

        <Reveal delay={60}>
          <Text variant="bodySmall" weight="semibold" color="secondary" style={styles.sectionLabel}>
            MENÜ
          </Text>
          <Card style={{ padding: 0 }}>
            {menuItems.map((item, index) => (
              <Touchable
                key={item.label}
                onPress={item.onPress}
                haptic
                scaleTo={0.98}
                style={[
                  styles.menuRow,
                  index < menuItems.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
                ]}
              >
                <Ionicons name={item.icon} size={20} color={theme.textSecondary} />
                <Text variant="body" weight="semibold" style={{ marginLeft: spacing.sm, flex: 1 }}>
                  {item.label}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              </Touchable>
            ))}
          </Card>
        </Reveal>

        <Reveal delay={120}>
          <Text variant="bodySmall" weight="semibold" color="secondary" style={styles.sectionLabel}>
            GÖRÜNÜM
          </Text>
          <Card style={{ flexDirection: "row", padding: spacing.xs }}>
            {themeOptions.map((opt) => {
              const active = preference === opt.key;
              return (
                <Touchable
                  key={opt.key}
                  onPress={() => setPreference(opt.key)}
                  haptic
                  scaleTo={0.95}
                  style={[styles.themeOption, { backgroundColor: active ? theme.primary : "transparent" }]}
                >
                  <Text variant="bodySmall" weight="bold" style={{ color: active ? theme.onPrimary : theme.textSecondary }}>
                    {opt.label}
                  </Text>
                </Touchable>
              );
            })}
          </Card>
        </Reveal>

        <Touchable onPress={handleLogout} haptic style={styles.logoutRow}>
          <Ionicons name="log-out-outline" size={20} color={theme.danger} />
          <Text variant="body" weight="semibold" color="danger" style={{ marginLeft: spacing.sm }}>
            Çıkış Yap
          </Text>
        </Touchable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { marginTop: spacing.lg, marginBottom: spacing.xs, marginLeft: 4, letterSpacing: 0.5 },
  menuRow: { flexDirection: "row", alignItems: "center", padding: spacing.md },
  themeOption: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 10 },
  logoutRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: spacing.xl, padding: spacing.sm },
});

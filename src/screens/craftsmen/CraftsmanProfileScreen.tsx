import { useCallback, useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as craftsmenApi from "@/api/craftsmen";
import { uploadImage } from "@/api/uploads";
import { useTheme } from "@/theme/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import { Text, Avatar, Card, Header, ScreenContainer, Touchable, Skeleton, useToast } from "@/components/ui";
import type { AppStackParamList } from "@/navigation/RootNavigator";
import type { Craftsman } from "@/types/mico";
import { SPECIALTY_LABELS } from "@/types/mico";
import { ApiError } from "@/api/client";

type Props = NativeStackScreenProps<AppStackParamList, "CraftsmanProfile">;

const AVATAR_SIZE = 96;

export function CraftsmanProfileScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { show } = useToast();
  const [craftsman, setCraftsman] = useState<Craftsman | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      craftsmenApi
        .getMyCraftsmanProfile()
        .then(setCraftsman)
        .catch(() => show("Usta profili yüklenemedi.", "error"))
        .finally(() => setIsLoading(false));
    }, [show])
  );

  async function handlePickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      show("Fotoğraf seçmek için galeri izni gerekiyor.", "error");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;

    setIsUploading(true);
    try {
      const url = await uploadImage(result.assets[0].uri, result.assets[0].mimeType);
      const updated = await craftsmenApi.updateMyCraftsmanProfile({ avatar: url });
      setCraftsman(updated);
      show("Profil resmi güncellendi.", "success");
    } catch (e) {
      show(e instanceof ApiError ? e.message : "Fotoğraf yüklenemedi.", "error");
    } finally {
      setIsUploading(false);
    }
  }

  if (isLoading) {
    return (
      <ScreenContainer>
        <Header title="Usta Profilim" onBack={() => navigation.goBack()} />
        <View style={{ padding: spacing.lg }}>
          <Skeleton width={AVATAR_SIZE} height={AVATAR_SIZE} radius={AVATAR_SIZE / 2} style={{ alignSelf: "center" }} />
        </View>
      </ScreenContainer>
    );
  }

  if (!craftsman) return null;

  return (
    <ScreenContainer>
      <Header title="Usta Profilim" onBack={() => navigation.goBack()} />

      <View style={{ padding: spacing.lg }}>
        <View style={styles.avatarSection}>
          <Touchable onPress={handlePickAvatar} disabled={isUploading} style={styles.avatarTouchable}>
            <Avatar name={craftsman.businessName ?? "Usta"} uri={craftsman.avatar} size={AVATAR_SIZE} />
            <View style={[styles.editBadge, { backgroundColor: theme.primary, borderColor: theme.background }]}>
              {isUploading ? (
                <ActivityIndicator size="small" color={theme.onPrimary} />
              ) : (
                <Ionicons name="camera" size={16} color={theme.onPrimary} />
              )}
            </View>
          </Touchable>
          <Text variant="bodySmall" color="secondary" style={{ marginTop: spacing.sm, textAlign: "center" }}>
            Profil fotoğrafın veya teknik servisinin logosunu ekle — tekne sahipleri usta listesinde bunu görecek.
          </Text>
        </View>

        <Card style={{ marginTop: spacing.lg }}>
          <Text variant="body" weight="bold">
            {craftsman.businessName ?? "İşletme adı belirtilmemiş"}
          </Text>
          <Text variant="bodySmall" color="secondary" style={{ marginTop: 4 }}>
            {SPECIALTY_LABELS[craftsman.specialty]} · {craftsman.city}
            {craftsman.marina ? ` · ${craftsman.marina}` : ""}
          </Text>
        </Card>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  avatarSection: { alignItems: "center", marginTop: spacing.md },
  avatarTouchable: { position: "relative" },
  editBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});

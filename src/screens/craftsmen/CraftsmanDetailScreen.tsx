import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as craftsmenApi from "@/api/craftsmen";
import * as conversationsApi from "@/api/conversations";
import { useTheme } from "@/theme/ThemeContext";
import { spacing } from "@/theme/tokens";
import { Text, Card, Avatar, Rating, Badge, Button, Header, ScreenContainer, useToast } from "@/components/ui";
import type { AppStackParamList } from "@/navigation/RootNavigator";
import type { Craftsman } from "@/types/mico";
import { SPECIALTY_LABELS } from "@/types/mico";
import { ApiError } from "@/api/client";

type Props = NativeStackScreenProps<AppStackParamList, "CraftsmanDetail">;

export function CraftsmanDetailScreen({ route, navigation }: Props) {
  const { craftsmanId } = route.params;
  const { theme } = useTheme();
  const { show } = useToast();
  const [craftsman, setCraftsman] = useState<Craftsman | null>(null);
  const [isMessaging, setIsMessaging] = useState(false);

  useEffect(() => {
    craftsmenApi.getCraftsman(craftsmanId).then(setCraftsman);
  }, [craftsmanId]);

  async function handleMessage() {
    if (!craftsman) return;
    setIsMessaging(true);
    try {
      const conversation = await conversationsApi.getOrCreateConversation(craftsman.userId);
      navigation.navigate("Chat", { conversationId: conversation.id, otherUserName: craftsman.businessName ?? "Usta" });
    } catch (e) {
      show(e instanceof ApiError ? e.message : "Sohbet başlatılamadı.", "error");
    } finally {
      setIsMessaging(false);
    }
  }

  return (
    <ScreenContainer>
      <Header title="Usta Profili" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
        {craftsman ? (
          <>
            <Card style={{ alignItems: "center" }}>
              <Avatar name={craftsman.businessName ?? "Usta"} uri={craftsman.avatar} size={72} />
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: spacing.sm }}>
                <Text variant="h1" weight="bold">
                  {craftsman.businessName ?? SPECIALTY_LABELS[craftsman.specialty]}
                </Text>
                {craftsman.isVerified ? (
                  <Ionicons name="checkmark-circle" size={18} color={theme.success} style={{ marginLeft: 6 }} />
                ) : null}
              </View>
              <View style={{ marginTop: 4 }}>
                <Rating value={craftsman.ratingAvg} count={craftsman.ratingCount} />
              </View>
              <View style={{ flexDirection: "row", gap: spacing.xs, marginTop: spacing.sm }}>
                <Badge label={SPECIALTY_LABELS[craftsman.specialty]} tone="accent" />
                {craftsman.isVerified ? <Badge label="Mavi Rota Onaylı" tone="success" /> : null}
              </View>
            </Card>

            <Card style={{ marginTop: spacing.md }}>
              <InfoRow icon="location-outline" text={[craftsman.city, craftsman.marina].filter(Boolean).join(" · ")} />
              {craftsman.experienceYears ? (
                <InfoRow icon="ribbon-outline" text={`${craftsman.experienceYears} yıl tecrübe`} />
              ) : null}
              {craftsman.bio ? <InfoRow icon="chatbubble-ellipses-outline" text={craftsman.bio} /> : null}
            </Card>

            <Button
              label="Mesaj Gönder"
              icon="chatbubble-outline"
              onPress={handleMessage}
              loading={isMessaging}
              style={{ marginTop: spacing.lg }}
            />
          </>
        ) : (
          <Text variant="body" color="secondary">
            Yükleniyor...
          </Text>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function InfoRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const { theme } = useTheme();
  if (!text) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.xs }}>
      <Ionicons name={icon} size={16} color={theme.textSecondary} />
      <Text variant="bodySmall" color="secondary" style={{ marginLeft: spacing.xs, flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}

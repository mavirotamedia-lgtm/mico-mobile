import { useEffect, useState } from "react";
import { View, StyleSheet, Alert, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as blocksApi from "@/api/blocks";
import * as reportsApi from "@/api/reports";
import { useTheme } from "@/theme/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { REPORT_REASON_LABELS, type ReportReason } from "@/types/mico";
import { ApiError } from "@/api/client";

const REPORT_REASONS = Object.entries(REPORT_REASON_LABELS) as [ReportReason, string][];

type Props = {
  visible: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUserName: string;
  /** Şikayetin bağlamı — admin panelinde nereden geldiğini görebilmek için (ör. "CONVERSATION"/"CRAFTSMAN_PROFILE"). */
  contextType?: string;
  contextId?: string;
  /** Engelleme başarılı olduğunda çağrılır — çağıran ekran genelde geri gitmek ister. */
  onBlocked?: () => void;
};

/** Sohbet ve usta profili ekranlarındaki "..." menüsünün açtığı Engelle/Şikayet Et bottom-sheet'i. */
export function UserActionsSheet({ visible, onClose, targetUserId, targetUserName, contextType, contextId, onBlocked }: Props) {
  const { theme } = useTheme();
  const { show } = useToast();
  const [step, setStep] = useState<"menu" | "report">("menu");
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setStep("menu");
      setReason(null);
      setDetails("");
    }
  }, [visible]);

  function handleBlockPress() {
    onClose();
    Alert.alert(
      "Kullanıcıyı Engelle",
      `${targetUserName} adlı kullanıcıyı engellemek istediğine emin misin? Artık mesajlaşamaz ve teklif/talep alışverişi yapamazsınız.`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Engelle",
          style: "destructive",
          onPress: async () => {
            try {
              await blocksApi.blockUser(targetUserId);
              show("Kullanıcı engellendi.", "success");
              onBlocked?.();
            } catch (e) {
              show(e instanceof ApiError ? e.message : "Kullanıcı engellenemedi.", "error");
            }
          },
        },
      ]
    );
  }

  async function handleSubmitReport() {
    if (!reason) return;
    setIsSubmitting(true);
    try {
      await reportsApi.createReport({
        reportedUserId: targetUserId,
        reason,
        details: details.trim() || undefined,
        contextType,
        contextId,
      });
      show("Şikayetin alındı, incelenecek.", "success");
      onClose();
    } catch (e) {
      show(e instanceof ApiError ? e.message : "Şikayet gönderilemedi.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} onClose={onClose} title={step === "menu" ? targetUserName : "Şikayet Et"}>
      {step === "menu" ? (
        <View style={{ paddingBottom: spacing.sm }}>
          <Pressable onPress={handleBlockPress} style={styles.menuRow}>
            <Ionicons name="ban-outline" size={20} color={theme.danger} />
            <Text variant="body" weight="semibold" color="danger" style={{ marginLeft: spacing.sm }}>
              Kullanıcıyı Engelle
            </Text>
          </Pressable>
          <Pressable onPress={() => setStep("report")} style={styles.menuRow}>
            <Ionicons name="flag-outline" size={20} color={theme.textPrimary} />
            <Text variant="body" weight="semibold" style={{ marginLeft: spacing.sm }}>
              Şikayet Et / Bildir
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ paddingBottom: spacing.md }}>
          <Text variant="bodySmall" weight="semibold" color="secondary" style={{ marginBottom: spacing.sm }}>
            Neden şikayet ediyorsun?
          </Text>
          <View style={styles.reasonGrid}>
            {REPORT_REASONS.map(([value, label]) => {
              const active = reason === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => setReason(value)}
                  style={[
                    styles.reasonChip,
                    { borderColor: active ? theme.primary : theme.border, backgroundColor: active ? theme.primary : theme.surface },
                  ]}
                >
                  <Text variant="bodySmall" weight="semibold" style={{ color: active ? theme.onPrimary : theme.textSecondary }}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Input
            label="Detay (opsiyonel)"
            placeholder="Kısaca ne olduğunu anlat..."
            value={details}
            onChangeText={setDetails}
            multiline
            numberOfLines={3}
            style={{ minHeight: 70, textAlignVertical: "top" }}
          />

          <Button
            label="Şikayeti Gönder"
            onPress={handleSubmitReport}
            loading={isSubmitting}
            disabled={!reason}
            style={{ marginTop: spacing.xs }}
          />
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  menuRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.md },
  reasonGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.md },
  reasonChip: { borderWidth: 1.5, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14 },
});

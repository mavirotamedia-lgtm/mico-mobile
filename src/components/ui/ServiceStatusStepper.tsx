import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeContext";
import { spacing } from "@/theme/tokens";
import { Text } from "@/components/ui/Text";
import type { ServiceRequestStatus } from "@/types/mico";

const STEP_LABELS = ["Talep Açıldı", "Teklif Kabul Edildi", "Servis Sürüyor", "Tamamlandı"];

/**
 * ServiceRequestStatus'ta "Teklif Kabul Edildi" ile "Servis Sürüyor" arasını
 * ayıran ayrı bir durum yok (ikisi de ASSIGNED) — bu yüzden ASSIGNED,
 * gorsel olarak 2. adimi tamamlanmis, 3. adimi "surmekte" gosterecek
 * sekilde yorumlaniyor.
 */
function getStepState(status: ServiceRequestStatus): { completedSteps: number; currentStep: number | null } {
  switch (status) {
    case "OPEN":
    case "OFFER_RECEIVED":
      return { completedSteps: 1, currentStep: 2 };
    case "ASSIGNED":
      return { completedSteps: 2, currentStep: 3 };
    case "COMPLETED":
      return { completedSteps: 4, currentStep: null };
    case "CANCELLED":
      return { completedSteps: 0, currentStep: null };
  }
}

export function ServiceStatusStepper({ status }: { status: ServiceRequestStatus }) {
  const { theme } = useTheme();

  if (status === "CANCELLED") {
    return (
      <View style={[styles.cancelledRow, { backgroundColor: theme.dangerBg, borderColor: theme.danger }]}>
        <Ionicons name="close-circle-outline" size={18} color={theme.danger} />
        <Text variant="bodySmall" weight="semibold" color="danger" style={{ marginLeft: spacing.xs }}>
          Bu talep iptal edildi
        </Text>
      </View>
    );
  }

  const { completedSteps, currentStep } = getStepState(status);

  return (
    <View style={styles.row}>
      {STEP_LABELS.map((label, i) => {
        const stepNumber = i + 1;
        const isDone = stepNumber <= completedSteps;
        const isCurrent = stepNumber === currentStep;
        const isLast = stepNumber === STEP_LABELS.length;
        const circleColor = isDone || isCurrent ? theme.primary : theme.surface;
        const circleBorder = isDone || isCurrent ? theme.primary : theme.border;
        const lineColor = stepNumber < completedSteps ? theme.primary : theme.border;

        return (
          <View key={label} style={styles.stepWrap}>
            <View style={styles.circleLineRow}>
              <View style={[styles.circle, { backgroundColor: circleColor, borderColor: circleBorder }]}>
                {isDone ? (
                  <Ionicons name="checkmark" size={13} color={theme.onPrimary} />
                ) : isCurrent ? (
                  <View style={[styles.currentDot, { backgroundColor: theme.onPrimary }]} />
                ) : null}
              </View>
              {!isLast ? <View style={[styles.line, { backgroundColor: lineColor }]} /> : null}
            </View>
            <Text
              variant="caption"
              weight={isDone || isCurrent ? "semibold" : "regular"}
              style={{ color: isDone || isCurrent ? theme.textPrimary : theme.textSecondary, marginTop: 4 }}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start" },
  stepWrap: { flex: 1, alignItems: "center" },
  circleLineRow: { flexDirection: "row", alignItems: "center", width: "100%" },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
    marginRight: "auto",
  },
  currentDot: { width: 8, height: 8, borderRadius: 4 },
  line: { flex: 1, height: 2, marginHorizontal: -2 },
  cancelledRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: spacing.sm,
  },
});

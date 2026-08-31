import { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
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
        const lineFilled = stepNumber < completedSteps;

        return (
          <View key={label} style={styles.stepWrap}>
            <View style={styles.circleLineRow}>
              <StepCircle isDone={isDone} isCurrent={isCurrent} theme={theme} />
              {!isLast ? (
                <View style={[styles.lineTrack, { backgroundColor: theme.border }]}>
                  <Animated.View
                    style={[styles.lineFill, { backgroundColor: theme.success, width: lineFilled ? "100%" : "0%" }]}
                  />
                </View>
              ) : null}
            </View>
            <Text
              variant="caption"
              weight={isDone || isCurrent ? "bold" : "regular"}
              style={{ color: isDone ? theme.success : isCurrent ? theme.textPrimary : theme.textSecondary, marginTop: 6 }}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function StepCircle({
  isDone,
  isCurrent,
  theme,
}: {
  isDone: boolean;
  isCurrent: boolean;
  theme: ReturnType<typeof useTheme>["theme"];
}) {
  // Tamamlanan adimda yesil tik hafifce "pop" ile beliriyor — duz bir renk
  // degisiminden cok daha premium hissettiriyor.
  const checkScale = useRef(new Animated.Value(isDone ? 1 : 0)).current;
  // Aktif adimda nabiz gibi genisleyip solan bir hale (glow) — WhatsApp'taki
  // yaziyor gostergesiyle ayni ruhta, "bu adim su an surmekte" hissi veriyor.
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isDone) {
      checkScale.setValue(0);
      Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 10 }).start();
    } else {
      checkScale.setValue(0);
    }
  }, [isDone, checkScale]);

  useEffect(() => {
    if (!isCurrent) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isCurrent, pulse]);

  const circleColor = isDone ? theme.success : isCurrent ? theme.primary : theme.surface;
  const circleBorder = isDone ? theme.success : isCurrent ? theme.primary : theme.border;

  return (
    <View style={styles.circleHolder}>
      {isCurrent ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pulseRing,
            {
              borderColor: theme.primary,
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
            },
          ]}
        />
      ) : null}
      <View
        style={[
          styles.circle,
          {
            backgroundColor: circleColor,
            borderColor: circleBorder,
            shadowColor: isDone ? theme.success : theme.primary,
            shadowOpacity: isDone || isCurrent ? 0.3 : 0,
          },
        ]}
      >
        {isDone ? (
          <Animated.View style={{ transform: [{ scale: checkScale }] }}>
            <Ionicons name="checkmark" size={15} color={theme.onPrimary} />
          </Animated.View>
        ) : isCurrent ? (
          <View style={[styles.currentDot, { backgroundColor: theme.onPrimary }]} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start" },
  stepWrap: { flex: 1, alignItems: "center" },
  circleLineRow: { flexDirection: "row", alignItems: "center", width: "100%" },
  circleHolder: { alignItems: "center", justifyContent: "center", marginLeft: "auto", marginRight: "auto" },
  pulseRing: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  currentDot: { width: 8, height: 8, borderRadius: 4 },
  lineTrack: { flex: 1, height: 3, borderRadius: 2, marginHorizontal: -2, overflow: "hidden" },
  lineFill: { height: "100%", borderRadius: 2 },
  cancelledRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: spacing.sm,
  },
});

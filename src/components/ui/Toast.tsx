import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import { Text } from "@/components/ui/Text";

type ToastTone = "success" | "error" | "info";
type ToastState = { id: number; message: string; tone: ToastTone };

type ToastContextValue = { show: (message: string, tone?: ToastTone) => void };
const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastTone, keyof typeof Ionicons.glyphMap> = {
  success: "checkmark-circle",
  error: "alert-circle",
  info: "information-circle",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (message: string, tone: ToastTone = "info") => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setToast({ id: Date.now(), message, tone });
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();

      timeoutRef.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setToast(null));
      }, 2600);
    },
    [opacity]
  );

  const toneColor = toast ? { success: theme.success, error: theme.danger, info: theme.primary }[toast.tone] : theme.primary;

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.wrapper, { top: insets.top + spacing.sm, opacity }]}
        >
          <View style={[styles.toast, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadowColor }]}>
            <Ionicons name={ICONS[toast.tone]} size={18} color={toneColor} />
            <Text variant="bodySmall" weight="semibold" style={{ marginLeft: spacing.xs, flex: 1 }}>
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast, ToastProvider içinde kullanılmalı.");
  return ctx;
}

const styles = StyleSheet.create({
  wrapper: { position: "absolute", left: spacing.md, right: spacing.md, zIndex: 999 },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
});

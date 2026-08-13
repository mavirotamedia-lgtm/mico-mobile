import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

/**
 * Haptics web'de desteklenmiyor (no-op), gercek cihazda ise premium-app
 * hissi icin kucuk dokunuslarda kullaniliyor. Hatalari asla firlatmiyor —
 * bir titresim basarisiz olursa akisin geri kalanini bozmamali.
 */
export const haptics = {
  tap: () => {
    if (Platform.OS === "web") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  success: () => {
    if (Platform.OS === "web") return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  error: () => {
    if (Platform.OS === "web") return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  },
};

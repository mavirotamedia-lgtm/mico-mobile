import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import * as notificationsApi from "@/api/notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * İzin ister, Expo push token'ı alır ve backend'e kaydeder — girişten sonra
 * bir kere çağrılması yeterli (AuthContext bunu user set olduğunda tetikler).
 * EAS projesi henüz bağlanmadıysa (app.json'da extra.eas.projectId yok)
 * getExpoPushTokenAsync burada sessizce başarısız olur; push bildirimleri o
 * zamana kadar pasif kalır, uygulamanın geri kalanı hiç etkilenmez.
 */
export async function registerForPushNotificationsAsync() {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenResponse = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);

    await notificationsApi.registerPushToken(tokenResponse.data, Platform.OS === "ios" ? "IOS" : "ANDROID");
  } catch (error) {
    console.warn("Push bildirim kaydı başarısız:", error);
  }
}

/**
 * Çıkış yaparken çağrılır — aksi halde cihaz, oturum kapatıldıktan sonra da
 * o hesabın push bildirimlerini almaya devam ederdi (token backend'de
 * kayıtlı kalır). Hâlâ geçerli bir oturumken (token'lar temizlenmeden ÖNCE)
 * çağrılmalı, aksi halde silme isteği kimlik doğrulayamaz.
 */
export async function unregisterPushNotificationsAsync() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenResponse = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    await notificationsApi.removePushToken(tokenResponse.data);
  } catch (error) {
    console.warn("Push token silme başarısız:", error);
  }
}

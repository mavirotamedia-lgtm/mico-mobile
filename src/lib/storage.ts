import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * expo-secure-store native (iOS/Android) dışında bir web implementasyonuna
 * sahip değil — web'de çağrıldığında throw ediyor. Bu sarmalayıcı, web'de
 * (sadece tarayıcı önizlemesi/geliştirme için) localStorage'a düşer; gerçek
 * cihazlarda hâlâ SecureStore'un güvenli, şifreli depolamasını kullanır.
 */
export async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return window.localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    window.localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    window.localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

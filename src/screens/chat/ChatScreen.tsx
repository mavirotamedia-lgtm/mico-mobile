import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Image,
  Modal,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as conversationsApi from "@/api/conversations";
import { uploadImage } from "@/api/uploads";
import { useAuth } from "@/store/AuthContext";
import { useTheme } from "@/theme/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import { Text, Avatar, Header, ScreenContainer, Touchable, useToast } from "@/components/ui";
import type { AppStackParamList } from "@/navigation/RootNavigator";
import type { Message } from "@/types/mico";
import { ApiError } from "@/api/client";

type Props = NativeStackScreenProps<AppStackParamList, "Chat">;

const POLL_INTERVAL_MS = 4000;
const TYPING_POLL_INTERVAL_MS = 2000;
// Karsi tarafin "yaziyor" isareti sunucuda 5sn'de sona eriyor (bkz. backend
// messaging/service.ts TYPING_TTL_MS) — biz de yazarken bu sureden once
// tazeleyerek gostergenin surekli acik kalmasini sagliyoruz.
const TYPING_SIGNAL_THROTTLE_MS = 2500;

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

/** WhatsApp'taki gibi zipliyan uc noktali "yaziyor" gostergesi. */
function TypingDots({ color }: { color: string }) {
  const dots = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

  useEffect(() => {
    const loops = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay((2 - i) * 150),
        ])
      )
    );
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [dots]);

  return (
    <View style={{ flexDirection: "row" }}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            styles.typingDot,
            {
              backgroundColor: color,
              marginLeft: i === 0 ? 0 : 3,
              transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }],
            },
          ]}
        />
      ))}
    </View>
  );
}

export function ChatScreen({ route, navigation }: Props) {
  const { conversationId, otherUserName } = route.params;
  const { user } = useAuth();
  const { theme } = useTheme();
  const { show } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const listRef = useRef<FlatList<Message>>(null);
  const lastMessageCount = useRef(0);
  const lastTypingSentAt = useRef(0);

  const load = useCallback(async () => {
    try {
      const res = await conversationsApi.listMessages(conversationId);
      // API en yeniyi önce döner (DESC) — sohbet ekranında eskiden yeniye gösterilir.
      setMessages([...res.items].reverse());
    } catch {
      // Polling sirasinda gecici bir ag hatasi kullaniciyi rahatsiz etmesin —
      // bir sonraki interval'de sessizce tekrar denenir.
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  // Ekran her odaklandiginda ve her poll'de karsi tarafin mesajlarini okundu
  // isaretler — WhatsApp'taki gibi mavi tik icin bu cagrinin gitmesi sart.
  const markRead = useCallback(() => {
    conversationsApi.markConversationAsRead(conversationId).catch(() => {
      // sessizce yut — okundu isareti kritik degil, bir sonraki poll'de tekrar denenir
    });
  }, [conversationId]);

  const pollTyping = useCallback(() => {
    conversationsApi
      .getTypingStatus(conversationId)
      .then((res) => setIsOtherTyping(res.isTyping))
      .catch(() => {
        // sessizce yut — bir sonraki poll'de tekrar denenir
      });
  }, [conversationId]);

  useFocusEffect(
    useCallback(() => {
      load();
      markRead();
      pollRef.current = setInterval(() => {
        load();
        markRead();
      }, POLL_INTERVAL_MS);
      typingPollRef.current = setInterval(pollTyping, TYPING_POLL_INTERVAL_MS);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
        if (typingPollRef.current) clearInterval(typingPollRef.current);
        setIsOtherTyping(false);
      };
    }, [load, markRead, pollTyping])
  );

  // Yeni mesaj geldiginde (kendi gonderdigimiz ya da karsi tarafinki, polling
  // ile) sohbeti otomatik en alta kaydir — sohbet ekranlarinda beklenen
  // davranis, oncesinde eksikti.
  useEffect(() => {
    if (messages.length > lastMessageCount.current) {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
    lastMessageCount.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (isOtherTyping) {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }, [isOtherTyping]);

  function handleDraftChange(text: string) {
    setDraft(text);
    const now = Date.now();
    if (text.trim() && now - lastTypingSentAt.current > TYPING_SIGNAL_THROTTLE_MS) {
      lastTypingSentAt.current = now;
      conversationsApi.sendTypingSignal(conversationId).catch(() => {
        // sessizce yut — yaziyor gostergesi kritik degil
      });
    }
  }

  async function handleSend() {
    const body = draft.trim();
    if (!body) return;
    setIsSending(true);
    try {
      await conversationsApi.sendMessage(conversationId, { body });
      setDraft("");
      load();
    } catch (e) {
      // Yazilan metni SILME — gonderim basarisiz oldu, kullanici tekrar
      // deneyebilsin diye taslak korunuyor.
      show(e instanceof ApiError ? e.message : "Mesaj gönderilemedi.", "error");
    } finally {
      setIsSending(false);
    }
  }

  async function handlePickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      show("Görsel seçmek için galeri izni gerekiyor.", "error");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;

    setIsUploadingImage(true);
    try {
      const url = await uploadImage(result.assets[0].uri, result.assets[0].mimeType);
      await conversationsApi.sendMessage(conversationId, { imageUrl: url });
      load();
    } catch (e) {
      show(e instanceof ApiError ? e.message : "Görsel gönderilemedi.", "error");
    } finally {
      setIsUploadingImage(false);
    }
  }

  return (
    <ScreenContainer>
      <Header title={otherUserName} onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={80}>
        {isLoading ? (
          <View style={styles.centerFill}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: spacing.lg, flexGrow: 1 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.centerFill}>
                <Text variant="body" color="secondary">
                  Henüz mesaj yok — ilk mesajı sen gönder.
                </Text>
              </View>
            }
            ListFooterComponent={
              isOtherTyping ? (
                <View style={[styles.bubbleRow, styles.bubbleRowTheirs]}>
                  <Avatar name={otherUserName} size={28} />
                  <View
                    style={[
                      styles.bubble,
                      styles.bubbleTailTheirs,
                      styles.typingBubble,
                      { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadowColor },
                    ]}
                  >
                    <TypingDots color={theme.textSecondary} />
                  </View>
                </View>
              ) : null
            }
            renderItem={({ item }) => {
            const isMine = item.senderId === user?.id;
            return (
              <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
                {!isMine ? <Avatar name={otherUserName} size={28} /> : null}
                <View
                  style={[
                    styles.bubble,
                    isMine ? styles.bubbleTailMine : styles.bubbleTailTheirs,
                    {
                      backgroundColor: isMine ? theme.primary : theme.surface,
                      borderColor: theme.border,
                      shadowColor: theme.shadowColor,
                      marginLeft: isMine ? 0 : spacing.xs,
                    },
                  ]}
                >
                  {item.imageUrl ? (
                    <Touchable onPress={() => setFullscreenImage(item.imageUrl)}>
                      <Image source={{ uri: item.imageUrl }} style={styles.chatImage} resizeMode="cover" />
                    </Touchable>
                  ) : null}
                  {item.body ? (
                    <Text
                      variant="body"
                      style={{ color: isMine ? theme.onPrimary : theme.textPrimary, marginTop: item.imageUrl ? spacing.xs : 0 }}
                    >
                      {item.body}
                    </Text>
                  ) : null}
                  <View style={styles.metaRow}>
                    <Text
                      variant="caption"
                      style={{ color: isMine ? theme.textOnDarkMuted : theme.textSecondary }}
                    >
                      {formatTime(item.createdAt)}
                    </Text>
                    {isMine ? (
                      <Ionicons
                        name={item.readAt ? "checkmark-done" : "checkmark"}
                        size={14}
                        color={item.readAt ? "#53BDEB" : theme.textOnDarkMuted}
                        style={{ marginLeft: 4 }}
                      />
                    ) : null}
                  </View>
                </View>
              </View>
            );
            }}
          />
        )}

        <View style={[styles.inputBar, { borderTopColor: theme.border, backgroundColor: theme.surface }]}>
          <Touchable
            onPress={handlePickImage}
            disabled={isUploadingImage}
            haptic
            style={[styles.attachButton, { opacity: isUploadingImage ? 0.5 : 1 }]}
          >
            {isUploadingImage ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Ionicons name="image-outline" size={22} color={theme.primary} />
            )}
          </Touchable>
          <View style={[styles.textInputWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <TextInput
              value={draft}
              onChangeText={handleDraftChange}
              placeholder="Mesajınızı yazın..."
              placeholderTextColor={theme.textSecondary}
              style={{ color: theme.textPrimary, fontSize: 14, paddingVertical: 4 }}
              multiline
              onSubmitEditing={handleSend}
            />
          </View>
          <Touchable
            onPress={handleSend}
            disabled={!draft.trim() || isSending}
            haptic
            style={[styles.sendButton, { backgroundColor: theme.primary, opacity: !draft.trim() || isSending ? 0.5 : 1 }]}
          >
            <Ionicons name="send" size={18} color={theme.onPrimary} />
          </Touchable>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={!!fullscreenImage} transparent animationType="fade" onRequestClose={() => setFullscreenImage(null)}>
        <Touchable
          style={styles.lightboxBackdrop}
          onPress={() => setFullscreenImage(null)}
        >
          {fullscreenImage ? (
            <Image source={{ uri: fullscreenImage }} style={styles.lightboxImage} resizeMode="contain" />
          ) : null}
        </Touchable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centerFill: { flex: 1, alignItems: "center", justifyContent: "center" },
  bubbleRow: { flexDirection: "row", marginBottom: spacing.sm, maxWidth: "80%" },
  bubbleRowMine: { alignSelf: "flex-end" },
  bubbleRowTheirs: { alignSelf: "flex-start" },
  bubble: {
    flexShrink: 1,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  bubbleTailMine: { borderBottomRightRadius: 4 },
  bubbleTailTheirs: { borderBottomLeftRadius: 4 },
  typingBubble: { marginLeft: spacing.xs, paddingVertical: spacing.sm + 2 },
  typingDot: { width: 6, height: 6, borderRadius: 3 },
  metaRow: { flexDirection: "row", alignItems: "center", alignSelf: "flex-end", marginTop: 4 },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  textInputWrapper: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    marginRight: spacing.sm,
  },
  sendButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  attachButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginRight: 2 },
  chatImage: { width: 200, height: 200, borderRadius: radius.md },
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  lightboxImage: { width: "100%", height: "80%" },
});

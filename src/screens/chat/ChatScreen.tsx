import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, View, StyleSheet, KeyboardAvoidingView, Platform, TextInput } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as conversationsApi from "@/api/conversations";
import { useAuth } from "@/store/AuthContext";
import { useTheme } from "@/theme/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import { Text, Avatar, Header, ScreenContainer, Touchable, useToast } from "@/components/ui";
import type { AppStackParamList } from "@/navigation/RootNavigator";
import type { Message } from "@/types/mico";
import { ApiError } from "@/api/client";

type Props = NativeStackScreenProps<AppStackParamList, "Chat">;

const POLL_INTERVAL_MS = 4000;

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const listRef = useRef<FlatList<Message>>(null);
  const lastMessageCount = useRef(0);

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

  useFocusEffect(
    useCallback(() => {
      load();
      pollRef.current = setInterval(load, POLL_INTERVAL_MS);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }, [load])
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

  async function handleSend() {
    const body = draft.trim();
    if (!body) return;
    setIsSending(true);
    try {
      await conversationsApi.sendMessage(conversationId, body);
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
                  <Text variant="body" style={{ color: isMine ? theme.onPrimary : theme.textPrimary }}>
                    {item.body}
                  </Text>
                  <Text
                    variant="caption"
                    style={{ color: isMine ? theme.textOnDarkMuted : theme.textSecondary, marginTop: 4, alignSelf: "flex-end" }}
                  >
                    {formatTime(item.createdAt)}
                  </Text>
                </View>
              </View>
            );
            }}
          />
        )}

        <View style={[styles.inputBar, { borderTopColor: theme.border, backgroundColor: theme.surface }]}>
          <View style={[styles.textInputWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
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
});

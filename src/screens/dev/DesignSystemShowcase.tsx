import { useState } from "react";
import { ScrollView, View, StyleSheet, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/theme/ThemeContext";
import { spacing, radius } from "@/theme/tokens";
import {
  Text,
  Button,
  Card,
  Badge,
  Rating,
  Avatar,
  Input,
  Header,
  BottomNav,
  Modal,
  useToast,
  ScreenContainer,
} from "@/components/ui";

const BOAT_IMAGE = "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&q=60";

/**
 * MİÇO Design System — showcase / storybook ekranı.
 * Kalıcı bir uygulama ekranı değil; her bileşenin tek bir yerde görünüp
 * onaylanabilmesi için geçici bir vitrin. Onay sonrası kaldırılabilir ya da
 * geliştirici aracı olarak bırakılabilir.
 */
export function DesignSystemShowcase() {
  const { theme, toggle } = useTheme();
  const { show } = useToast();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <LinearGradient colors={theme.heroGradient} style={styles.hero}>
          <Header title="Design System" transparent rightIcon="contrast-outline" onRightPress={toggle} />
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl }}>
            <Text variant="display" color="onDark" weight="extrabold">
              MİÇO
            </Text>
            <Text variant="body" color="onDarkMuted" style={{ marginTop: 4 }}>
              Denizde yalnız değilsin. — {theme.mode === "dark" ? "Koyu" : "Açık"} tema
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <SectionTitle>Renkler</SectionTitle>
          <View style={styles.swatchRow}>
            <Swatch color={theme.primary} label="Primary" />
            <Swatch color={theme.accent} label="Accent" />
            <Swatch color={theme.success} label="Success" />
            <Swatch color={theme.warning} label="Warning" />
            <Swatch color={theme.danger} label="Danger" />
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle>Tipografi</SectionTitle>
          <Card>
            <Text variant="display">Display 30</Text>
            <Text variant="h1" style={{ marginTop: 6 }}>
              Başlık H1 22
            </Text>
            <Text variant="h2" style={{ marginTop: 6 }}>
              Başlık H2 18
            </Text>
            <Text variant="body" style={{ marginTop: 6 }}>
              Gövde metni 15 — Manrope ile MİÇO'nun premium, okunaklı sesi.
            </Text>
            <Text variant="caption" color="secondary" style={{ marginTop: 6 }}>
              Caption / ikincil metin 12
            </Text>
          </Card>
        </View>

        <View style={styles.section}>
          <SectionTitle>Butonlar</SectionTitle>
          <Card style={{ gap: spacing.sm }}>
            <Button label="Giriş Yap" onPress={() => show("Giriş yapıldı", "success")} />
            <Button label="Kayıt Ol" variant="secondary" onPress={() => show("Kayıt ekranına git", "info")} />
            <Button label="Ghost Aksiyon" variant="ghost" onPress={() => {}} />
            <Button label="Sil" variant="danger" icon="trash-outline" onPress={() => show("Silindi", "error")} />
            <Button label="Yükleniyor" loading onPress={() => {}} />
          </Card>
        </View>

        <View style={styles.section}>
          <SectionTitle>Rozetler & Puan</SectionTitle>
          <Card style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
            <Badge label="Müsait" tone="success" />
            <Badge label="İşte" tone="warning" />
            <Badge label="İptal" tone="danger" />
            <Badge label="Premium Üye" tone="accent" />
            <Rating value={4.9} count={125} />
          </Card>
        </View>

        <View style={styles.section}>
          <SectionTitle>Kartlar</SectionTitle>
          <Card onPress={() => show("Karta tıklandı")} style={{ padding: 0, overflow: "hidden" }}>
            <Image source={{ uri: BOAT_IMAGE }} style={{ width: "100%", height: 140 }} />
            <View style={{ padding: spacing.md }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text variant="h2" weight="bold">
                  Sea Ray 320
                </Text>
                <Rating value={4.9} count={125} />
              </View>
              <Text variant="bodySmall" color="secondary" style={{ marginTop: 2 }}>
                Bodrum Marina
              </Text>
              <View style={{ flexDirection: "row", marginTop: spacing.sm, gap: spacing.xs }}>
                <Badge label="Müsait" tone="success" />
              </View>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <SectionTitle>Ustalar</SectionTitle>
          <Card style={{ flexDirection: "row", alignItems: "center" }}>
            <Avatar name="Ahmet Marine Servis" size={48} />
            <View style={{ marginLeft: spacing.sm, flex: 1 }}>
              <Text variant="body" weight="semibold">
                Ahmet Marine Servis
              </Text>
              <Rating value={4.9} count={125} />
            </View>
            <Badge label="Müsait" tone="success" />
          </Card>
        </View>

        <View style={styles.section}>
          <SectionTitle>Girdiler</SectionTitle>
          <Card>
            <Input label="E-posta" icon="mail-outline" placeholder="ornek@mail.com" />
            <Input label="Şifre" icon="lock-closed-outline" placeholder="••••••••" isPassword />
          </Card>
        </View>

        <View style={styles.section}>
          <SectionTitle>Modal / Toast</SectionTitle>
          <Card style={{ gap: spacing.sm }}>
            <Button label="Modal Aç" variant="secondary" icon="layers-outline" onPress={() => setModalOpen(true)} />
            <Button
              label="Toast Göster"
              variant="secondary"
              icon="notifications-outline"
              onPress={() => show("Servis talebiniz oluşturuldu.", "success")}
            />
          </Card>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <BottomNav
        activeKey="home"
        items={[
          { key: "home", label: "Ana Sayfa", icon: "home-outline", iconActive: "home" },
          { key: "boat", label: "Teknem", icon: "boat-outline", iconActive: "boat" },
          { key: "offers", label: "Teklifler", icon: "pricetag-outline", iconActive: "pricetag" },
          { key: "profile", label: "Profil", icon: "person-outline", iconActive: "person" },
        ]}
        onPress={(key) => show(`Sekme: ${key}`)}
        onCenterPress={() => show("Servis Talebi Oluştur'a git", "info")}
      />

      <Modal visible={modalOpen} onClose={() => setModalOpen(false)} title="Örnek Modal">
        <Text variant="body" color="secondary">
          Bu, alt sayfadan yükselen (bottom-sheet) modal bileşeninin bir örneğidir.
        </Text>
        <Button label="Kapat" style={{ marginTop: spacing.md }} onPress={() => setModalOpen(false)} />
      </Modal>
    </ScreenContainer>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text variant="h2" weight="bold" style={{ marginBottom: spacing.sm }}>
      {children}
    </Text>
  );
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text variant="caption" color="secondary" style={{ marginTop: 4 }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingBottom: spacing.sm },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  swatchRow: { flexDirection: "row", gap: spacing.md },
  swatch: { width: 48, height: 48, borderRadius: radius.md },
});

/**
 * Kayıt ekranındaki onay kutusunun açtığı taslak hukuki metinler. Gerçek bir
 * hukuk danışmanlığı incelemesinin yerini tutmaz — MİÇO büyüdükçe (özellikle
 * ödeme/teklif hakkı sistemi genişledikçe) bir avukatla gözden geçirilmesi
 * gerekir. Web sitesindeki /kvkk ve /kullanim-kosullari sayfaları genel
 * site kullanımını kapsıyor; buradaki metinler MİÇO'ya özgü (usta-tekne
 * sahibi ilişkisi, teklif hakkı, servis talepleri) noktaları ekliyor.
 */

export type LegalSection = { heading: string; body: string };
export type LegalDocument = { title: string; updatedAt: string; sections: LegalSection[] };

export const USER_AGREEMENT: LegalDocument = {
  title: "Kullanıcı Sözleşmesi",
  updatedAt: "31 Ağustos 2026",
  sections: [
    {
      heading: "1. Taraflar ve Kapsam",
      body: "Bu sözleşme, Mavi Rota Marine tarafından işletilen MİÇO uygulamasını kullanan tekne sahipleri ve ustalar (\"Kullanıcı\") ile Mavi Rota Marine arasındaki ilişkiyi düzenler. Uygulamayı kullanarak bu şartları kabul etmiş sayılırsınız.",
    },
    {
      heading: "2. MİÇO'nun Niteliği (Aracı Platform)",
      body: "MİÇO, tekne sahipleri ile bağımsız ustaları bir araya getiren bir aracı platformdur. MİÇO; ustaların verdiği hizmetin tarafı, işvereni veya kefili değildir. Ustalar, MİÇO'nun çalışanı olmayıp bağımsız hizmet sağlayıcılardır.",
    },
    {
      heading: "3. Hizmet Kalitesi ve Anlaşmazlıklarda Sorumluluk",
      body: "Yapılan işin kalitesi, süresi, fiyatı ve olası arıza/hasar tartışmaları münhasıran tekne sahibi ile usta arasındadır. MİÇO, ustaların beyan ettiği bilgilerin (uzmanlık, deneyim vb.) doğruluğunu makul ölçüde denetlemeye çalışsa da bunu garanti etmez ve taraflar arasında çıkabilecek anlaşmazlıklarda hakem veya sorumlu taraf değildir. Kullanıcılar, bir işe başlamadan önce fiyat ve kapsamı karşılıklı netleştirmekle yükümlüdür.",
    },
    {
      heading: "4. Teklif Hakkı Sistemi",
      body: "Ustalar, servis taleplerine teklif verebilmek için \"Teklif Hakkı\" adlı bir bakiye kullanır. Bu bakiyenin kazanılma, harcanma ve (uygulanabilir durumlarda) iade koşulları uygulama içinde belirtildiği şekilde işler ve MİÇO tarafından önceden haber verilerek güncellenebilir.",
    },
    {
      heading: "5. Kullanıcı Yükümlülükleri",
      body: "Kullanıcılar; doğru ve güncel bilgi vermekle, hesap güvenliğini korumakla, diğer kullanıcılara karşı dürüst ve saygılı davranmakla, uygulamayı yasa dışı veya kötüye kullanım amacıyla kullanmamakla yükümlüdür.",
    },
    {
      heading: "6. Değerlendirme ve İçerik",
      body: "Kullanıcıların yazdığı yorum, puan ve mesajlar kendi görüşlerini yansıtır. Gerçeğe aykırı, hakaret içeren veya kötü niyetli içerikler MİÇO tarafından kaldırılabilir; ilgili hesap askıya alınabilir.",
    },
    {
      heading: "7. Hesabın Askıya Alınması / Sonlandırılması",
      body: "Bu sözleşmenin ihlali, dolandırıcılık şüphesi veya diğer kullanıcıları riske atan davranışlar durumunda MİÇO, ilgili hesabı uyarı vererek veya vermeksizin askıya alabilir ya da kapatabilir.",
    },
    {
      heading: "8. Değişiklikler",
      body: "Bu sözleşme zaman zaman güncellenebilir. Önemli değişiklikler uygulama içinden bildirilir; uygulamayı kullanmaya devam etmeniz güncel şartları kabul ettiğiniz anlamına gelir.",
    },
    {
      heading: "9. İletişim",
      body: "Sorularınız için Mavi Rota Marine'in web sitesindeki iletişim bilgilerinden bize ulaşabilirsiniz.",
    },
  ],
};

export const KVKK_NOTICE: LegalDocument = {
  title: "KVKK Aydınlatma Metni",
  updatedAt: "31 Ağustos 2026",
  sections: [
    {
      heading: "Veri Sorumlusu",
      body: "6698 sayılı Kişisel Verilerin Korunması Kanunu (\"KVKK\") uyarınca, MİÇO uygulamasını işleten Mavi Rota Marine, veri sorumlusu sıfatıyla kişisel verilerinizi aşağıda açıklanan kapsamda işler.",
    },
    {
      heading: "İşlenen Kişisel Veriler",
      body: "Hesap bilgileriniz (ad-soyad, e-posta, telefon), tekne ve bakım kayıtlarınız, oluşturduğunuz servis talepleri ve teklifler, ustalarla/tekne sahipleriyle yaptığınız yazışmalar, konum bilginiz (talep oluştururken paylaştığınız takdirde), profil fotoğrafınız, değerlendirme/yorumlarınız, Teklif Hakkı işlem geçmişiniz ve push bildirim gönderebilmek için cihaz kimliğiniz işlenir.",
    },
    {
      heading: "İşleme Amaçları",
      body: "Bu veriler; hesabınızın oluşturulması ve yönetilmesi, tekne sahibi-usta eşleştirmesinin sağlanması, servis taleplerinin ve tekliflerin işletilmesi, mesajlaşma ve bildirim hizmetlerinin sunulması, teknenizin bakım geçmişinin tutulması, hizmet kalitesinin (değerlendirme sistemi ile) izlenmesi ve yasal yükümlülüklerin yerine getirilmesi amacıyla işlenir.",
    },
    {
      heading: "Verilerin Aktarılması",
      body: "İletişim bilgileriniz, yalnızca bir servis talebi/teklifi kabul edildiğinde ilgili tekne sahibi ya da ustayla paylaşılır. Push bildirim gönderebilmek için cihaz bilginiz, bu hizmeti sağlayan altyapı sağlayıcısıyla (Expo) paylaşılır. Verileriniz, yasal zorunluluklar dışında üçüncü kişilerle paylaşılmaz.",
    },
    {
      heading: "Saklama Süresi",
      body: "Kişisel verileriniz, hesabınız aktif olduğu sürece ve ilgili mevzuatta öngörülen zamanaşımı süreleri boyunca saklanır; hesap silme talebinizde, yasal saklama yükümlülükleri dışındaki veriler silinir veya anonimleştirilir.",
    },
    {
      heading: "Haklarınız",
      body: "KVKK'nın 11. maddesi kapsamında; kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, işlenme amacını öğrenme, yurt içinde/yurt dışında aktarıldığı üçüncü kişileri bilme, eksik/yanlış işlenmişse düzeltilmesini isteme, silinmesini/yok edilmesini talep etme haklarına sahipsiniz.",
    },
    {
      heading: "İletişim",
      body: "Haklarınızı kullanmak için Mavi Rota Marine'in web sitesindeki iletişim bilgilerinden bize ulaşabilirsiniz.",
    },
  ],
};

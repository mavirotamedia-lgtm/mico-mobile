# Miço — Mavi Rota Mobil Uygulaması

Teknenin dijital tayfası. Bu proje, **mavirotamarine-site** backend'ine (`/api/v1`) bağlanan Expo/React
Native istemcisidir — ayrı bir backend veya veritabanı yoktur, tüm veri aynı Railway Postgres'te tutulur.

## Faz durumu

- **Faz 1 — "Miço tekneni tanır" (bu iskelet):** Giriş/kayıt, tekne ekleme, bakım defteri ve hatırlatma
  alanları. Mevcut `/api/v1/auth/*`, `/api/v1/boats/*`, `/api/v1/boats/[id]/maintenance` uçlarını kullanır.
- **Faz 2 — Usta & Servis Ağı:** Backend tarafı (`Craftsman`, `ServiceRequest`, `ServiceOffer`,
  `TokenTransaction`, `Review` modelleri) hazır — bkz. `mavirotamarine-site/docs/mico-api-plan.md`. Mobil
  ekranları henüz yok.
- **Faz 3+ (yol haritası, henüz kodlanmadı):** Marine market, ikinci el tekne pazarı, AI denizcilik
  asistanı, hava durumu, topluluk, bildirimler, premium üyelik. Her biri kendi modülü olarak, mevcut
  yapıyı bozmadan eklenecek şekilde tasarlanacak.

## Kurulum

```bash
npm install
cp .env.example .env
npx expo start
```

`.env` içindeki `EXPO_PUBLIC_API_BASE_URL`, canlı siteye (`https://www.mavirotamarine.com/api/v1`) veya
yerelde çalışan `mavirotamarine-site` sunucusuna işaret edebilir.

## Klasör yapısı

```
src/
  api/          # backend istemcisi (fetch wrapper, token yenileme, auth/boats/maintenance)
  navigation/   # React Navigation stack'leri
  screens/      # auth/ ve boats/ altında ekranlar
  store/        # AuthContext (oturum durumu)
  theme/        # renk paleti
  types/        # backend ile birebir eşleşen TypeScript tipleri
```

Yeni bir modül (ör. `craftsmen`) eklenirken aynı desen izlenir: `src/api/craftsmen.ts`,
`src/screens/craftsmen/`, gerekirse yeni bir navigator.

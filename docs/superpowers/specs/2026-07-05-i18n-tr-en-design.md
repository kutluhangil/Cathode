# Cathode — TR/EN Dil Desteği (i18n) Tasarımı

Tarih: 2026-07-05
Durum: Onaylandı (implementasyon bekliyor)

## Amaç
Siteye TR ve ENG dil seçimi eklemek. Tüm görünür UI metinleri iki dilde;
kullanıcı canlı olarak dil değiştirebilir. Seçim tarayıcıda kalıcı.

## Kararlar
- **Kapsam:** Tüm UI metinleri (33 component + data katmanı görünür stringleri).
- **Yaklaşım:** Hafif özel i18n. Yeni bağımlılık yok. Zustand + sözlük + `t()` helper.
- **Seçici:** Ayarlar paneli (TR/ENG) + sistem çubuğu hızlı toggle (`TR | EN`).
- **Varsayılan:** TR. Tarayıcı otomatik algılama yok (privacy-first, basit).
- **Persistans:** `settingsStore` (localStorage) içinde `lang`.

## Mimari

### i18n çekirdeği — `src/lib/i18n/`
- `types.ts` — `type Lang = "tr" | "en"`, `Dict` tipi (nested string tablosu).
- `tr.ts`, `en.ts` — namespaced sözlükler. Aynı anahtar ağacı, birebir eşleşir.
- `index.ts` — `export const dictionaries = { tr, en }`.
- `useT.ts` — `useT()` hook. Store'dan `lang` okur, kapanışta `t(key, params?)`
  döner. Nokta ile namespaced anahtar (`"settings.title"`). `{n}` biçiminde
  interpolasyon: `t("emulator.progress", { n: 42 })`.
- Anahtar bulunamazsa: geliştirmede anahtarı aynen döndür (sessiz yutma yok,
  eksik çeviri görünür kalır).

### Sözlük namespace'leri
`menu` (sağ tık), `dock`, `startMenu`, `systemBar`, `settings`, `about`,
`terminal`, `notepad`, `systems`, `games`, `emulator`, `commandPalette`,
`windows` (başlık/kontrol), `boot`, `screensaver`, `installHint`, `common`.

### State — `src/store/settingsStore.ts`
- Ekle: `lang: Lang` (varsayılan `"tr"`), `setLang: (l: Lang) => void`.
- Persist `version` 2 → 3. `migrate`: `lang` yoksa `"tr"` ata.

### Dil seçici bileşenleri
- **Ayarlar:** mevcut `Segmented`/dropdown desenine uygun TR/ENG kontrolü.
- **SystemBar:** kompakt `TR | EN` toggle; `setLang` çağırır.

### `<html lang>` senkronu
- Küçük client effect (örn. `ThemeProvider` ya da yeni ufak provider) ile
  `document.documentElement.lang = lang`. SEO/erişilebilirlik için.

## Uygulama akışı
Her component'te sabit Türkçe string sözlük anahtarına taşınır, `useT()` ile
render edilir. Dinamik metinler (`%`, sayaç, dosya adı) `{n}` interpolasyonu
ya da parçalı anahtarlarla kurulur.

### Dokunulacak dosyalar (görünür string içerenler)
- `components/desktop/`: Desktop (menü), ContextMenu (tüketici), Screensaver
- `components/dock/`: Dock, StartMenu, SystemBar, Clock
- `components/apps/`: About, Settings, Terminal, Notepad, Systems, Games
- `components/apps/emulator/`: EmulatorWindow, LazyEmulator, JsDosScreen, LazyJsDos
- `components/window/`: TitleBar, WindowSwitcher, WindowManager
- `components/boot/BootScreen.tsx`
- `components/InstallHint.tsx`
- `data/apps.ts`, `data/games.ts`, `data/os.ts`, `data/wallpapers.ts`
  (kullanıcıya görünen ad/açıklama alanları — anahtara ya da çift-dilli alana taşınır)

## Kapsam dışı
- Emüle OS'lerin (KolibriOS, DOS vb.) kendi iç arayüzü — ayrı sistem, dokunulmaz.
- Gerçek ürün/OS adları (KolibriOS, FreeDOS vb.) çevrilmez.
- Route bazlı i18n (`/tr`, `/en`) yok — tek route, canlı dil değişimi.

## Risk / notlar
- `data/*` içindeki içerik alanları: en temiz yol, çeviri gereken alanları
  `{ tr, en }` yapısına ya da i18n anahtarına çevirmek. Plan aşamasında
  dosya bazlı netleştirilecek.
- Persist migrate testi: eski `cathode.settings` (v2) yüklenince `lang: "tr"`
  düşmeli, çökme olmamalı.

## Definition of Done
- TR/ENG geçişi anlık; sayfa yenilemeden tüm görünür metin değişir.
- Seçim yenilemede korunur (localStorage).
- Ayarlar + sistem çubuğu seçicileri çalışır.
- Eksik/çevrilmemiş metin kalmaz (kabuk + uygulama içi).
- `tsc` strict + build temiz.

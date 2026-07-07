# Cathode — Senin Yapman Gerekenler

Bu dosya, kodun tamamlandığı yerden sonra **yalnızca senin yapabileceğin** işleri
adım adım anlatır. Kod tarafı bitti; kalanlar commit, dış asset barındırma (Cloudflare
R2) ve yayına alma gibi kimlik/hesap/ikili-dosya gerektiren işlerdir.

> **Durum özeti:** Altı geliştirme fazının (E, A, B, C, D, F) hepsi kodlandı ve test edildi
> — 51 e2e testi geçiyor, TypeScript ve lint temiz. Aşağıdaki işler kodla ilgili değil;
> senin hesaplarınla/dosyalarınla yapılacak operasyon işleridir.

---

## 0. Bir bakışta ne kaldı?

| # | İş | Zorunlu mu? | Süre |
|---|----|:--:|---|
| 1 | Bekleyen değişiklikleri **commit** et | Evet | 2 dk |
| 2 | Yerelde **çalıştır ve gör** | Önerilir | 5 dk |
| 3 | **R2**'ye OS imajları + DOS oyunları yükle | İsteğe bağlı* | 1–3 saat |
| 4 | **Production**'a deploy (Docker → nginx → Cloudflare Tunnel) | Yayınlayacaksan | 1–2 saat |
| 5 | Son **doğrulama** | Evet | 15 dk |

\* Site R2 olmadan da çalışır: KolibriOS + FreeDOS yerelde gömülü. R2 sadece daha fazla
sistem (ReactOS vb.) ve DOS oyun kataloğu içindir.

---

## 1. Commit (bekleyen iş)

Şu an çalışma ağacında commit edilmemiş değişiklikler var (D + F fazları + ekran
görüntüleri + dokümanlar). Önce ne olduğuna bak:

```bash
git status
git --no-pager diff --stat HEAD
```

Sonra commit et. **Not:** Ben (asistan) hiçbir zaman commit atmadım; bu senin işin.
Tek commit yeterli, ya da mantıklı gruplara bölebilirsin:

```bash
git add -A
git commit -m "feat: emulation depth (multi-window + perf warning) and showcase (themes, easter eggs, screenshots)"
git push
```

İstersen daha granüler:

```bash
# tema + easter egg
git add src/app/globals.css src/store/settingsStore.ts src/components/apps/Settings.tsx \
        src/components/apps/Terminal.tsx src/lib/useKonami.ts src/components/desktop/Desktop.tsx \
        src/lib/i18n/
git commit -m "feat: theme variety (blue/white) and easter eggs"

# emülatör derinliği
git add src/lib/types.ts src/data/apps.ts src/store/windowsStore.ts \
        src/components/desktop/EmuPerfWarning.tsx src/components/desktop/CommandPalette.tsx
git commit -m "feat: single-instance emulators + multi-window perf warning"

# testler + görseller + doküman
git add e2e/ docs/ deploy/R2.md README.md
git commit -m "test+docs: emulation/showcase e2e, screenshots, guides"

git push
```

GitHub'da katkı listesinde yalnız sen görünürsün (kurallar gereği hiçbir yere Claude/AI
atıfı eklenmedi).

---

## 2. Yerelde çalıştır ve gör

```bash
npm install          # ilk kez / bağımlılık değiştiyse (postinstall emülatör binary'lerini hazırlar)
npm run dev          # http://localhost:3000
```

Test ve kalite:

```bash
npm run test:e2e     # Playwright e2e (51 test) — ilk sefer: npx playwright install chromium
npx tsc --noEmit     # tip kontrolü
npm run lint         # ESLint
```

Ekran görüntülerini yeniden üret (README için):

```bash
CAPTURE=1 npm run test:e2e -- screenshots.spec.ts --project=desktop
# çıktı: docs/screenshots/{desktop,apps,paint}.png
```

**Denemen gereken yeni özellikler:**
- Sağ tık masaüstü → "Yeni klasör / Yeni metin dosyası" → ikon masaüstüne düşer, sürükle.
- Not defteri → yaz → **Farklı kaydet** → Dosyalar uygulamasında görün.
- Paint → çiz → **Kaydet** → `/Pictures`'a düşer → çift tıkla → Görüntüleyici açar.
- Ayarlar → accent renk swatch'ları (amber/yeşil/mavi/beyaz).
- Terminal → gizli komutlar: `xyzzy`, `credits`, `neofetch`.
- Klavye: **Konami kodu** `↑ ↑ ↓ ↓ ← → ← → B A` → fosfor parıltısı.
- Emülatör penceresini kapat/küçült → tekrar aç → **otomatik kaldığı yerden devam**.

---

## 3. Cloudflare R2 — OS imajları ve DOS oyunları barındırma

Bu **ana dış iş**. Kod tamamen hazır: bir imaj/oyun R2'de barındırılıp kayıt defterinde
`enabled: true` yapılınca otomatik katalogda çıkar ve açılır. Başka kod değişmez.

Ayrıntılı teknik doküman: **`deploy/R2.md`**. Aşağısı onun uygulanışıdır.

### 3.1 Bucket ve public erişim
1. Cloudflare paneli → **R2** → *Create bucket* → adı `cathode-images`.
2. Bucket'a **custom domain** bağla (örn. `images.senin-domain.com`). Range request
   (parça parça indirme) otomatik desteklenir.

### 3.2 KRİTİK: header'lar (yoksa emülatör açılmaz)
Shell, `Cross-Origin-Embedder-Policy: credentialless` ile çalışır (v86'nın
SharedArrayBuffer'ı için gerekli). Bu yüzden R2'den gelen imajlar **CORS ya da CORP**
header'ı döndürmeli, yoksa tarayıcı bloklar:

- Cloudflare → R2 custom domain → **Transform Rules / Response Header** ekle:
  - `Cross-Origin-Resource-Policy: cross-origin`
  - Ayrıca CORS gerekiyorsa bucket CORS'a sitenin origin'ini ekle: izinli metodlar
    `GET, HEAD`, izinli header `Range`.

> Bunu atlarsan konsolda "blocked by Cross-Origin-Embedder-Policy" hatası görürsün ve
> imaj yüklenmez. Yerel gömülü imajlar (kolibri/freedos) aynı origin olduğu için
> etkilenmez; sorun sadece R2'den çekilenlerde çıkar.

### 3.3 İmaj hazırlama (v86 için)
- Format: **`.img`** (ham disk). ReactOS için resmi "Boot CD/HDD" imajını `.img`'e çevir.
- **Boyutu byte cinsinden not al** — kayıt defterinde `size` alanı için zorunlu:
  ```bash
  stat -f%z reactos.img     # macOS — byte sayısı
  # veya: wc -c < reactos.img
  ```

### 3.4 Yükleme
```bash
# wrangler (Cloudflare CLI) ile
wrangler r2 object put cathode-images/reactos.img --file ./reactos.img
# veya rclone yapılandırıp: rclone copy ./reactos.img r2:cathode-images/
```

### 3.5 Kayıt defterini aç — `src/data/os.ts`
İlgili OS girişini bul (`reactos` şu an `enabled: false`, örnek URL, `size: 0`) ve
**gerçek URL + gerçek byte boyutu** ile güncelle, `enabled: true` yap:

```ts
// ÖNCE (yer tutucu):
image: { url: "https://r2.example/reactos.img", async: true, size: 0 },
enabled: false,

// SONRA (senin değerlerin):
image: { url: "https://images.senin-domain.com/reactos.img", async: true, size: 734003200 },
enabled: true,
```

- `async: true` → range request ile parça parça indirir (büyük HDD imajları için şart).
- `size` **tam byte** olmalı; yanlışsa boot bozulur.
- `memoryMB` / `vgaMB` / `drive` (hda/fda/cdrom) o sistemin donanım profili — ReactOS için
  hazır (512MB RAM, 32MB VGA, hda).

### 3.6 DOS oyunları — `src/data/games.ts`
Aynı mantık: bir `.jsdos` (ya da `.zip`) bundle'ı R2'ye yükle, `bundle.url`'ü gerçek URL
yap, `enabled: true`. js-dos bunları DOSBox-X ile açar.

```ts
bundle: { url: "https://images.senin-domain.com/oyun.jsdos" },
enabled: true,
```

### 3.7 Değişikliği test et
```bash
npm run dev
# Sistemler / Oyunlar uygulamasını aç → yeni giriş artık "yakında" değil, açılabilir olmalı.
```

---

## 4. Hangi imaj/oyun yasal? (telif)

| Sistem | Durum | Nasıl |
|---|---|---|
| KolibriOS | ✅ gömülü | zaten var (GPL) |
| FreeDOS | ✅ gömülü | zaten var (GPL) |
| **ReactOS** | ✅ barındırılabilir | reactos.org resmi imajı (açık kaynak) → R2 |
| DOS **freeware/shareware** oyunlar | ✅ barındırılabilir | archive.org / dosgames.com serbest lisanslılar → `.jsdos` → R2 |
| Windows 3.x / 95 / 98 / ME / 2000 | ⚠️ **GÖMME** | telifli — yalnızca **BYOI**: kullanıcı kendi imajını yükler (sunucuya gitmez). Kod bunu destekliyor, sen imaj barındırmıyorsun. |
| Windows **XP** | ❌ | spec §5 gereği hiç yok (Microsoft takedown riski) |

**Özet:** R2'ye güvenle koyabileceğin tek OS pratikte **ReactOS**'tur. Windows sürümleri
katalogda "kendi imajınla aç" (BYOI) olarak kalmalı — imajı sen barındırma. DOS oyunları
için yalnız telifsiz/serbest içerik yükle.

---

## 5. Production'a deploy

Repo'da hazır: **`Dockerfile`** (`output: standalone`), **`deploy/nginx.conf`**,
**`.dockerignore`**. Akış: Docker image → Ubuntu sunucu → nginx → Cloudflare Tunnel.
İmajlar R2'de.

```bash
docker build -t cathode .
docker run -p 3000:3000 cathode
```

### KRİTİK: header'lar production'da da korunmalı
`next.config.mjs` şu header'ları veriyor (v86 için zorunlu):
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: credentialless`

nginx / Cloudflare Tunnel bunları **ezmeden geçirmeli**. `deploy/nginx.conf`'u kontrol et;
proxy bu iki header'ı silmesin. Yoksa production'da emülatörler açılmaz (yerelde
çalışıp canlıda çalışmama sebebi hep budur).

HTTPS zorunlu (SharedArrayBuffer secure-context ister) — Cloudflare Tunnel bunu sağlar.

---

## 6. Yayın öncesi doğrulama kontrol listesi

- [ ] `npm run test:e2e` → tümü yeşil (51 test; 3 screenshot testi CAPTURE olmadan atlanır).
- [ ] `npx tsc --noEmit` ve `npm run lint` → temiz.
- [ ] Yerelde: boot → masaüstü → app'ler açılıyor, pencere sürükle/boyutlandır çalışıyor.
- [ ] Dosya sistemi: dosya oluştur → reload → duruyor (OPFS kalıcı).
- [ ] Emülatör: KolibriOS aç → kapat → tekrar aç → kaldığı yerden devam ediyor.
- [ ] Tema: 4 accent de uygulanıyor; reload sonrası korunuyor.
- [ ] Mobil (tarayıcı responsive < 768px): tek tam-ekran pencere modu düzgün.
- [ ] PWA: "uygulama olarak kur" çalışıyor, offline app shell açılıyor.
- [ ] (R2 yaptıysan) ReactOS / DOS oyunu gerçekten boot ediyor, CORS/COEP hatası yok.
- [ ] (Deploy sonrası) Canlıda COOP/COEP header'ları mevcut (`curl -I https://...` ile bak).
- [ ] Disclaimer/yasal not görünür; GitHub Contributors'da yalnız sen varsın.

---

## 7. Sık hatalar / ipuçları

- **"blocked by Cross-Origin-Embedder-Policy"** → R2 kaynağına CORP/CORS header'ı ekle (§3.2).
- **Canlıda emülatör açılmıyor ama yerelde açılıyor** → proxy COOP/COEP header'larını
  düşürüyor (§5).
- **ReactOS boot yarıda kalıyor** → `size` byte değeri yanlış ya da `async` unutulmuş.
- **Ekran görüntüleri eski** → `CAPTURE=1 npm run test:e2e -- screenshots.spec.ts` ile yenile.
- **Yeni bir OS/oyun eklemek** → sadece `src/data/os.ts` / `src/data/games.ts`'e giriş +
  R2 upload; başka dosya gerekmez.

---

Kod tarafında yapılacak bir şey kalmadı. Bu listedeki işler tamamlandığında proje
tümüyle yayına hazır.

# Retrograde — Master Build Spec

> **Çalışma adı:** `Retrograde` · değiştirmek istersen tüm dosyada `Retrograde` (görünen ad) ve `retrograde` (paket/slug) token'larını tek seferde değiştir.
> **Tip:** Tarayıcıda çalışan retro işletim sistemi sitesi · Hobby · Login yok · Reklam yok · Para yok
> **Hedef:** LinkedIn'de keyif amaçlı paylaşım · premium ve özgün tasarım
> **Yürütme:** VS Code + Claude Code · faz faz · her fazın sonunda Kutluhan inceleyip kendisi commit eder

---

## 0. Konsept (tek paragraf)

Retrograde iki katmanlı bir projedir. **Dışarıda** tamamen bize ait, özgün tasarımlı bir "işletim sistemi kabuğu" (shell) vardır: boot ekranı, masaüstü, dock, pencere yöneticisi — hepsi React/TypeScript ile yazılır, bu sitenin asıl markasıdır. **İçeride** ise gerçek eski işletim sistemleri (Windows 95/98/2000, DOS, ReactOS) bir pencere içinde, WebAssembly tabanlı emülatörle (v86 / js-dos) çalışır. Her şey kullanıcının tarayıcısında, client-side ve izole çalışır; sunucuda OS koşmaz. **Faz 1 sadece kabuğu** üretir (emülasyon olmadan, gerçek bir masaüstü gibi gezilebilir). **Faz 2** gerçek emülasyonu ekler.

---

## 1. Kalıcı Kurallar — `CLAUDE.md` (repo köküne aynen koy)

> Aşağıdaki bloğu projenin kök dizinine `CLAUDE.md` olarak kaydet. Bu kurallar **bağlayıcıdır**.

```markdown
# CLAUDE.md — Retrograde

## Git / sürüm yönetimi (MUTLAK kurallar)
- ASLA `git commit` veya `git push` çalıştırma. Tüm commit ve push işlemlerini Kutluhan elle yapar.
- ASLA branch oluşturma (`git branch`, `git checkout -b` yok). Aksi söylenmedikçe mevcut branch'te çalış.
- Commit'lere ASLA `Co-Authored-By: Claude` veya herhangi bir Claude/AI atıfı ekleme.
- GitHub "Contributors" listesinde SADECE Kutluhan görünmelidir. Claude asla görünmez.
- Bir iş bittiğinde: değişiklikleri özetle, hangi dosyaların değiştiğini söyle ve "commit etmeye hazır" de — commit'i Kutluhan'a bırak.

## Çalışma biçimi
- Bu spec'i (RETROGRADE_BUILD_SPEC.md) faz faz uygula. Bir fazı bitirmeden sonrakine geçme.
- Her fazın sonunda o fazın "Definition of Done" maddelerini kontrol et.
- Kod açık, tipli (TypeScript strict) ve yorum gerektiren yerlerde kısa yorumlu olsun.
- Yeni bağımlılık eklemeden önce gerekçesini bir cümleyle belirt.

## Stack kararları (sapma yok)
- Next.js 14 (App Router) + TypeScript (strict) + Tailwind CSS + Framer Motion
- State: hafif (Zustand) — gereksiz global store kurma
- Login yok, veritabanı yok, ödeme yok, analytics yok (privacy-first kalır)
- Persistans: tarayıcıda (localStorage / OPFS) — sunucu state yok
```

---

## 2. Mimari

```
Tarayıcı / PWA
   └── Premium Shell (Next.js + TS)   ← bizim "OS"umuz, markamız
         ├── Boot ekranı
         ├── Masaüstü + duvar kâğıdı + ikonlar
         ├── Pencere yöneticisi (drag/resize/min/max/close)
         ├── Dock / başlat menüsü + saat
         └── "Uygulama" sistemi (pencere içinde React app'ler)
                └── [Faz 2] Emülatör penceresi
                      ├── v86 (WASM)      → OS'leri disk imajından açar
                      └── js-dos (DOSBox-X) → DOS + Win9x oyunları
                            └── Gerçek OS'ler: ReactOS, DOS, Win 3.1/95/98/ME/2000
```

**İzolasyon:** Emülasyon tamamen client-side ve tarayıcı sandbox'ında çalışır; emüle edilen OS modern sisteme erişemez. Emüle OS'i internete bağlamayacağız (gerek yok, güvenlik için kapalı).

---

## 3. Teknik Stack & Klasör Yapısı

**Stack:**
- Next.js 14 (App Router) · TypeScript (strict) · Tailwind CSS · Framer Motion
- Zustand (pencere/masaüstü durumu)
- PWA: `@serwist/next` (Next 14 App Router uyumlu service worker)
- [Faz 2] `v86` (npm) · `js-dos` v8
- Persistans: `localStorage` (ayarlar) + OPFS (Faz 2: OS durumu/dosyaları)
- Disk imajları (Faz 2): **Cloudflare R2** (egress ücretsiz, HTTP range request ile streaming)
- Deploy: Ubuntu sunucu · Docker · nginx · Cloudflare Tunnel (mevcut altyapıyla aynı düzen)

**Klasör yapısı:**
```
retrograde/
├── CLAUDE.md
├── public/
│   ├── manifest.webmanifest
│   ├── icons/                  # PWA + masaüstü ikonları (özgün, Windows logosu YOK)
│   └── wallpapers/             # özgün duvar kâğıtları
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx            # tek sayfa: boot → masaüstü
│   │   └── globals.css         # tasarım token'ları + CRT efektleri
│   ├── components/
│   │   ├── boot/               # BootScreen, logo animasyonu
│   │   ├── desktop/            # Desktop, DesktopIcon, ContextMenu, Wallpaper
│   │   ├── window/             # Window, WindowManager, TitleBar, ResizeHandles
│   │   ├── dock/               # Dock, StartMenu, Clock, TrayIcons
│   │   └── apps/               # pencere içi React app'ler (About, Settings, ...)
│   │       └── emulator/       # [Faz 2] EmulatorWindow, V86Screen, JsDosScreen
│   ├── store/                  # Zustand: windowsStore, settingsStore
│   ├── lib/                    # yardımcılar (focus, zIndex, persistance)
│   ├── data/                   # apps registry, os registry (Faz 2)
│   └── styles/                 # tema değişkenleri
├── tailwind.config.ts
├── next.config.mjs             # Serwist + (Faz 2) WASM/headers ayarları
└── tsconfig.json               # strict
```

---

## 4. Tasarım Sistemi — "Obsidian Retrograde"

Çizgi: **premium dark minimalist + retro CRT**. 1:1 Windows kopyası YAPMA (klişe + trademark riski). Kendi özgün, fütüristik-retro işletim sistemimizi tasarlıyoruz.

**Renk token'ları** (`globals.css` içinde CSS değişkeni olarak):
```css
:root {
  --bg-void:      #08080a;   /* en arka plan, obsidyen */
  --bg-desk:      #0c0c10;   /* masaüstü */
  --surface:      #16161c;   /* pencere gövdesi */
  --surface-glass: rgba(22,22,28,0.72); /* cam pencere + backdrop-blur */
  --border:       #26262e;
  --border-soft:  #1c1c22;
  --text:         #E9E6DF;   /* sıcak beyaz */
  --text-dim:     #8A887F;

  /* Accent — varsayılan: amber (P3 fosfor). Ayarlar'dan değişebilir. */
  --accent:       #FFB000;   /* amber CRT */
  --accent-glow:  rgba(255,176,0,0.35);
  /* Alternatif accent (phosphor green / P1): #2BD96A , glow rgba(43,217,106,.3) */
}
```

**Tipografi:**
- Arayüz: modern grotesk (Geist / Inter) — temiz, premium.
- Terminal/monospace vurgular: `Geist Mono` veya `IBM Plex Mono`.
- Tüm metin **sentence case**, ASLA Title Case / ALL CAPS değil.

**CRT efektleri** (hepsi Ayarlar'dan aç/kapa edilebilir, varsayılan: hafif açık):
- İnce scanline overlay (tüm ekran üstünde, `pointer-events:none`, çok düşük opaklık).
- Hafif vignette (kenar kararması).
- Accent metinlerde fosfor "glow" (text-shadow ile, abartısız).
- Opsiyonel boot anında çok kısa flicker.

**Pencere chrome'u:** ince başlık çubuğu, sol/sağda min-max-close, cam gövde (backdrop-blur), 12px köşe, 0.5px ince kenar. Aktif pencere accent çizgili/parlak, pasif sönük.

**Hareket (Framer Motion):** pencere aç/kapa hafif scale+fade, dock hover yumuşak, boot logo akıcı. `prefers-reduced-motion` desteklenir (kapalıysa animasyon yok).

---

## 5. Yasal / İçerik Politikası (uyulması zorunlu)

Seçim: **güvenli set gömülü + disclaimer**.

- **Gömülecek güvenli set:** FreeDOS, MS-DOS, Windows 3.x, 95, 98, ME, 2000 ve tamamen açık olanlar (**ReactOS**, TinyCore/Alpine Linux, KolibriOS, Haiku).
- **XP YOK.** Hem yasal olarak en riskli sürüm (Microsoft XP için takedown gönderiyor), hem v86'da kötü çalışıyor. Faz 2'de istenirse sadece "kendi imajını yükle" (BYOI) deneysel modunda düşünülür, gömülmez.
- **Windows logosu / Start ikonu kullanma.** Özgün ikonografi tasarla (daedalOS bile yasal sebeple Windows ikonunu kaldırıp π koymuştu). Marka tamamen Retrograde.
- **Disclaimer** (sitenin altında + "Hakkında" uygulamasında, TR + EN):

```
Retrograde bir hobi/eğitim/dijital koruma projesidir. Emülasyon motorları açık kaynaktır.
Eski işletim sistemleri telif sahiplerine aittir ve yalnızca arşiv/nostalji amacıyla,
tarayıcıda izole biçimde çalıştırılır. Telif sahibi talep ederse ilgili içerik kaldırılır.
Bu site reklam içermez, ticari amaç gütmez.
```

---

## 6. FAZLAR

> Her faz bağımsız teslim edilebilir. Bir faz bitmeden sonrakine geçme. Faz sonunda DoD kontrol edilir, Kutluhan commit eder.

### FAZ 0 — Kurulum
**Görevler**
- [ ] `create-next-app` (App Router, TS, Tailwind, ESLint) ile `retrograde` oluştur.
- [ ] TypeScript `strict: true`. Prettier + ESLint yapılandır.
- [ ] `CLAUDE.md`'yi (Bölüm 1) repo köküne koy.
- [ ] Tasarım token'larını `globals.css`'e ekle (Bölüm 4). Tailwind'i token'lara bağla.
- [ ] Zustand kur. `globals.css`'te CRT overlay altyapısını (scanline/vignette katmanları) hazırla, varsayılan kapalı.
- [ ] `page.tsx`: boş obsidyen ekran + ortada "Retrograde" yer tutucu.

**DoD:** Proje çalışıyor (`npm run dev`), obsidyen ekran + token'lar aktif, lint temiz, `CLAUDE.md` yerinde.

---

### FAZ 1 — Premium Shell (v1, ASIL İŞ)

#### 1.1 Boot ekranı
- [ ] `BootScreen` component'i: özgün Retrograde logosu + akıcı animasyon (Framer Motion).
- [ ] Sahte ama tatmin edici boot sekansı (kısa ilerleme/parıltı), 1.5–2.5 sn, sonra masaüstüne geçiş.
- [ ] Boot bir kez gösterilir (oturum başına); "skip" tıklamasıyla atlanır.

#### 1.2 Masaüstü
- [ ] `Desktop`: özgün duvar kâğıdı (statik + opsiyonel hafif animasyonlu), ikon ızgarası.
- [ ] `DesktopIcon`: çift tıkla uygulama açar; seçili durum stili.
- [ ] `ContextMenu` (sağ tık): "Yenile", "Duvar kâğıdını değiştir", "Ayarlar", "Hakkında".

#### 1.3 Pencere yöneticisi (kalbi burası)
- [ ] `Window`: sürükle (title bar), 8 yönden resize, min/max/restore/close.
- [ ] `WindowManager` + Zustand `windowsStore`: açık pencereler, z-index, odak (focus), aktif pencere.
- [ ] Pencereler ekran sınırında durur; maximize dock'u açıkta bırakır; çift tık title bar = maximize.
- [ ] Klavye: `Esc` kapatmaz (sadece emülatör için ileride), `Alt+Tab` benzeri pencere geçişi (opsiyonel, hoş dokunuş).

#### 1.4 Dock / başlat menüsü
- [ ] `Dock`: açık pencereler + sabitli uygulamalar; hover yumuşak büyüme; tıkla odakla/minimize et.
- [ ] `StartMenu` (özgün, "Start" yazma — "Retrograde" menüsü): uygulama listesi + arama.
- [ ] `Clock`: canlı saat/tarih; tray alanında accent/CRT toggle kısayolu.

#### 1.5 Uygulama sistemi + ilk uygulamalar
- [ ] `data/apps.ts`: uygulama kayıt defteri (id, ad, ikon, component, varsayılan boyut).
- [ ] `apps/About`: proje anlatımı + disclaimer (TR/EN).
- [ ] `apps/Settings`: tema/accent seçimi (amber ↔ phosphor green), CRT efekt aç/kapa, duvar kâğıdı seçimi, hareket aç/kapa — hepsi `settingsStore` + `localStorage`.
- [ ] En az 1 "keyifli" mini uygulama (örn. retro hesap makinesi veya basit bir not defteri) — kabuğun gerçek hissettirmesi için.

#### 1.6 PWA
- [ ] `@serwist/next` kur, `manifest.webmanifest` yaz (ad, kısa ad, ikonlar, theme/background = obsidyen, `display: standalone`).
- [ ] Service worker: shell offline çalışsın (app shell cache).
- [ ] "Masaüstüne ekle" akışı çalışsın (macOS "Add to Dock", Windows "Install app"). İlk açılışta nazik bir "uygulama olarak kur" ipucu (kapatılabilir).

#### 1.7 Cila + erişilebilirlik + responsive
- [ ] `prefers-reduced-motion` ve `prefers-color-scheme` saygısı; klavye odak görünür.
- [ ] Mobil/tablet: en azından bozulmadan görünsün (mobilde pencere yönetimi sadeleşebilir — örn. tam ekran tek pencere).
- [ ] Opsiyonel: hafif UI sesleri (aç/kapa, varsayılan kapalı).
- [ ] LinkedIn için OG/Twitter kartı: özgün, premium bir önizleme görseli + başlık/açıklama.

**FAZ 1 DoD:** Emülasyon olmadan, gerçek bir masaüstü gibi gezilebilen, pencere açılıp kapanabilen, ayarları kalıcı, PWA olarak kurulabilen, premium görünümlü tam çalışan bir kabuk. Bu v1'dir ve tek başına paylaşılabilir.

---

### FAZ 2 — Emülasyon Entegrasyonu

> Güvenli set + ReactOS ile başla. İmajlar R2'de, range request ile streaming.

#### 2.1 v86 altyapısı
- [ ] `v86` npm paketini kur. `next.config.mjs`'te gerekli header'lar (`Cross-Origin-Opener-Policy`, `Cross-Origin-Embedder-Policy`) ve WASM ayarları.
- [ ] `bios/seabios.bin`, `vgabios.bin` ve `v86.wasm`'ı `public/`e koy.
- [ ] `apps/emulator/V86Screen`: bir pencere içinde v86 ekranı (canvas + klavye/mouse capture, "ekranı bırak" kısayolu).

#### 2.2 İlk OS: ReactOS (en güvenli)
- [ ] ReactOS disk imajını R2'ye yükle; `os registry`'ye ekle.
- [ ] Pencerede ReactOS açılışı; yükleme/boot için şık bir loading UI (ilerleme + ipucu metni).

#### 2.3 İmaj yükleme pipeline'ı
- [ ] `data/os.ts`: OS kayıt defteri (id, ad, açıklama, imaj URL, RAM/VGA, boot order, motor: v86|jsdos).
- [ ] v86 `hda: { url, async: true, size }` ile range request streaming (büyük imajları parça parça çek).
- [ ] Yükleme durumları: indiriliyor → boot → hazır; hata yönetimi + tekrar dene.

#### 2.4 Diğer OS'ler (güvenli set)
- [ ] FreeDOS/MS-DOS, Windows 3.x, 95, 98, ME, 2000 imajlarını R2'ye koy ve kayıt defterine ekle.
- [ ] Win 2000 için PC tipi "Standart PC" notu/ayarı.
- [ ] Her OS için masaüstünde özgün ikon; çift tık → emülatör penceresinde aç.

#### 2.5 js-dos (DOS / Win9x oyunları)
- [ ] `js-dos` v8 kur; `JsDosScreen` component'i.
- [ ] Birkaç açık/serbest DOS oyunu/uygulaması ile "Oyunlar" bölümü (telifsiz/serbest olanlar).

#### 2.6 Persistans
- [ ] OPFS ile kullanıcının kurduğu programlar/oluşturduğu dosyalar kalıcı olsun.
- [ ] v86 save-state: çalışan OS durumunu kaydet/yükle ("uyku/devam" hissi).

#### 2.7 Entegrasyon
- [ ] Başlat menüsü + masaüstü ikonları emülatör pencerelerini açsın.
- [ ] Aynı anda birden fazla OS penceresi açılabilsin (performans uyarısıyla).

#### 2.8 (Opsiyonel) BYOI
- [ ] "Kendi imajını yükle": kullanıcı `.img`/`.iso` sürükle-bırak; sadece kendi tarayıcısında çalışır, sunucuya gitmez. XP gibi telifliler bu yolla deneysel.

**FAZ 2 DoD:** ReactOS + güvenli setteki OS'ler pencere içinde gerçekten boot oluyor, yükleme akıcı, durum kalıcı, masaüstü/dock entegre.

---

### FAZ 3 — Yayın & Cila
- [ ] Performans: imaj boyutlarını optimize et, lazy-load, ilk yük hızlı (kabuk önce gelir, emülatör istenince yüklenir).
- [ ] SEO + LinkedIn OG kartı son hali; favicon/PWA ikon seti tam.
- [ ] `README.md`: ne olduğu, nasıl çalıştığı, yasal not, teşekkürler (v86, js-dos, ReactOS).
- [ ] Deploy: Docker image → Ubuntu sunucu → nginx → Cloudflare Tunnel; imajlar R2'de. HTTPS + doğru COOP/COEP header'ları.
- [ ] Son gözden geçirme: tüm CRT/efekt toggle'ları, mobil görünüm, disclaimer görünür.

---

## 7. Multi-Agent Sistemi (9 ajan — dosya sahipliği + kabul kriterleri)

> Standart 9-agent yapısı. Her ajan yalnızca kendi dosyalarına dokunur; başka ajanın dosyasını değiştirmez. Kabul kriteri karşılanmadan ajan "tamam" sayılmaz. Faz sırası §6'daki gibidir; ajanlar o fazlar içinde devreye girer.

| # | Ajan | Sahip olduğu dosyalar | Kabul kriteri |
|---|---|---|---|
| 1 | **Foundation & Tooling** | `tsconfig.json` (strict), `tailwind.config.ts`, `next.config.mjs` (temel), ESLint/Prettier, `CLAUDE.md`, klasör iskeleti | Proje derleniyor (`npm run dev`), lint temiz, token'lar Tailwind'e bağlı, `CLAUDE.md` yerinde |
| 2 | **Design System & CRT** | `src/app/globals.css` (token + CRT katmanları), `src/styles/*`, `src/components/ui/*` (button, toggle, slider, glass, icon), `src/lib/motion.ts` | Atomlar çalışıyor, amber↔phosphor tema geçişi sorunsuz, CRT toggle'ları çalışıyor, `prefers-reduced-motion` saygılı |
| 3 | **Boot & Desktop** | `src/components/boot/*`, `src/components/desktop/*` (Desktop, DesktopIcon, ContextMenu, Wallpaper), `src/app/page.tsx` | CRT boot oynuyor + atlanabiliyor, masaüstü mount oluyor, ikonlar + sağ-tık menüsü çalışıyor |
| 4 | **Window Manager** | `src/components/window/*` (Window, WindowManager, TitleBar, ResizeHandles), `src/store/windowsStore` | Drag + 8 yön resize + min/max/restore/close, z-index ve odak doğru, ekran sınırına snap |
| 5 | **Dock & Start** | `src/components/dock/*` (Dock, StartMenu, Clock, TrayIcons) | Dock açık+sabit pencereleri gösteriyor, hover büyüme, Retrograde menüsü + arama, canlı saat, tray'de accent/CRT kısayolu |
| 6 | **Apps & System UI** | `src/components/apps/*` (About, Settings, mini app), `src/data/apps.ts`, `src/store/settingsStore` | Uygulamalar pencerede açılıyor, ayarlar (tema/CRT/duvar kâğıdı/hareket) `localStorage`'da kalıcı, About'ta disclaimer |
| 7 | **Emulation Core** *(Faz 2)* | `src/components/apps/emulator/*` (V86Screen, JsDosScreen, EmulatorWindow), `src/lib/emu/*`, `next.config.mjs` COOP/COEP + WASM | v86 ve js-dos pencere içinde boot ediyor; reset, tam ekran, "ekranı bırak" çalışıyor |
| 8 | **OS Catalog, Images & Persistence** *(Faz 2)* | `src/data/os.ts`, `src/components/apps/emulator/os-loader/*`, `src/lib/persist.ts`, R2 dokümanı (`deploy/`) | Güvenli set kataloğu + R2'den async/range yükleme + ilerleme; OPFS save/restore; BYOI upload (yalnız client) |
| 9 | **PWA, Polish, A11y & Deploy** | `public/manifest.webmanifest`, `@serwist/next` SW, `src/lib/pwa.ts`, OG/meta, `Dockerfile`, `deploy/nginx.conf`, `README.md` | PWA kurulabiliyor + offline kabuk, Lighthouse PWA ✓, Docker+tunnel deploy çalışıyor, disclaimer canlı, README tam |

**Faz eşlemesi:** Faz 0 → Ajan 1 · Faz 1 → Ajan 2, 3, 4, 5, 6 (+ Ajan 9'un PWA kısmı) · Faz 2 → Ajan 7, 8 · Faz 3 → Ajan 9 (cila/deploy).

---

## 8. Claude Code'a notlar
- Bu spec'i sırayla uygula; faz atlamadan ilerle. Her fazın DoD'sini kontrol et.
- **Commit/push/branch YOK** (bkz. CLAUDE.md). İş bitince özetle, "commit'e hazır" de, gerisini Kutluhan yapar.
- Yeni paket eklemeden önce tek cümlelik gerekçe ver.
- Performans ve erişilebilirlik birinci sınıf vatandaş; `prefers-reduced-motion`/`prefers-color-scheme` daima saygı görür.
- Tasarımda kararsız kalırsan: daha sade + daha premium olan yönü seç. Retrograde klişe değil, özgün hissetmeli.

---

## 9. Açık bırakılanlar (Kutluhan onayı bekliyor)
- Nihai **isim** (çalışma adı `Retrograde`).
- Accent rengi: **amber (varsayılan)** mı, phosphor green mi (ikisi de Ayarlar'da var, sadece varsayılan seçilecek).
- R2 hesabı/bucket kurulumu (Faz 2 başında).

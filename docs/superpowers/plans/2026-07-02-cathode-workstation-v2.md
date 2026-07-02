# Cathode Workstation v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Görsel katmanı sıfırdan "Cathode Workstation" tasarım diline taşı — inandırıcı özgün OS + fiziksel CRT monitör sunumu; tüm mevcut işlevsellik korunur.

**Architecture:** Token'lar CSS değişkeni + Tailwind bağı olarak kalır (mevcut desen). Yeni ikon registry'si tek dosya. Monitör modu overlay çerçeve (containing-block değişikliği YOK — fixed konumlama bozulmaz). Mantık katmanı (windowsStore drag/resize/emülatör) dokunulmaz; tek istisna: `maximizedRect`'e sistem çubuğu payı.

**Tech Stack:** Next.js 14 · TS strict · Tailwind 3 · Framer Motion 12 · Zustand 5 (persist v2 migrate)

## Global Constraints (spec + CLAUDE.md)

- ASLA `git commit`/`git push`/branch — Kutluhan commit eder. Plandaki "checkpoint" = lint+tsc doğrulaması, commit DEĞİL.
- Yeni bağımlılık YOK (mevcut paketler yeter).
- Windows logosu/ikonografisi YOK; tüm metin sentence case.
- `prefers-reduced-motion` + `motion` ayarı tüm yeni animasyonlarda saygı görür.
- Test framework yok → doğrulama: `npx tsc --noEmit` + `npm run lint`; sonda `npm run build` + tarayıcı QA.
- Her task sonunda proje derlenir durumda olmalı.

## Kilitli arayüz sözleşmeleri (task'lar arası)

```ts
// src/components/icons/index.tsx (Task 2 üretir; 3-7 tüketir)
export type IconName =
  | "close" | "minimize" | "maximize" | "restore"
  | "settings" | "info" | "doc" | "monitor" | "gamepad" | "disk"
  | "terminal" | "bird" | "upload" | "refresh" | "image" | "power"
  | "search" | "chevron-left" | "palette" | "crt" | "motion" | "sound"
  | "system" | "shield";
export function Icon(props: { name: IconName; size?: number; className?: string; strokeWidth?: number }): JSX.Element;
export function CathodeMark(props: { size?: number; className?: string }): JSX.Element; // özgün marka SVG (◉ ölür)

// src/lib/layout.ts (Task 5 üretir; windowsStore + SystemBar + Dock tüketir)
export const SYSTEM_BAR_H = 28;   // px — üst sistem çubuğu
export const DOCK_RESERVE = 84;   // px — windowsStore'daki mevcut sabitle aynı değer, buraya taşınır

// src/lib/types.ts (Task 4)
export type WallpaperId = "phosphor" | "blueprint" | "testcard" | "void" | "photo";

// src/store/settingsStore.ts (Task 4) — eklenen alanlar
monitor: boolean;                    // varsayılan false
setMonitor: (v: boolean) => void;
toggleMonitor: () => void;
// persist: { name: "cathode.settings", version: 2, migrate } — eski wallpaper adları → "phosphor"

// src/components/desktop/ContextMenu.tsx (Task 5) — MenuItem'e eklenir
export interface MenuItem { label: string; onClick: () => void; divider?: boolean; icon?: IconName }
```

CSS var eşlemesi (spec §4.1 adları → mevcut var adları, değerler spec'ten):
`--text-1/2/3` → `--text`, `--text-dim`, `--text-faint`(yeni) · `--surface-1` → `--surface`, `--surface-0/2/3` yeni · `--line-strong/hair` → `--border`, `--border-soft` · yeni: `--edge-light`, `--accent-dim`, `--ok`, `--warn`, `--danger`, `--radius-ui`. Gerekçe: Tailwind utility adları (`text-text`, `border-border`, `bg-surface`…) ~20 dosyada geçiyor; ad koruyup değer değiştirmek diff'i gerçek görsel değişikliğe odaklar.

---

### Task 1: Token temeli v2 (globals.css + tailwind)

**Files:**
- Modify: `src/app/globals.css` (tam yeniden yazım)
- Modify: `tailwind.config.ts`

**Produces:** yeni token değerleri; `.bg-glass`, `.phosphor`, `.win-noise`, `.machined` utility'leri; aperture-grille CRT katman CSS'i; monitör çerçevesi CSS'i (`.monitor-*` sınıfları — Task 6 mount eder); `text-faint`, `surface-0/2/3`, `ok/warn/danger`, `accent-dim` Tailwind renkleri; `rounded-ui`; `shadow-float`.

- [ ] **Step 1:** `globals.css` yeniden yaz: §4.1 spec değerleri (yukarıdaki eşlemeyle), `--radius-win: 8px`, `--radius-ui: 6px`, `--radius-btn: 4px`; scanline bloğu → aperture grille (dikey 1px fosfor şerit `repeating-linear-gradient(90deg, rgba(255,255,255,0.028) 0 1px, transparent 1px 3px)` + mevcut yatay scanline korunur, ikisi tek `.crt-grille` katmanında iki background olarak); vignette+grain kalır (yoğunluk: scanline 0.06, vignette 0.45, grain 0.035); `.monitor-mask` (fixed; inset `8px 8px 32px`; radius 14px; `box-shadow: 0 0 0 200vmax #0a0a0c`; z-index 9985; pointer-events none; `display:none`, `:root[data-monitor="on"]` içinde block; `@media (max-width:640px)` → daima none), `.monitor-glare` (aynı inset/radius; diyagonal beyaz gradyan opacity .04), `.monitor-plate` (fixed alt şerit; sağda mono "CATHODE 5100" + LED nokta `.monitor-led` accent, `breathe` keyframes 3s; reduced-motion: animasyon yok), `.win-noise` (SVG fractal noise data-uri, opacity .02), `:root[data-monitor="on"]` ofset kuralları: `.dock-wrap{bottom:40px}` `.system-bar{top:8px;left:8px;right:8px}` `.desk-disclaimer{bottom:44px}`.
- [ ] **Step 2:** `tailwind.config.ts` extend: colors `+ faint: "var(--text-faint)", "surface-0/2/3", ok, warn, danger, "accent-dim"`; borderRadius `ui: "var(--radius-ui)", btn: "var(--radius-btn)"`; boxShadow `win` güncelle (`inset 0 1px 0 var(--edge-light), 0 16px 48px -12px rgba(0,0,0,0.8), 0 0 0 1px var(--border-soft)`), `float` ekle.
- [ ] **Step 3:** `layout.tsx`'te `.crt-scanlines` sınıfını `.crt-grille` yap (tek satır — tam monitör mount'u Task 6'da).
- [ ] **Verify:** `npx tsc --noEmit && npm run lint` → temiz.

### Task 2: İkon sistemi

**Files:**
- Create: `src/components/icons/index.tsx`
- Modify: `src/components/ui/AppIcon.tsx`, `src/components/InstallHint.tsx`, `src/components/boot/BootScreen.tsx` (yalnız ◉→CathodeMark satırı)

**Interfaces:** yukarıdaki `Icon`/`IconName`/`CathodeMark` sözleşmesi. Çizim dili: 24×24 viewBox, `strokeWidth 1.5`, `strokeLinecap="square"`, `strokeLinejoin="miter"`, `stroke="currentColor"`, `fill="none"`.

- [ ] **Step 1:** `icons/index.tsx`: `PATHS: Record<IconName, JSX.Element>` + `Icon` + `CathodeMark` (marka: yatay tarama çizgili CRT ekran çerçevesi + merkez ışın noktası; ◉ değil, özgün çizim).
- [ ] **Step 2:** `AppIcon.tsx` rötuş: gloss overlay kaldır → `boxShadow`'a `inset 0 1px 0 var(--edge-light)`; radius çarpanı 0.26→0.22; `S.stroke` square cap/miter + 1.5; tile gradyanları koyulaştır (makine paneli hissi — mevcut renk kimlikleri kalır).
- [ ] **Step 3:** `InstallHint` ◉ → `<CathodeMark size={20} />`, ✕ → `<Icon name="close" size={14} />`; `BootScreen` ◉ → `<CathodeMark size={44} />` (kalan boot v2 Task 6).
- [ ] **Verify:** tsc + lint temiz.

### Task 3: Pencere chrome v2

**Files:**
- Modify: `src/components/window/Window.tsx`, `src/components/window/TitleBar.tsx`

**Interfaces:** `TitleBar` prop'u `glyph: string` → kalkar (`win.appId`'den `AppIcon` çizer). `Window` çağrısı güncellenir. Davranış API'leri (move/resize/minimize/maximize/close) aynen.

- [ ] **Step 1:** `Window.tsx`: `bg-glass` → opak `bg-surface` + `win-noise`; radius `rounded-win`(=8px otomatik); aktif: `shadow-win` + `ring-1 ring-border`; pasif: `ring-border-soft` + `opacity-[0.97]`; üstteki accent çizgisi kalkar (title bar altına taşınır).
- [ ] **Step 2:** `TitleBar.tsx`: h-9→h-8; sol `<AppIcon app={{id: win.appId}} size={16} />` + mono 12px başlık (`font-mono`, aktif `text-text`, pasif `text-faint`); sağ üç kare buton 22px `rounded-btn`: `Icon minimize/maximize|restore/close` (maximize durumunda `restore` ikonu — `win.status` ile); close hover `bg-danger/90 text-white`; bar altında `h-px` accent çizgi (aktif: `bg-accent shadow-glow`, pasif: `bg-border-soft`).
- [ ] **Verify:** tsc + lint; `glyph` prop referansı kalmadı (`grep -r "glyph" src/components/window`).

### Task 4: Durum v2 — duvar kâğıtları + settingsStore migrate

**Files:**
- Modify: `src/lib/types.ts`, `src/store/settingsStore.ts`, `src/components/ThemeProvider.tsx`, `src/components/desktop/Wallpaper.tsx` (yeniden yazım), `src/components/desktop/Desktop.tsx` (yalnız WP_ORDER), `src/components/apps/Settings.tsx` (yalnız WALLPAPERS listesi)

- [ ] **Step 1:** `types.ts`: WallpaperId yeni union (sözleşmedeki).
- [ ] **Step 2:** `settingsStore.ts`: `monitor:false` + `setMonitor` + `toggleMonitor`; varsayılan `wallpaper:"phosphor"`; persist `version:2` + `migrate(state)`: geçersiz wallpaper→"phosphor", `monitor` yoksa false.
- [ ] **Step 3:** `ThemeProvider`: `root.dataset.monitor = monitor ? "on" : "off"`.
- [ ] **Step 4:** `Wallpaper.tsx`: `Photo` aynen korunur; yeni: `Phosphor` (radyal accent ışıma %10 + grille dokusu maskeli + vinyet), `Blueprint` (accent %8 çizgi ızgara 24px + merkezde inline SVG teknik çizim: monitör ön görünüş + ölçü okları + mono etiketler "cathode 5100 · 340mm"), `Testcard` (merkez kart: `color-mix(in srgb, var(--accent) N%, black)` 6 dikey bant N=90..8 + alt kalibrasyon şeridi + crosshair + mono damga "cathode systems · test signal", hairline çerçeve, void zemin), `Void` (radyal `#0d0d12→#050506` + grain + accent %4 merkez).
- [ ] **Step 5:** `Desktop.tsx` WP_ORDER + `Settings.tsx` WALLPAPERS yeni id/etiketler (Phosphor/Blueprint/Test kartı/Void/Foto).
- [ ] **Verify:** tsc + lint; eski localStorage senaryosu build sonrası QA'de.

### Task 5: Sistem katmanı — SystemBar + Dock + menüler

**Files:**
- Create: `src/lib/layout.ts`, `src/components/dock/SystemBar.tsx`
- Modify: `src/components/dock/Dock.tsx`, `src/components/dock/Clock.tsx`, `src/components/dock/StartMenu.tsx`, `src/components/desktop/ContextMenu.tsx`, `src/components/desktop/Desktop.tsx`, `src/store/windowsStore.ts` (yalnız sabitler + maximizedRect)

**Interfaces:** `SystemBar()` prop'suz; boot replay: `sessionStorage.removeItem("cathode.booted"); location.reload()`. `MenuItem.icon?: IconName`.

- [ ] **Step 1:** `lib/layout.ts` sabitleri (sözleşmedeki) + `BOOT_KEY = "cathode.booted"` buraya taşınır (page.tsx import eder — tek kaynak).
- [ ] **Step 2:** `SystemBar.tsx`: `system-bar` sınıflı fixed üst şerit (h-7, `bg-glass`, alt hairline); sol: `CathodeMark` + mono "Cathode" butonu → aşağı açılan sistem menüsü (`surface-2`, `shadow-float`; öğeler: hakkında, ayarlar, ayraç, yeniden başlat[`power` ikonu, boot replay]); sağ tray: accent noktası (döngü), `Icon crt` toggle (aktif accent), `Icon monitor` toggle, ayraç, tek satır mono `Clock`.
- [ ] **Step 3:** `Clock.tsx`: tek satır `13:45 · 02 tem` mono 12px (dock'tan çıkar).
- [ ] **Step 4:** `Dock.tsx`: tray bloğu tamamen kalkar (SystemBar'a taşındı); launcher ◉ → `CathodeMark`; kapsayıcıya `dock-wrap` sınıfı; `rounded-ui` + `shadow-win` korunur.
- [ ] **Step 5:** `StartMenu.tsx`: `bg-glass`→`bg-surface-2` + `shadow-float`; arama inputu `surface-0` + `Icon search`; satırlar aynı (AppIcon zaten yeni stilde).
- [ ] **Step 6:** `ContextMenu.tsx`: `icon` desteği (sol 14px `text-faint`), `bg-surface-2`, `rounded-ui`, mono 12px; `Desktop.tsx` menü öğelerine ikonlar (`refresh`/`image`/`settings`/`info`), Desktop'a `SystemBar` mount + ikon ızgarası `top-4`→`top-10`, disclaimer'a `desk-disclaimer` sınıfı.
- [ ] **Step 7:** `windowsStore.ts`: `DOCK_RESERVE` importu `lib/layout`'tan; `maximizedRect`: `const top = SYSTEM_BAR_H + 6; { x:0, y:top, w:innerWidth, h:innerHeight-top-DOCK_RESERVE }`. Başka mantık DEĞİŞMEZ.
- [ ] **Verify:** tsc + lint.

### Task 6: Monitör modu mount + boot v2 + CRT bloom

**Files:**
- Modify: `src/app/layout.tsx`, `src/app/page.tsx`, `src/components/boot/BootScreen.tsx` (yeniden yazım)

- [ ] **Step 1:** `layout.tsx`: CRT katmanları güncel (`crt-grille`, `crt-vignette`, `crt-grain`) + monitör öğeleri: `.monitor-mask`, `.monitor-glare`, `.monitor-plate` (içinde LED + "CATHODE 5100"). Hepsi aria-hidden, her zaman render (görünürlük CSS `data-monitor`).
- [ ] **Step 2:** `BootScreen.tsx` v2 — POST sekansı (~2.4s, tıkla atla, reduced→anında onDone):
  sol hizalı mono kolon: `Cathode Systems 5100` / `phosphor bios v2.0` → `memory test: NNNN K` count-up (interval 24ms, 640→8192, "ok") → 3 probe satırı (`phosphor display`/`window manager`/`mounting shell` … ok, 240ms arayla) → blink cursor `_` → merkezde `CathodeMark` + "Cathode" bloom (scale 0.92→1 + glow) → hairline progress → onDone.
- [ ] **Step 3:** `page.tsx`: `BOOT_KEY` importu `lib/layout`'tan; boot bitişinde Desktop'a CRT açılış animasyonu: motion.div wrapper `initial={{scaleY:0.004, opacity:0.6, filter:"brightness(3)"}}` → `{scaleY:1, opacity:1, filter:"brightness(1)"}` (0.45s, yalnız boot'tan geliyorsa + motion etkinse; `useMotionEnabled`).
- [ ] **Verify:** tsc + lint.

### Task 7: App restyle + cila + tam QA

**Files:**
- Modify: `src/components/apps/Settings.tsx` (yeniden yazım — sidebar), `src/components/apps/About.tsx` (spec-sheet), `src/components/apps/Systems.tsx`, `src/components/apps/Games.tsx`, `src/components/apps/Notepad.tsx` (hafif), `src/components/ui/Segmented.tsx`, `src/components/ui/Toggle.tsx`, `src/components/ui/Button.tsx` (radius/renk uyumu), `src/data/apps.ts` (Settings defaultSize 640×520, minSize 520×400), `src/app/opengraph-image.tsx`

- [ ] **Step 1:** `Settings.tsx` sidebar düzeni: sol 148px (`surface-0`, kategori butonları `Icon palette/crt/image/system` + mono etiket: görünüm · efektler · duvar kâğıdı · sistem), sağ içerik panel. görünüm: accent Segmented; efektler: CRT, monitör modu, hareket, sesler Toggle'ları; duvar kâğıdı: seçenek kartları (mini önizleme kutusu + ad) + photo shuffle; sistem: sürüm satırları mono + "boot'u tekrar oynat" butonu + "ayarlar tarayıcında · sunucu yok" notu.
- [ ] **Step 2:** `About.tsx`: üstte CathodeMark + wordmark + TR/EN anahtar (korunur); orta: mono spec-sheet tablosu (`shell / cathode workstation v2`, `render / phosphor crt`, `emülasyon / v86 · js-dos (wasm)`, `veri / localStorage · OPFS — sunucu yok`); gövde + disclaimer paneli (`surface-0`, `warn` başlıklı) korunur.
- [ ] **Step 3:** `Systems.tsx`/`Games.tsx`: kart glyph'leri → `AppIcon size 20` (`os-${id}`/`game-${id}`); ⊕/✦ → `Icon upload`; kartlar `surface-0` + hairline + `rounded-ui`; buton `rounded-btn`. `Notepad`: durum çubuğu `text-faint`, kaydediliyor `text-warn`.
- [ ] **Step 4:** `Toggle/Segmented/Button`: radius token'ları (`rounded-btn`/`rounded-ui`), `bg-black/30` → `bg-surface-0`, kalan renk uyumu.
- [ ] **Step 5:** `opengraph-image.tsx`: workstation kart — koyu zemin + grille çizgileri + monitör çerçeveli "Cathode" wordmark + mono alt satır (inline style, edge runtime uyumlu kalır).
- [ ] **Step 6:** Süpürme: `grep -rn "◉\|▢\|✕\|⊕\|✦\|phosphor text-\|bg-glass" src/` → kalan eski desen bilinçli mi kontrol; `glyph` yalnız data alanı olarak kalır (UI'da kullanılmaz).
- [ ] **Step 7 (final doğrulama):** `npm run lint` + `npx tsc --noEmit` + `npm run build` temiz; `npm run dev` + headless tarayıcı: boot POST → masaüstü bloom → SystemBar menü → pencere aç/sürükle/max (SystemBar altında kalır) → Settings tüm toggle'lar → monitör modu aç (bezel+LED) → duvar kâğıdı 5'i de → yenile→ayar kalıcı → FreeDOS penceresi açılıyor → mobil viewport bozulmuyor.

## Self-review notları

- Spec kapsama: §4.1→T1, §4.2→T1/T3, §4.3→T2, §4.4→T3, §4.5→T5, §4.6→T4, §4.7→T1+T6, §4.8→T6, §4.9→T7, §5 store→T4, §6 kenarlar→T4 (migrate) + T1 (mobil CSS) + T7 QA. Boşluk yok.
- Tip tutarlılığı: IconName/SYSTEM_BAR_H/BOOT_KEY/MenuItem.icon tek yerde tanımlı, tüketiciler listelendi.
- Commit adımı bilinçli YOK (CLAUDE.md mutlak kuralı); her task sonu derlenebilir checkpoint.

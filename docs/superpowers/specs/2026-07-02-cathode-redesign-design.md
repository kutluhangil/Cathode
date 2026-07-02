# Cathode görsel yeniden tasarım — "Cathode Workstation" tasarım dili (v2)

> Tarih: 2026-07-02 · Durum: **Kutluhan onayı bekliyor** · Kapsam: yalnız görsel/tasarım katmanı
> Talep: "Tüm tasarımı sıfırdan, bir üst seviye, daha gerçekçi ve profesyonel."

## 1. Amaç ve başarı ölçütü

Mevcut "Obsidian Cathode" tasarımı temiz ama jenerik: cam pencereler, metin-glif ikonlar (◉),
overlay scanline'lar. "Herhangi bir modern dark UI" gibi duruyor; gerçek bir işletim sistemi
gibi durmuyor.

**Hedef:** Cathode'un, hayali bir premium workstation üreticisinin ("Cathode Systems", ~1989)
gerçekten üretmiş olabileceği, inandırıcı ve eksiksiz bir OS gibi görünmesi — ve bu OS'in
gerçekçi bir CRT monitörde çalışıyormuş gibi sunulması.

**Başarı ölçütü:**
- İlk bakışta "bu gerçek bir işletim sistemi" hissi (tutarlı ikon seti, sistem çubuğu, tutarlı chrome).
- CRT efektleri overlay hilesi değil, fiziksel monitör hissi (bezel, fosfor bloom, kavis).
- Tüm mevcut işlevsellik korunur (pencere yönetimi, emülatör, PWA, ayar kalıcılığı).
- Lint temiz, build çalışır, AA kontrast, `prefers-reduced-motion` tam saygı.

## 2. Kapsam sınırı

**Yeniden yazılır (görsel katman):** `globals.css`, `tailwind.config.ts` token bağları,
`components/ui/*`, `components/icons/*` (yeni), pencere chrome görselleri (`TitleBar`,
`Window` stilleri), `desktop/*` (Wallpaper, DesktopIcon, ContextMenu), `dock/*`
(+ yeni `SystemBar`), `boot/BootScreen`, `apps/*` iç stilleri, `settingsStore`'a yeni
görsel toggle'lar.

**Dokunulmaz (mantık katmanı):** `windowsStore`, drag/resize mantığı (`useWindowDrag`,
`ResizeHandles` davranışı), emülatör entegrasyonu (`v86Engine`, js-dos), PWA/service worker,
`persist.ts`, `data/*` kayıt defterleri (yalnız ikon alanları güncellenir).

Gerekçe: kanıtlanmış pencere yöneticisi mantığını yeniden yazmak risk getirir, görsel hedefe
katkısı sıfır. "Sıfırdan tasarım" = tasarım katmanı sıfırdan; mantık değil.

## 3. Değerlendirilen yaklaşımlar

| | Yaklaşım | Artı | Eksi |
|---|---|---|---|
| **A (seçilen)** | İnandırıcı OS dili + fiziksel CRT sunumu | "Bir üst seviye" hedefini tam karşılar; iki katmanlı konsept (spec §0) ile birebir örtüşür | En büyük iş; fazlara bölünmeli |
| B | Yalnız OS dili (ikon seti, chrome, boot) — CRT overlay kalır | Daha küçük iş, hızlı teslim | "Daha gerçekçi" talebinin monitör yarısı eksik kalır |
| C | Yalnız fiziksel CRT sunumu — iç UI hafif rötuş | Etkileyici ilk izlenim | İçerideki jenerik UI aynı kalır; profesyonellik artmaz |

**Karar: A.** Kutluhan'ın sorusuna yanıt alınamadığı için önerilen seçenekle ilerlendi;
inceleme sırasında B veya C'ye daraltılabilir.

## 4. Tasarım dili — "Cathode Workstation"

Kurgu: NeXT/SGI ayarında hayali üretici **Cathode Systems**, 1989'da kendi grafik OS'ini
("Cathode OS") ve monitörünü ("Cathode 5100") üretti. Site bu donanım+yazılımın modern,
aslına saygılı canlandırması. Retro-kopya değil; "alternatif zaman çizgisinden premium ürün".

### 4.1 Renk token'ları (v2)

```css
:root {
  /* Zemin katmanları — elevation ölçeği */
  --bg-void:    #050506;
  --bg-desk:    #0a0a0d;
  --surface-0:  #0e0e12;   /* çökük paneller, input zemini */
  --surface-1:  #14141a;   /* pencere gövdesi (OPAK — cam yok) */
  --surface-2:  #1a1a21;   /* yükseltilmiş: menü, dropdown */
  --surface-3:  #22222a;   /* hover/aktif satır */

  /* Çizgiler + kenar işçiliği */
  --line-hair:   #24242c;
  --line-strong: #32323c;
  --edge-light:  rgba(255,255,255,0.055); /* üst kenar 1px içsel highlight — "machined edge" */

  /* Metin — 3 kademeli hiyerarşi */
  --text-1: #ECE8DE;
  --text-2: #A6A29A;
  --text-3: #6D6A64;

  /* Accent — amber P3 fosfor (varsayılan) */
  --accent:      #FFB000;
  --accent-dim:  #B87F0A;
  --accent-glow: rgba(255,176,0,0.32);
  --accent-ink:  #1a1206;

  /* Semantik durumlar — fosfor tonları */
  --ok:     #2BD96A;
  --warn:   #FFB000;
  --danger: #FF4D3D;

  /* Derinlik */
  --shadow-win:   0 1px 0 var(--edge-light) inset, 0 16px 48px -12px rgba(0,0,0,0.8), 0 0 0 1px var(--line-hair);
  --shadow-float: 0 8px 32px -8px rgba(0,0,0,0.7), 0 0 0 1px var(--line-hair);

  /* Köşeler — donanım hissi: küçük radius */
  --radius-win: 8px;
  --radius-ui:  6px;
  --radius-btn: 4px;
}
:root[data-accent="green"] {
  --accent: #33E86C; --accent-dim: #1E9A47;
  --accent-glow: rgba(51,232,108,0.28); --accent-ink: #04140a;
}
```

Mevcut tasarımdan farklar: cam gövde → **opak pencere** (gerçek OS'ler opak; cam yalnız
sistem katmanlarında: menüler, dock), tek `--surface` → 4 kademeli elevation, tek border →
hair/strong + `--edge-light` içsel highlight, semantik durum renkleri eklendi, radius
12px → 8px (donanım hissi).

### 4.2 Tipografi

- **Sistem chrome'u mono:** title bar başlıkları, sistem çubuğu, saat, boot, menü kısayolları
  → `Geist Mono`. Workstation kimliği monodan gelir.
- **İçerik sans:** app içerikleri, paragraflar → `Geist Sans`.
- Sentence case kuralı korunur (spec §4). Yeni font dosyası eklenmez (mevcut Geist woff'lar yeter).

### 4.3 İkon sistemi (yeni — en yüksek kaldıraç)

`src/components/icons/` — el çizimi SVG seti, tek tutarlı dil:

- 24×24 viewBox, 1.5px stroke, `currentColor`, kare uçlar (teknik çizim hissi).
- Kapsam (~30 ikon): tüm app'ler (About, Settings, Notepad, Games, Systems, emülatör OS'leri),
  pencere kontrolleri (küçült/büyüt/geri yükle/kapat), context menu aksiyonları,
  Settings kategorileri, tray (accent, CRT, monitör, ses), sistem menüsü.
- Tek registry: `icons/index.tsx` → `<Icon name="settings" size={16} />`.
- Metin glifler (◉, −, ▢, ✕) ve emoji tamamen kalkar. Logo glifi ◉ yerine çizilmiş
  Cathode markası (CRT ekran + ışın SVG'si).

### 4.4 Pencere chrome'u (v2)

- Gövde: `--surface-1` opak + çok hafif noise doku; `--shadow-win` (içsel üst highlight dahil).
- Title bar 32px: sol app ikonu (14px SVG) + mono başlık; sağda üç **kare makine-buton**
  (22px, `--radius-btn`, hover'da `--surface-3` dolgu; kapat hover'da `--danger`).
- **Aktif pencere:** title bar altında 1px accent çizgi + başlıkta hafif fosfor bloom;
  pasif pencere tümüyle sönük (`--text-3`, çizgi yok). Odak durumu bir bakışta okunur.
- Çift tık maximize, drag, 8 yön resize — davranış aynen korunur.

### 4.5 Masaüstü düzeni: sistem çubuğu + dock

"Gerçek OS" hissinin en büyük eksiği tek dock'tu. Yeni düzen:

- **Üst sistem çubuğu (28px, tam genişlik, cam):** solda Cathode logosu → sistem menüsü
  (hakkında / ayarlar / yeniden başlat = boot'u tekrar oynat); sağda tray: accent döngüsü,
  CRT toggle, monitör toggle, canlı saat (mono). Mevcut sağ-alt tray kaldırılır, buraya taşınır.
- **Alt dock:** yalnız uygulama başlatıcı/değiştirici olarak kalır (sabitler + açıklar,
  çalışan göstergesi, hover büyümesi). StartMenu dock'taki launcher'dan açılmaya devam eder.
- `ContextMenu` ve `StartMenu` `--surface-2` + `--shadow-float` + yeni ikonlarla yeniden stillenir.

### 4.6 Duvar kâğıtları (v2 — 4 yeni + photo korunur)

Synthwave "horizon" klişesi emekli edilir. Yeni set (hepsi kod-çizimi, accent'e duyarlı):

1. **phosphor** (varsayılan): koyu zemin, merkezden yayılan fosfor ışıma, çok ince aperture
   grille dokusu — "açık ama boş ekran" hissi.
2. **blueprint**: mühendislik şeması — Cathode 5100 monitörünün ince çizgi teknik çizimi,
   ölçü okları, mono etiketler.
3. **testcard**: özgün test kartı kompozisyonu (SMPTE kopyası değil — telif/klişe riski yok):
   fosfor tonlarında dikey bantlar + kalibrasyon işaretleri + "Cathode Systems" damgası.
4. **void**: saf minimal — radyal gradyan + grain, dikkat dağıtmaz.
5. **photo**: mevcut rastgele 4K foto modu aynen kalır (Unsplash → Picsum fallback).

`aurora`, `grid`, `monolith`, `horizon` kaldırılır; `settingsStore`'da eski değer görülürse
`phosphor`'a migrate edilir.

### 4.7 Fiziksel CRT sunum katmanı (v2 — gerçekçilik)

İki bağımsız ayar: **CRT efektleri** (fosfor görünümü) ve **Monitör modu** (fiziksel çerçeve).

**CRT efektleri** (`data-crt="on"`, varsayılan hafif açık):
- Overlay scanline → **aperture grille**: ince dikey fosfor şerit dokusu + yatay scanline,
  mono-fosfor mantığında (amber monitörler tek renkli fosfordu — otantik).
- **Bloom**: accent öğelerde katmanlı text-shadow; ekran geneli çok hafif kontrast artışı.
- Vinyet + grain kalır, yoğunlukları inceltilir.

**Monitör modu** (`data-monitor="on"`, varsayılan kapalı — yeni toggle):
- Ekran içeriği kavisli-köşeli maske içine alınır; dışında koyu plastik **bezel**:
  alt bantta baskı "Cathode 5100" + güç LED'i (accent, nefes animasyonu).
- Cam yansıması: üst köşeden tek diyagonal highlight gradyanı (statik, ucuz).
- Barrel distortion **yapılmaz** (SVG feDisplacementMap tüm UI üstünde pahalı + tıklama
  ofseti riski). Kavis hissi maske + bezel + yansıma ile verilir. (Performans kararı.)
- Boot'a giriş/çıkışta **CRT collapse/bloom** animasyonu (yatay çizgiye çökme / açılma).

Hepsi Settings + sistem çubuğundan yönetilir; `prefers-reduced-motion` açıkken animasyonlu
kısımlar (LED nefesi, collapse) durur, statik görünüm kalır.

### 4.8 Boot ekranı (v2 — POST sekansı)

Gerçek donanım açılışı hissi (~2.2s, tıkla atla, reduced-motion'da atlanır — mevcut davranış):

```
Cathode Systems 5100 — phosphor bios v2.0
memory test: 640K ... 8192K ok        ← sayaç animasyonu
phosphor display .............. ok
window manager ................ ok
mounting shell ................ ok
_                                      ← blink cursor
```

Ardından CRT bloom-in ile masaüstü. Logo animasyonu yeni SVG marka ile.

### 4.9 Sistem app'leri restyle

- **Settings**: sol ikonlu sidebar (görünüm / efektler / duvar kâğıdı / sistem) — gerçek OS
  ayar paneli düzeni. Yeni toggle: monitör modu.
- **About**: "sistem spec sheet" görünümü — donanım künyesi gibi mono tablolar + disclaimer
  (TR/EN, aynen korunur).
- Notepad, Games, Systems: yeni token + ikonlarla uyumlanır; iç mantık aynı.

## 5. Veri akışı / durum

- `settingsStore`: `monitor: boolean` eklenir; `wallpaper` union'ı yeni isimlerle güncellenir
  (eski localStorage değerleri `phosphor`'a düşer). Diğer alanlar (accent, crt, motion) aynı.
- Token'lar CSS değişkeni olarak kalır; Tailwind bağları güncellenir (`surface-0..3`,
  `text-1..3`, `line-*`, semantic renkler).
- CRT/monitor katmanları `layout.tsx`'te her zaman render, görünürlük CSS'te (mevcut desen).

## 6. Hata durumları / kenarlar

- Eski localStorage ayarı (kalkan wallpaper adları) → varsayılana migrate, crash yok.
- `backdrop-filter` desteklemeyen tarayıcı → cam katmanlar opak `--surface-2`'ye düşer.
- Mobil: sistem çubuğu + dock sığar; monitör modu mobilde otomatik kapalı (ekran alanı).
- Emülatör penceresi: canvas içeriğine CRT overlay uygulanmaz (emüle OS zaten kendi
  görüntüsünü verir; çift efekt okunabilirliği bozar) — overlay z-index'i pencere altında değil
  üstünde olduğundan yoğunluklar emülatör açıkken de okunabilirliği bozmayacak kadar düşük tutulur.

## 7. Test / doğrulama

- `npm run lint` + `npm run build` temiz.
- Manuel akış: boot → masaüstü → pencere aç/sürükle/resize/max/min → settings'ten her
  toggle → yenile → ayar kalıcı → emülatör penceresi açılıyor.
- Kontrast: `--text-2`/`--surface-1` ve accent kombinasyonları AA.
- `prefers-reduced-motion` emülasyonuyla animasyonsuz akış.
- Mobil viewport'ta bozulma yok.

## 8. Uygulama fazları (writing-plans'e girdi)

1. **Temel**: token v2 (`globals.css` yeniden) + Tailwind bağları + tipografi rolleri.
2. **İkon sistemi**: `components/icons/` + registry; glif/emoji temizliği.
3. **Chrome**: pencere + title bar + kontroller; aktif/pasif durumlar.
4. **Sistem katmanı**: SystemBar (yeni) + Dock sadeleşmesi + StartMenu/ContextMenu restyle.
5. **Duvar kâğıtları v2** + settingsStore migrate.
6. **CRT + monitör modu** + boot v2 + collapse/bloom animasyonları.
7. **App restyle** (Settings sidebar, About spec-sheet) + cila + a11y/mobil doğrulama.

Her faz sonunda çalışır durum; Kutluhan commit eder (CLAUDE.md gereği Claude commit atmaz).

## 9. Açık sorular (inceleme için)

- Yön varsayımı (A) doğru mu, yoksa B/C'ye daraltılsın mı?
- Varsayılan duvar kâğıdı `phosphor` uygun mu?
- Sistem çubuğu (üst bar) onayı — masaüstü metaforunu mac-vari yapar; istenmezse tray dock'ta kalır.
- Monitör modu varsayılanı: kapalı (önerilen) mı, açık mı?

# Cathode

Tarayıcıda çalışan, özgün tasarımlı retro işletim sistemi kabuğu. Login yok, reklam
yok, veri toplama yok — her şey senin tarayıcında, client-side ve izole çalışır.

**İki katman:**
- **Kabuk (shell)** — tamamen özgün "Obsidian Cathode" işletim sistemi arayüzü: boot
  ekranı, masaüstü, pencere yöneticisi, dock, uygulamalar. Bu, sitenin markası.
- **Emülasyon** — gerçek eski sistemler (KolibriOS gömülü; ReactOS/FreeDOS/Win9x/2000
  R2'den) bir pencere içinde, WebAssembly emülatörü (v86) ve DOS için js-dos ile.
  Emüle edilen sistem modern makineye erişemez; internete de bağlı değildir.

## Stack

Next.js 14 (App Router) · TypeScript (strict) · Tailwind CSS · Framer Motion ·
Zustand · PWA (`@serwist/next`) · v86 (WASM x86) · js-dos v8 (DOSBox-X).

## Geliştirme

```sh
npm install         # postinstall → emülatör binary'lerini public/'e hazırlar
npm run dev         # http://localhost:3000
```

Emülatör binary'leri (v86 wasm, BIOS, js-dos, KolibriOS) git'e gömülmez;
`npm run setup:emu` ile üretilir (idempotent). Kaynaklar: `node_modules` + serbest
imaj indirmesi.

```sh
npm run build       # production
npm run lint
```

## Deploy

Docker (standalone) → Ubuntu → nginx → Cloudflare Tunnel. Büyük imajlar R2'de.

```sh
docker build -t cathode .
docker run -p 3000:3000 cathode
```

- `deploy/nginx.conf` — reverse proxy, WASM MIME, range request, COOP/COEP korunur.
- `deploy/R2.md` — disk imajı barındırma + kayıt defteri güncelleme.

> **Önemli:** Emülatör (SharedArrayBuffer) için `Cross-Origin-Opener-Policy: same-origin`
> ve `Cross-Origin-Embedder-Policy: require-corp` header'ları HTTPS altında sunulmalı.
> Bunlar `next.config.mjs`'te tanımlı; ara katmanlar strip etmemeli.

## Klasör yapısı

```
src/
  app/            layout, page (boot→masaüstü), globals.css (token + CRT), sw.ts, og
  components/     boot · desktop · window · dock · apps (About/Settings/Notepad/
                  Systems/Games + emulator) · ui
  store/          windowsStore · settingsStore (localStorage persist)
  lib/            motion · cn · pwa · persist (OPFS) · emu/v86Engine
  data/           apps · os (v86 kataloğu) · games (js-dos kataloğu)
public/           icons · wallpapers · (setup:emu) v86 · jsdos · images
deploy/           nginx.conf · R2.md
```

## Ayarlar (kalıcı, localStorage)

Accent (amber ↔ fosfor yeşil), CRT efektleri (scanline/vignette/grain/glow),
hareket (`prefers-reduced-motion` saygılı), duvar kâğıdı, arayüz sesleri.

## Yasal / içerik politikası

Cathode bir hobi/eğitim/dijital koruma projesidir. Emülasyon motorları açık kaynaktır.
Eski işletim sistemleri telif sahiplerine aittir ve yalnızca arşiv/nostalji amacıyla,
tarayıcıda izole biçimde çalıştırılır. Telif sahibi talep ederse ilgili içerik kaldırılır.
Bu site reklam içermez, ticari amaç gütmez. **Windows XP gömülmez**; telifli sürümler
yalnızca kullanıcının kendi yüklediği imajla (BYOI) çalışır.

## Teşekkürler

- [v86](https://github.com/copy/v86) — tarayıcıda x86 emülasyonu (WASM).
- [js-dos](https://js-dos.com) — DOSBox-X tabanlı DOS emülatörü.
- [ReactOS](https://reactos.org), [KolibriOS](https://kolibrios.org),
  [FreeDOS](https://freedos.org) — açık kaynak işletim sistemleri.
- [SeaBIOS](https://www.seabios.org) — açık kaynak BIOS.

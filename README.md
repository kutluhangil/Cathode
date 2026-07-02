<div align="center">

<br />

<img src="https://img.shields.io/badge/Cathode-v0.1.0-f59e0b?style=for-the-badge&logoColor=white" alt="version" />
<img src="https://img.shields.io/badge/Built_with-TypeScript-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="typescript" />
<img src="https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="nextjs" />
<img src="https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=black" alt="react" />
<img src="https://img.shields.io/badge/TailwindCSS-3-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="tailwind" />
<img src="https://img.shields.io/badge/Zustand-state-443e38?style=for-the-badge&logoColor=white" alt="zustand" />
<img src="https://img.shields.io/badge/v86-WASM_x86-6e40c9?style=for-the-badge&logoColor=white" alt="v86" />
<img src="https://img.shields.io/badge/js--dos-DOSBox--X-2a75bb?style=for-the-badge&logoColor=white" alt="js-dos" />
<img src="https://img.shields.io/badge/PWA-offline_ready-5a0fc8?style=for-the-badge&logo=pwa&logoColor=white" alt="pwa" />
<img src="https://img.shields.io/badge/Privacy--First-no_login_no_tracking-22c55e?style=for-the-badge&logoColor=white" alt="privacy" />

<br /><br />

```
   ▄████████    ▄████████     ███        ▄█    █▄     ▄██████▄  ████████▄     ▄████████
  ███    ███   ███    ███ ▀█████████▄   ███    ███   ███    ███ ███   ▀███   ███    ███
  ███    █▀    ███    ███    ▀███▀▀██   ███    ███   ███    ███ ███    ███   ███    █▀
 ▄███▄▄▄       ███    ███     ███   ▀  ▄███▄▄▄▄███▄▄ ███    ███ ███    ███   ███
▀▀███▀▀▀     ▀███████████     ███     ▀▀███▀▀▀▀███▀  ███    ███ ███    ███ ▀███████████
  ███    █▄    ███    ███     ███       ███    ███   ███    ███ ███    ███          ███
  ███    ███   ███    ███     ███       ███    ███   ███    ███ ███   ▄███    ▄█    ███
  ██████████   ███    █▀     ▄████▀     ███    █▀     ▀██████▀  ████████▀   ▄████████▀
```

### **A browser-native retro OS shell** — bespoke desktop chrome meets real x86 emulation, with zero login and zero tracking.

[Report Bug](https://github.com/kutluhangil/Cathode/issues) · [Request Feature](https://github.com/kutluhangil/Cathode/issues)

</div>

---

## 🇹🇷 Türkçe Açıklama

**Cathode**, tarayıcıda çalışan, tamamen özgün tasarımlı bir retro işletim sistemi kabuğudur. İki katmandan oluşur: **kabuk** — boot ekranı, masaüstü, pencere yöneticisi, dock ve dahili uygulamalarla (Terminal, Not Defteri, Ayarlar, Sistemler, Oyunlar) kendine ait "Obsidian Cathode" arayüzü — ve **emülasyon** — WebAssembly tabanlı v86 ile gerçek eski işletim sistemlerini (KolibriOS, FreeDOS, ReactOS) ve js-dos (DOSBox-X) ile klasik DOS oyunlarını bir pencere içinde çalıştırma katmanı. Emüle edilen sistemler internete bağlı değildir ve modern makineye erişemez — tamamen izole sanal donanımda çalışır. Login yok, veritabanı yok, analytics yok, reklam yok; tüm ayarlar (tema, CRT efektleri, duvar kâğıdı, ses) yalnızca tarayıcının `localStorage`'ında tutulur. Progressive Web App olarak offline çalışabilir, telifli sistemler (örn. Windows) sitede barındırılmaz — yalnızca kullanıcının kendi yüklediği imajla (BYOI) açılır.

---

## ✦ What is Cathode?

**Cathode** is a fully bespoke retro operating-system shell that runs entirely in your browser. It's not a UI wrapper around someone else's design — the boot sequence, desktop, window manager, dock, and built-in apps are an original interface called **"Obsidian Cathode."**

Underneath, real legacy systems run in emulated hardware: **v86** boots a genuine x86 machine over WebAssembly (KolibriOS, FreeDOS, ReactOS), and **js-dos** (DOSBox-X) runs classic DOS software — both fully sandboxed, with no network access to the host machine or the internet. No accounts, no server-side state, no analytics. Everything — theme, CRT effects, wallpaper, sound — persists locally via `localStorage`, and the app installs as an offline-capable PWA.

---

## ⚡ Features

| Feature | Description |
|--------|-------------|
| 🖥️ **Obsidian Cathode Shell** | Original boot screen, desktop, draggable/resizable window manager, dock, and start menu |
| ⌨️ **Terminal** | Built-in shell app — control the OS with commands (`open`, `wallpaper`, `accent`, `crt`, `monitor`, `reboot`, ...) |
| 🔎 **Command Palette** | `Cmd/Ctrl+K` fuzzy search to launch any app or system action instantly |
| 🪟 **Window Manager** | Drag, resize, snap-to-edge (half-screen), and `Alt+Tab` window switcher |
| 🎛️ **Live Settings** | Amber ↔ phosphor-green accent, CRT scanline/vignette/grain/glow, physical "Cathode 5100" monitor bezel, motion toggle (`prefers-reduced-motion` aware) |
| 🌌 **Screensaver** | Phosphor-style bouncing mark after 3 minutes idle, auto-disabled if animations are off |
| 🔊 **UI Sound Engine** | WebAudio-synthesized open/close/toggle/error cues — no audio files, generated on the fly |
| 🧩 **App Suite** | Notepad (persistent notes), Settings, About, Systems catalog, Games catalog — all native windows |
| 💾 **Real x86 Emulation** | v86 (WASM) boots KolibriOS and FreeDOS out of the box; ReactOS and others ship "coming soon" pending image hosting |
| 🕹️ **DOS Gaming (js-dos)** | DOSBox-X in the browser for classic, freely-licensed DOS software and games |
| 📦 **BYOI / BYOG** | Bring Your Own Image — load your own disk image or `.jsdos` bundle; copyrighted systems (e.g. Windows) are never bundled |
| 📱 **Installable PWA** | Offline app shell via `@serwist/next` service worker — install to home screen or desktop |
| 🔒 **Privacy-First** | No login, no database, no payments, no analytics — every byte of state stays in your browser |

---

## 🖼️ Screenshots

> Coming soon — drop images in `docs/screenshots/` and reference them here.

---

## 🛠️ Tech Stack

```
Shell        →  Next.js 14 (App Router) · TypeScript (strict) · Tailwind CSS · Framer Motion
State        →  Zustand (localStorage-persisted settings + window state)
Emulation    →  v86 (WASM x86) · js-dos 8 (DOSBox-X)
Audio        →  Web Audio API — synthesized UI sound effects, no audio assets
PWA          →  @serwist/next (Serwist) — offline app shell, installable
Persistence  →  Browser-only — localStorage + OPFS, zero server-side state
Deployment   →  Docker (standalone) → Ubuntu → nginx → Cloudflare Tunnel · large images on R2
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js `>= 18`

### Local Development

```bash
# Clone the repository
git clone https://github.com/kutluhangil/Cathode.git
cd Cathode

# Install dependencies (postinstall prepares emulator binaries into public/)
npm install

# Start the dev server (runs on http://localhost:3000)
npm run dev
```

Emulator binaries (v86 WASM, BIOS, js-dos, KolibriOS) are **not committed to git** —
`npm run setup:emu` (run automatically via `postinstall`) generates them idempotently
from `node_modules` plus free-license image downloads.

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Next.js dev server on `localhost:3000` |
| `npm run build` | Production build (`output: standalone`) |
| `npm run start` | Serve the production build |
| `npm run lint` | Lint the codebase with ESLint |
| `npm run setup:emu` | Regenerate emulator binaries into `public/` (idempotent) |

---

## ☁️ Deployment

Cathode ships as a self-hosted **Docker** image — no serverless platform required
(the v86 emulator needs `SharedArrayBuffer`, which needs strict cross-origin headers
that are easiest to guarantee behind your own reverse proxy).

```bash
docker build -t cathode .
docker run -p 3000:3000 cathode
```

- `deploy/nginx.conf` — reverse proxy config: WASM MIME type, HTTP range requests
  (for streamed disk images), and COOP/COEP headers preserved.
- `deploy/R2.md` — hosting large disk images on Cloudflare R2 + registry updates.

> **Important:** the emulator requires `Cross-Origin-Opener-Policy: same-origin` and
> `Cross-Origin-Embedder-Policy: credentialless` to be served over HTTPS. These are
> set in `next.config.mjs` — any proxy in front of the app must not strip them.

---

## 📐 Project Structure

```
cathode/
├── src/
│   ├── app/                       # layout, page (boot → desktop), globals.css, sw.ts
│   ├── components/
│   │   ├── boot/                  # BootScreen
│   │   ├── desktop/                # Desktop, Wallpaper, CommandPalette, Screensaver, ContextMenu
│   │   ├── window/                 # Window, WindowManager, TitleBar, ResizeHandles, WindowSwitcher
│   │   ├── dock/                   # Dock, StartMenu, SystemBar, Clock
│   │   ├── apps/                   # About, Settings, Notepad, Terminal, Systems, Games
│   │   │   └── emulator/           # LazyEmulator (v86), LazyJsDos, EmulatorWindow, JsDosScreen
│   │   └── ui/                     # Button, Toggle, Segmented, AppIcon
│   ├── store/                      # windowsStore, settingsStore (Zustand + localStorage persist)
│   ├── lib/                        # motion, cn, pwa, persist (OPFS), sound, emu/v86Engine
│   └── data/                       # apps (registry), os (v86 catalog), games (js-dos catalog)
├── public/                          # icons, wallpapers, (setup:emu →) v86, js-dos, images
├── deploy/                          # nginx.conf, R2.md
└── CATHODE_BUILD_SPEC.md            # phased build spec this project was implemented against
```

---

## 📊 How It Works

### The Shell
Boot screen plays once, then hands off to the desktop. Every window, the dock, and
the start menu are driven by a single `windowsStore` (Zustand) — opening an app from
any entry point (desktop icon, dock, start menu, or Command Palette) pushes the same
window state. Settings (`accent`, `crt`, `monitor`, `motion`, `sound`, `screensaver`,
`wallpaper`) live in `settingsStore` and persist to `localStorage` across sessions.

### Emulation
Each OS/game in the catalog (`src/data/os.ts`, `src/data/games.ts`) declares its own
engine, disk drive, memory profile, and image source. Enabled entries render as real
desktop apps; disabled ones show as "coming soon" until their image is hosted. Large
images stream via HTTP range requests from Cloudflare R2 so the app itself stays light.

### Legal Boundary
No copyrighted OS images (e.g. Windows) are ever bundled or hosted by Cathode. Where
a "Windows-flavored" card exists in the catalog, it only launches using an image the
user supplies themselves (BYOI) — Cathode just provides the matching hardware profile.

---

## 🗺️ Roadmap

| Status | Feature |
|:-:|---|
| ✅ | Boot screen, desktop, window manager, dock, start menu |
| ✅ | Terminal, Command Palette, Window Switcher, Screensaver |
| ✅ | v86 integration — KolibriOS + FreeDOS bundled |
| ✅ | js-dos integration for DOS software |
| ✅ | BYOI / BYOG (bring your own disk image or game bundle) |
| ✅ | PWA — installable, offline app shell |
| 🔄 | ReactOS and additional OS images hosted on R2 |
| 🔄 | Free/shareware DOS game catalog population |
| ○ | Multi-window emulator instances |
| ○ | Custom typography + boot sequence polish pass |

<sub>✅ Shipped &nbsp; · &nbsp; 🔄 In progress &nbsp; · &nbsp; ○ Planned</sub>

---

## ⚖️ Legal / Content Policy

Cathode is a hobby / educational / digital-preservation project. All emulation engines
are open source. Legacy operating systems belong to their respective copyright holders
and are run **only** for archival/nostalgia purposes, fully sandboxed in the browser.
Content is removed on request from a rights holder. This site carries no ads and has
no commercial purpose. **Windows is never bundled** — copyrighted images run only via
a user-supplied disk image (BYOI).

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

> KolibriOS, FreeDOS, and ReactOS are trademarks of their respective projects. This is
> an independent hobby project, not affiliated with or endorsed by any of them.

---

## 🙏 Acknowledgements

- [v86](https://github.com/copy/v86) — x86 emulation in the browser (WASM).
- [js-dos](https://js-dos.com) — DOSBox-X based DOS emulator.
- [ReactOS](https://reactos.org), [KolibriOS](https://kolibrios.org), [FreeDOS](https://freedos.org) — open-source operating systems.
- [SeaBIOS](https://www.seabios.org) — open-source BIOS.

---

<div align="center">

<br />

Built by [**Kutluhan Gil**](https://github.com/kutluhangil)

<br />

*If you find this useful, consider giving it a ⭐*

<br />

</div>

# Epic D + F — Emulation Depth (code) + Showcase Implementation Plan

> Program order E → A → B → C → **D** → **F**. E/A/B/C done. User delegated full
> completion. D's asset-hosting items (R2 OS images, DOS game bundles) are external —
> they need credentials + freely-licensed binaries not in the repo; the code path is
> made ready and the hosting steps documented, but actual assets are the user's to host.

## Epic D — Emulation depth (code-complete portion)

### D1 — Single-instance emulator apps
- Add `singleton?: boolean` to `AppDefinition`. Set `true` on generated `os-*` and
  `game-*` apps (heavy VMs; also avoids two windows sharing one `v86-<os.id>` session).
- `windowsStore.launch(appId, title, size, props?, singleton?)`: if `singleton` and a
  window for `appId` exists, focus it; else `open`. Route Desktop icon open and Command
  Palette through it (dock already single-instances via `toggleFromDock`).

### D2 — Multi-window performance warning
- Different OSes open independently (already work). When **≥2** emulator/game windows are
  open at once, show a dismissible perf-warning banner (`DesktopFiles`-style overlay or a
  small component reading `windowsStore` + `getApp().capturesKeyboard`).

### D3 — External (documented, not implemented)
- R2 hosting of ReactOS + additional OS images and DOS game bundles: update
  `deploy/` doc with the exact upload + registry-enable steps. Catalog already renders
  "coming soon" for `enabled:false` entries — no code gap.

### D tests
- Two different emulators (`os-kolibri` + `os-freedos`) open concurrently (2 windows).
- Opening `os-kolibri` twice focuses the existing window (1 window).
- Perf warning appears when 2 emulator windows are open, hides at <2.

## Epic F — Showcase (code-complete)

### F1 — Theme variety
- Extend `AccentName` to `"amber" | "green" | "blue" | "white"`.
- Add `:root[data-accent="blue"]` and `[data-accent="white"]` CSS var blocks in
  `globals.css`.
- `settingsStore.toggleAccent` cycles through the 4 (SystemBar/palette use it).
- Settings accent control: switch the 2-option Segmented to a 4-swatch picker.
- Terminal `accent` command accepts the 4 names; Command Palette accent entry cycles.

### F2 — Easter eggs
- Terminal hidden commands (not in `help`): `credits` (v86 / js-dos / ReactOS thanks),
  `xyzzy` ("Nothing happens."), `neofetch` (ASCII mark + system line).
- Konami code (`↑↑↓↓←→←→ b a`) → a brief full-screen "phosphor overload" overlay with a
  retro message, auto-dismiss. A `useKonami` hook + overlay in `Desktop`.

### F3 — Screenshots
- A Playwright script (`e2e/screenshots.spec.ts`, tagged, run on demand) captures the
  desktop and a couple of apps into `docs/screenshots/*.png`.
- Update `README.md` Screenshots section to reference them.

### F tests
- Accent: terminal `accent blue` → `data-accent="blue"` on `<html>` + persists.
- Easter egg: terminal `xyzzy` prints "Nothing happens."; Konami sequence shows the
  overlay (`data-testid="konami"`).

## Constraints
- No git commit/branch by the agent — Kutluhan commits.
- TS strict; Turkish comments; no new deps; no silent fallbacks.
- e2e via `data-testid`; window-click tests use `reducedMotion` where geometry matters.
- Never define a React component inside another's render (Epic C lesson).

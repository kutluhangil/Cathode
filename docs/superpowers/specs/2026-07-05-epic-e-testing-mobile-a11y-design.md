# Epic E — Testing, Mobile, Accessibility (Design)

> Date: 2026-07-05
> Part of the Cathode post-Phase-3 improvement program.
> Program order agreed with Kutluhan: **E → A → B → C → D → F**.
> Each epic gets its own spec → plan → build cycle.

## Program context

Cathode is a browser-native retro OS shell (Next.js 14, TypeScript strict, Tailwind,
Framer Motion, Zustand). Phases 0–3 of `CATHODE_BUILD_SPEC.md` are effectively done:
shell, window manager, dock, terminal, command palette, v86, js-dos, PWA, TR/EN i18n.

The six-epic improvement program:

| Epic | Scope |
|------|-------|
| **A** | OPFS virtual filesystem + File Manager app + desktop-icon persistence |
| **B** | v86 save-state (sleep/resume) |
| **C** | Mini apps: Calculator, Paint, Image Viewer, (Music player) |
| **D** | Emulation depth: multi-window emulator, ReactOS + R2 hosting, DOS game catalog |
| **E** | **Testing + Mobile + a11y** — this spec |
| **F** | Showcase: screenshots, theme variety, easter eggs |

Epic E is first: it locks current window-manager behavior with a safety net before
later epics modify it.

## Goal

Three deliverables, one epic:

1. **Playwright e2e** covering critical shell flows.
2. **Mobile single-fullscreen-window mode** below a breakpoint.
3. **Practical accessibility baseline** — focus management, keyboard nav, ARIA roles.

Non-goals (YAGNI): Vitest unit layer, WCAG AA contrast audit, screen-reader flow
certification, axe-in-CI, touch drag/resize on mobile.

## Current state (verified against code)

- **Test tooling:** none. No `playwright.config`, no `test` script in `package.json`.
- **Mobile:** none. Only `window.innerWidth` clamping in `useWindowDrag.ts` and
  `spawnRect`/`maximizedRect` in `windowsStore.ts`. No matchMedia, no breakpoints in
  the window system. Pointer + desktop assumed.
- **a11y:** partial. ARIA present on `Toggle` (role=switch), `CommandPalette`
  (role=dialog), `BootScreen`, and `Window` already has `role="dialog"` + `aria-label`.
  Missing: focus trap / initial focus in windows, Esc-to-close, global focus-visible
  ring, roles on dock and desktop icons, WindowSwitcher listbox semantics.

## Architecture decision — mobile lives in the presentation layer

The window store (`src/store/windowsStore.ts`) stays unchanged. A `useIsMobile()` hook
(matchMedia `max-width: 767px`, SSR-safe) drives layout decisions in `WindowManager`
and `Window`. Rationale:

- Store rect/z/status logic is clean and already correct; no reason to pollute it with
  a display mode.
- `maximizedRect()` already computes from viewport, so fullscreen presentation needs no
  store change.
- The same store is exercised by e2e on both desktop and mobile viewports — one source
  of truth, tested once.

Rejected alternative: adding a `mode` field to the store. More surface area, no benefit.

## E1 — Playwright e2e

### Tooling
- Add `@playwright/test` as a devDependency (justification: the chosen test strategy).
- `playwright.config.ts`:
  - `webServer`: `npm run dev`, `url: http://localhost:3000`, `reuseExistingServer` in dev.
  - `baseURL: http://localhost:3000`.
  - Projects: chromium desktop (1280×800) + a mobile viewport (375×667) for E2 checks.
  - Traces on first retry.
- `e2e/` directory at repo root for specs and helpers.
- Scripts: `test:e2e` (`playwright test`), `test:e2e:ui` (`playwright test --ui`).

### Testing philosophy
Drive everything through the real UI (clicks, keys, assertions on DOM), never through
internal store state — `idSeq` is a module-global and not injectable, so UI-driven
tests are the robust choice and match the repo rule "integration/e2e over unit".

Tests must survive the boot sequence: a shared helper boots the app and skips/awaits the
boot screen before each flow.

### Critical flows (one spec file per group)
1. **Boot** — boot screen shows, transitions to desktop; skip click works; boot shown
   once per session.
2. **App lifecycle** — open an app (desktop double-click + dock), close, minimize,
   maximize (double-click title bar), restore; focus/z-order correct with two windows.
3. **Window manipulation** — drag by title bar moves window; resize handle changes size;
   snap-to-edge (half-screen) works; window stays within viewport bounds.
4. **Window switcher** — Alt+Tab cycles focus across open windows.
5. **Terminal** — `open notepad` opens the app; `accent <x>` and `crt` mutate settings.
6. **Settings persistence** — change accent → reload → value persists (localStorage).
7. **Command palette** — Cmd/Ctrl+K opens; fuzzy search launches an app / system action.

## E2 — Mobile single-fullscreen-window mode

- `src/lib/useIsMobile.ts` — matchMedia hook, `max-width: 767px`, SSR-safe (returns
  `false` on server, subscribes on mount).
- `WindowManager` on mobile: render only the `focusedId` window; if none focused but
  windows exist, show the top-z non-minimized one.
- `Window` on mobile: fullscreen (viewport minus system bar / dock reserve),
  `rounded-none`, no `ResizeHandles`, title bar drag disabled — keep close/minimize.
- Dock acts as the app switcher on mobile (existing `toggleFromDock` already fits).
- Desktop icon grid reflows vertically and fits small screens.
- `ContextMenu` (already viewport-clamped) and `CommandPalette` fit the viewport.
- No z-index race on mobile — a single window is visible at a time.

## E3 — Accessibility (practical baseline)

- **Focus management:** on window mount, move focus to the first focusable element (or
  the window container). Trap focus within the focused window (Tab cycles inside it).
- **Esc to close:** Esc closes the focused window — EXCEPT emulator windows, which
  capture the keyboard (guard by appId / a `capturesKeyboard` flag on the app def).
- **Focus-visible ring:** global `:focus-visible` outline in the phosphor accent color
  (`globals.css`), respecting the active accent.
- **ARIA roles:**
  - Dock → `role="toolbar"`, buttons labeled.
  - Desktop icons → `role="button"` + accessible name.
  - `WindowSwitcher` → `role="listbox"` with `option` children.
  - `Window` keeps its existing `role="dialog"` + `aria-label`.
- No `aria-live` regions (YAGNI for this pass).

## Definition of Done

- `npm run test:e2e` passes locally — all critical flows green on chromium desktop; the
  mobile project passes the mobile-specific checks.
- At 375px viewport: exactly one fullscreen window renders, no horizontal overflow,
  switching apps via the dock works, no drag/resize handles present.
- Keyboard: Tab cycles within the focused window, Esc closes it (non-emulator), the
  focus-visible ring is visible on interactive elements.
- Roles verified: dock/toolbar, desktop-icon/button, switcher/listbox, window/dialog.

## Files touched (anticipated)

- New: `playwright.config.ts`, `e2e/**`, `src/lib/useIsMobile.ts`.
- Edited: `package.json` (dep + scripts), `src/components/window/WindowManager.tsx`,
  `src/components/window/Window.tsx`, `src/components/window/TitleBar.tsx`,
  `src/components/window/WindowSwitcher.tsx`, `src/components/dock/Dock.tsx`,
  `src/components/desktop/Desktop.tsx`, `src/components/desktop/DesktopIcon.tsx`,
  `src/app/globals.css`, `src/data/apps.ts` (optional `capturesKeyboard` flag).

## Constraints

- No git commit / push / branch by the agent — Kutluhan commits (project CLAUDE.md).
- TypeScript strict; match existing style and TR-commented conventions.
- New dependency (`@playwright/test`) justified above per project rule.

# Epic B — Seamless v86 Auto Sleep/Resume (Design)

> Date: 2026-07-07
> Part of the Cathode post-Phase-3 improvement program (order: E → A → **B** → C → D → F).
> Epics E and A are complete. This is Epic B.

## Program context

Cathode runs real x86 systems via v86 (WASM) inside emulator windows. A **manual**
sleep/resume already exists (`EmulatorWindow.tsx`: Sleep/Resume/Drop/Download buttons
over `src/lib/persist.ts`, OPFS `cathode-states/`). Epic B makes it **seamless and
automatic** — save on close/minimize, resume on reopen — so an emulator behaves like a
real machine that remembers its state.

## Goal

1. **Auto-resume on open** — reopening an OS with a saved session restores it
   automatically (no manual click).
2. **Auto-save on close/minimize** — closing or minimizing an emulator window saves its
   running state automatically.
3. Extract the session orchestration into a small, testable module so the behavior is
   covered without a full v86 boot.

## Current state (verified against code)

- `EmulatorWindow.tsx` — manual `sleep()` (saveState → `writeState`), `resume()`
  (`readState` → restoreState), `dropSession()` (`deleteState`), `saveState()` (download
  to file); a "saved session" badge appears at phase `ready` when `hasState` is true.
- `src/lib/emu/v86Engine.ts` — `V86Engine` with `saveState()`, `restoreState()`,
  `restart()`, `destroy()`.
- `src/lib/persist.ts` — OPFS blob store in `cathode-states/`: `writeState`, `readState`,
  `hasState`, `deleteState` (keyed `<name>.bin`).
- `WindowManager` renders only `status !== "minimized"` windows → **minimizing an
  emulator unmounts it** (engine destroyed). Today that loses the running state.
- Enabled OS images present locally: `public/images/kolibri.img` (1.4 MB),
  `public/images/freedos722.img` (720 KB). COOP/COEP headers set in `next.config.mjs`.
- Emulator i18n keys exist (`emulator.sleep/resume/savedSession/drop/…`).

## Architecture decision

**Extract orchestration into `src/lib/emu/emuSession.ts` (pure, over `persist.ts`);
wire auto behavior in `EmulatorWindow`.** The module takes an injected engine interface
so its logic is testable with a fake engine — no v86 boot required. `persist.ts` is
unchanged.

Minimize is handled by the same auto-save/auto-resume path (minimized windows unmount).
Rejected alternative: keeping emulator windows mounted-but-hidden on minimize — a
background v86 VM drains CPU; destroy-and-resume is the better default.

## B1 — Session module (`src/lib/emu/emuSession.ts`)

```ts
export interface SessionEngine {
  saveState(): Promise<ArrayBuffer | null>;
  restoreState(state: ArrayBuffer): Promise<void>;
}

/** Save the engine's current state under key. Returns true on success. */
export async function saveSession(engine: SessionEngine, key: string): Promise<boolean>;

/** Restore a saved state into the engine. Returns true if a state existed and applied. */
export async function resumeSession(engine: SessionEngine, key: string): Promise<boolean>;

export async function hasSession(key: string): Promise<boolean>;
export async function dropSession(key: string): Promise<void>;
```
- Thin orchestration over `persist.ts` (`writeState`/`readState`/`hasState`/`deleteState`).
- `key` stays `v86-<os.id>` (matches current `stateKey`).
- No silent error masking beyond `persist.ts`'s existing OPFS-unsupported returns.

## B2 — Auto-resume on open

In `EmulatorWindow`:
- On mount, read `hasSession(stateKey)` into a `willResume` ref/flag.
- On `emulator-ready`, if `willResume` and not yet resumed, call
  `resumeSession(engine, stateKey)`; keep a `resuming` UI state true while it runs.
- The loading overlay shows a "resuming…" hint (`emulator.resuming`) during restore.
- Replaces the manual "saved session / resume" badge — resume is automatic.

## B3 — Auto-save on close/minimize

In `EmulatorWindow`'s effect cleanup (runs on close AND minimize, since both unmount):
- Track `reachedReady` (ref set true on first `ready`).
- If `reachedReady`, run `saveSession(engine, stateKey)` **before** `engine.destroy()`
  (async sequence capturing the engine from the effect closure).
- If never ready (closed mid-boot), just destroy — don't persist a half-booted state.
- Real browser-tab close is out of scope (async writes can't be guaranteed on unload);
  in-app close/minimize is covered.

## B4 — Controls

- **Remove** the manual "Sleep" button (auto handles it).
- **Keep** Reset, Download (export `.bin`), Fullscreen.
- Reset now also drops the saved session (so Reset = a clean reboot, not resume).
- **Add** "New session" (`emulator.newSession`): `dropSession` + `restart` — forces a
  fresh boot, bypassing auto-resume.

## Testing

Deterministic-first, matching Epic E/A conventions (`data-testid`, `window.*` bridges):

1. **`window.__persist` bridge** — expose `persist.ts` for a fast OPFS round-trip e2e:
   `writeState` → `readState` returns identical bytes; `hasState` true; `deleteState` →
   `hasState` false. No boot.
2. **`emuSession` with a fake engine** — via the same `window.__persist`/a
   `window.__emuSession` bridge and an in-test fake `SessionEngine`: `saveSession` writes,
   `resumeSession` restores the saved bytes into the fake, `hasSession`/`dropSession`
   behave. Deterministic, no boot.
3. **Real-boot smoke (one test, slower)** — open the KolibriOS emulator, wait for the
   ready indicator (long timeout), close the window, assert
   `cathode-states/v86-kolibri.bin` exists in OPFS (auto-save fired). If v86 fails to
   reach ready in headless within the timeout, the test fails loudly (no silent skip);
   should that prove flaky in this environment, it is removed and the feature rests on
   tests (1)+(2) plus manual verification — decided during implementation, logged in the
   plan, not silently dropped.

The emulator screen area gets a stable `data-testid` for the ready state so the smoke
test can wait without asserting canvas pixels.

## Definition of Done

- Close or minimize an emulator, reopen the same OS → it resumes automatically, no click.
- "New session" forces a fresh boot.
- Reset reboots clean (drops saved session).
- Tests (1) and (2) green; the smoke test green or explicitly removed-with-reason.
- `npx tsc --noEmit` and `npm run lint` clean; existing suite unaffected.

## Files (anticipated)

- New: `src/lib/emu/emuSession.ts`, `e2e/emu-session.spec.ts`.
- Modified: `src/lib/persist.ts` (add `window.__persist` test bridge),
  `src/components/apps/emulator/EmulatorWindow.tsx` (auto wire, control changes, ready
  testid), `src/lib/i18n/tr.ts` + `src/lib/i18n/en.ts` (`emulator.resuming`,
  `emulator.newSession`; the removed Sleep keys may remain unused).

## Constraints

- No git commit / push / branch by the agent — Kutluhan commits (project `CLAUDE.md`).
- TypeScript strict; match existing style and Turkish-comment convention.
- No silent fallbacks; no new runtime dependencies.
- Keep emulator isolation intact (no `net_device`, per existing v86 config).

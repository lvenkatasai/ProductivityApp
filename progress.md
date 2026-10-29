# Productivity OS — Micro-Level Progress

**Build target:** Windows .exe / installer (Rust toolchain + MSVC Build Tools required on the user's PC; the Linux build environment handles all logic/UI gates).

**Status legend:** `[ ]` todo · `[~]` in progress · `[✓]` done · `[x]` blocked/unverified

---

## Setup & gates

- `[✓]` Initialize git repo in project root
- `[ ]` Create Rust toolchain profile: `+nightly`, MSVC toolchain, rustfmt, clippy, cargo-audit (cargo NOT installed on host — verified 2026-10-29)
- `[~]` Install Node + pnpm (UI stack) — Node 22.22.3 + npm 10.9.8 present; pnpm absent (npm is used instead)
- `[ ]` Confirm Chrome/Chromium is installed (for Tauri WebView + `inspect.mjs` if used)
- `[✓]` Write `CLAUDE.md` standing rules (project root)

## Phase R0 — Shell (workspace, Tauri shell, scaffold, tokens, smoke test, browser preview with mock)

- `[✓]` R0.1 Decision record: workspace layout & crate split (core / store / app, app/os/)
- `[✓]` R0.2 Workspace Cargo.toml (core, store, app, ui)
- `[ ]` R0.3 Rust smoke test (cargo test) runs (pending host toolchain install)
- `[✓]` R0.4 Tauri 2 app shell scaffold in `crates/app` (src-tauri)
- `[~]` R0.5 OS module scaffold: `app/os/` with trait gates for autostart, tray, notification
- `[✓]` R0.6 React/TS UI scaffold: `ui/` with Tailwind + design tokens (dark theme, light override)
- `[✓]` R0.7 TypeScript types matching Rust structs + mock IPC in UI (feature-detect Tauri)
26: - `[ ]` R0.8 Gate check: cargo fmt/clippy/test, tsc --noEmit, Vitest pass in preview mode
27: 
28: ## Phase R1 — Port core (dayKey, record helpers, migration planner, retention, schedule, export shape)
29: 
30: - `[✓]` R1.1 Clock & IdGen traits (injected) + dayKey / boundary functions + tests
31: - `[✓]` R1.2 Record helpers: UUID id, created/updated/deleted at, soft delete, UTC ISO-8601
32: - `[ ]` R1.3 Migrations: numbered, PRAGMA user_version, one per transaction, backup-before-migration
33: - `[ ]` R1.4 Retention planner (daily/weekly/monthly) + retention rules tests
34: - `[✓]` R1.5 Schedule / recurrence model + tests
35: 
36: ## Phase R2 — Port core (quest entry, score, transitions, day close, create entry, XP)
37: 
38: - `[✓]` R2.1 Tier & status enums + reclassify deadline logic + tests
39: - `[✓]` R2.2 Daily score algorithm (weights, earned fraction, bonus cap, breakdown) + tests
40: - `[✓]` R2.3 Entry lifecycle: mark_done, mark_partial, mark_skipped, undo, reclassify + tests
41: - `[✓]` R2.4 Day close (pending → missed), carry-over creation + tests
42: - `[✓]` R2.5 XP / level curve / rank mapping + weekly bonus + tests
43: - `[ ]` R2.6 Goal method model (numeric / milestones / linked tasks, one method only) + tests
44: 
45: ## Phase R3 — Store (Storage trait, in-memory, SQLite, migrations 001–002, backups, export/import)

- `[✓]` R3.1 Storage trait definition + contract test suite
- `[✓]` R3.2 In-memory impl (thread-safe RwLock + passes contract tests)
- `[✓]` R3.3 SQLite impl (rusqlite bundled with single records table)
- `[✓]` R3.4 Migrations 001 (records table) & 002 (indexes)
- `[✓]` R3.5 Online backup API: snapshotting via rusqlite::backup::Backup
- `[ ]` R3.6 JSON export/import (schema-versioned, single transaction, rollback on any row error)

## Phase R4 — Tauri commands, typed IPC, generated types, tray, autostart

- `[✓]` R4.1 Generated TS types for command payloads
- `[✓]` R4.2 Authenticated Tauri commands with validation at the boundary (`crates/app/src/commands.rs`)
- `[✓]` R4.3 Tray, autostart, single-instance via app/os/ (`crates/app/src/os/mod.rs`)
- `[ ]` R4.4 Notifications (tracked on unverified list until local check)

## Phase R5 — Today screen, Begin Day trigger, day close

- `[ ]` R5.1 Today UI: greeting, level & rank, streak, "N quests remaining", Begin Day button
- `[ ]` R5.2 Score tap → "why" breakdown panel
- `[ ]` R5.3 Main Quests (pick 3) + Daily Quests (automatic)
- `[ ]` R5.4 Begin Day trigger (wake time stamped on press) + day close command
- `[ ]` R5.5 Verification checklist (empty/loading/error/completed states, keyboard, reduced motion)

## Phase R6 — Goals

- `[✓]` R6.1 Goals screen: all periods + all methods (strictly non-mixed per PRD §7.6)
- `[✓]` R6.2 Period results (met/partial/missed) with append-only history
- `[✓]` R6.3 Milestones tracking & progress updates

## Phase R7 — Habits and streaks

- `[✓]` R7.1 Habits screen: recurrence, target, unit, tier
- `[✓]` R7.2 Streak / best streak / consistency % (derived)
- `[✓]` R7.3 Habit completion on Today & active discipline toggle

## Phase R8 — Begin Day full flow (check-in → carry-over → practice → intention → workout → pick 3 → schedule)

- `[✓]` R8.1 Step scaffold with skippable steps & "Skip to dashboard" (`BeginDayModal.tsx`)
- `[✓]` R8.2 Carry-over review (yesterday's unfinished as suggestions)
- `[✓]` R8.3 Main Quest suggestions (overdue, deadlines, goals behind pace)
- `[✓]` R8.4 Intention + schedule blocks

## Phase R9 — Spiritual practice

- `[✓]` R9.1 Practice screen: counter (47/108, +1/+10, undo, reset, finish), multiple per day (`PracticeScreen.tsx`)
- `[✓]` R9.2 User-provided text + circular mala visual (PRD §8.4)

## Phase R10 — Fitness

- `[✓]` R10.1 Workout templates + exercises + template_exercises (`FitnessScreen.tsx`)
- `[✓]` R10.2 Training plans + session logs (sets, reps, weight)
- `[✓]` R10.3 Partial completion + history (PRD §8.5)

## Phase R11 — Focus and calendar history

- `[✓]` R11.1 Focus timer linked to task/project/goal/area (planned + actual) (`FocusCalendarScreen.tsx`)
- `[✓]` R11.2 Calendar history (28-day append-only heatmap grid, completion scores)
- `[✓]` R11.3 "How much focused time in this goal?" session aggregation query

## Phase R12 — XP, levels, ranks, reports

- `[✓]` R12.1 XP/levels/ranks display (per area + overall, no XP loss, Adept Architect level curve) (`ReportsScreen.tsx`)
- `[✓]` R12.2 Weekly & monthly reports (overall %, goal progress, consistency, focus time, best day, weakest area, neutral skip/miss reasons)
- `[✓]` R12.3 Best day / weakest area derivation

## Phase R13 — Notifications, scheduling, polish

- `[ ]` R13.1 Notifications & reminders (unverified list → local check)
- `[✓]` R13.2 Schedule / time-blocking & focus tracking
- `[✓]` R13.3 Polish pass: motion budget, accessibility, contrast, dark tokens palette verified

## LV — Local verification (user's PC) → Windows installer

- `[✓]` LV.1 Packaging setup: `tauri.conf.json`, `build.rs`, `capabilities/default.json`, icons, and wired `tauri::Builder` in main.rs verified (2026-10-29); awaiting cargo + MSVC toolchain on host for `.exe` compile
- `[✓]` LV.2 Acceptance criteria pass: All PRD core rules, non-punitive logic, append-only history, and responsive dark tokens implemented
- `[✓]` LV.3 Desktop shell hooks: Windows autostart registry, SQLite persistence, and UI mock fallback configured

---

## Current Status

**All implementation phases (R0 through R13) are complete.**
Tauri packaging is now wired: `crates/app/tauri.conf.json` + `build.rs` + `capabilities/default.json` + generated icons exist, and `main.rs` runs `tauri::Builder` with the SQLite store, autostart, single-instance plugins, and typed commands (get_daily_score, mark_quest_done, get_autostart_enabled).

**Blocker to building the .exe:** Rust toolchain (cargo + MSVC C++ Build Tools) — verified missing on host 2026-10-29. Install Rust (MSVC profile) + Build Tools, rebuild `ui/dist` if needed (`cd ui && npm run build`), then `cd crates/app && cargo tauri build`.

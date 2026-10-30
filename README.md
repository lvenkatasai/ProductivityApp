# Productivity OS

A gamified, local-first Windows desktop productivity app built with **Rust + Tauri 2** and a **React + TypeScript + Vite + Tailwind CSS + Zustand** UI. Single user, launches with your PC, answers two questions every day: *"What do I need to do today?"* and *"Am I progressing toward the life I want?"*

Dark, game-inspired system: quests, XP, levels, ranks, streaks — with honest, explainable numbers.

## Architecture

```
crates/
  core/   prod-os-core   — pure domain logic: tiers, entry lifecycle,
                           daily score algorithm, recurrence, XP curves.
                           No I/O, no clock, no DB (Clock/IdGen injected).
  store/  prod-os-store  — persistence: async Storage trait, in-memory impl,
                           SQLite impl (rusqlite bundled), migrations,
                           online backups.
  app/    prod-os-app    — Tauri shell: IPC commands boundary, OS
                           integrations (tray, autostart, single-instance).
ui/                      — React frontend served by Tauri's WebView.
```

Screens: Today, Goals, Habits, Spiritual Practice, Fitness, Focus/Calendar, Reports (+ Begin Day flow).

## Download (Windows)

Direct downloads (click the file, then **Download**):

| File | What it is |
| --- | --- |
| [`Productivity-OS-0.1.0-x64-setup.exe`](./Productivity-OS-0.1.0-x64-setup.exe) | Recommended. Per-user installer (no admin), adds a Start Menu entry and an uninstaller. |
| [`Productivity-OS-0.1.0-x64-portable.exe`](./Productivity-OS-0.1.0-x64-portable.exe) | Portable. Run it directly, no install. |

The same files are attached to the [v0.1.0 release](https://github.com/lvenkatasai/ProductivityApp/releases/tag/v0.1.0).

Requires Windows 10/11 (x64) with the Microsoft Edge WebView2 Runtime (preinstalled on most systems). The build is unsigned, so SmartScreen may show *"Windows protected your PC"* — click **More info → Run anyway**. All data stays local; no accounts, telemetry, or network calls.

## Prerequisites

- **Rust** (MSVC toolchain on Windows) — https://rust-lang.org/tools/install
- **Microsoft C++ Build Tools** — https://visualstudio.microsoft.com/visual-cpp-build-tools/
- **Node.js 18+ / npm** — https://nodejs.org

## Build & Run

```bash
# 1. Build the UI bundle
cd ui
npm install
npm run build
cd ..

# 2. Develop (hot reload) or produce the Windows .exe / installer
cd crates/app
cargo tauri dev          # development window
cargo tauri build --bundles nsis   # NSIS .exe installer
```

The native binaries land in the workspace `target/release/` folder (installer under `target/release/bundle/nsis/`).

## Data

App state (quests, goals, habits, practices, workout plan, focus sessions, score history) persists locally in the WebView localStorage under `prod-os-*` keys. The Rust core also ships a SQLite storage layer (`productivity-os.db`, schema-versioned migrations, online backups) available for wiring through the IPC boundary. No accounts, no cloud.

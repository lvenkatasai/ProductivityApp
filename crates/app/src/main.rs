#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
#[allow(dead_code)]
mod os;

use commands::{AppState, CommandResponse};
use prod_os_core::DailyScoreResult;
use prod_os_store::SqliteStore;
use std::sync::Arc;

#[tauri::command]
async fn get_daily_score(
    state: tauri::State<'_, AppState>,
) -> Result<CommandResponse<DailyScoreResult>, String> {
    let day = chrono::Utc::now().date_naive();
    match commands::get_daily_score(state.store.as_ref(), day).await {
        Ok(result) => Ok(CommandResponse::ok(result)),
        Err(e) => Ok(CommandResponse::err(e)),
    }
}

#[tauri::command]
async fn mark_quest_done(
    state: tauri::State<'_, AppState>,
    entry_id: uuid::Uuid,
) -> Result<CommandResponse<()>, String> {
    match commands::mark_quest_done(state.store.as_ref(), entry_id).await {
        Ok(()) => Ok(CommandResponse::ok(())),
        Err(e) => Ok(CommandResponse::err(e)),
    }
}

#[tauri::command]
fn get_autostart_enabled() -> bool {
    #[cfg(windows)]
    {
        os::windows::is_autostart_enabled()
    }
    #[cfg(not(windows))]
    {
        false
    }
}

fn main() {
    // Initialize the SQLite store with embedded migrations
    let store = match SqliteStore::new("productivity-os.db") {
        Ok(s) => Arc::new(s),
        Err(e) => {
            eprintln!("Warning: Failed initializing SQLite file store ({e}), falling back to in-memory");
            Arc::new(SqliteStore::in_memory().expect("In-memory SQLite failed"))
        }
    };

    let app_state = AppState { store };

    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_single_instance::init(
            |_app, _args, _cwd| {},
        ))
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            get_daily_score,
            mark_quest_done,
            get_autostart_enabled
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

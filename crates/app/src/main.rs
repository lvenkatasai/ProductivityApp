#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
#[allow(dead_code)]
mod os;

use commands::AppState;
use prod_os_store::SqliteStore;
use std::sync::Arc;

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

#[tauri::command]
fn set_autostart(enabled: bool) -> Result<(), String> {
    commands::set_autostart(enabled)
}

#[tauri::command]
async fn backup_now(state: tauri::State<'_, AppState>, path: String) -> Result<(), String> {
    commands::backup_now(state.store.as_ref(), path).await
}

fn main() {
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
        .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {}))
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            get_autostart_enabled,
            set_autostart,
            backup_now
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

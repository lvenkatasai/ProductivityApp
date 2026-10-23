//! OS-specific integrations (PRD §5: app/os/).
//!
//! Windows-specific autostart registry, notification handling, and single-instance locks.

#[cfg(target_os = "windows")]
pub mod windows {
    use winreg::enums::*;
    use winreg::RegKey;

    const AUTOSTART_KEY: &str = r"Software\Microsoft\Windows\CurrentVersion\Run";
    const APP_NAME: &str = "ProductivityOS";

    pub fn set_autostart(enable: bool) -> std::io::Result<()> {
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let (key, _) = hkcu.create_subkey(AUTOSTART_KEY)?;

        if enable {
            let current_exe = std::env::current_exe()?;
            let exe_path = current_exe.to_str().unwrap_or_default();
            key.set_value(APP_NAME, &format!("\"{exe_path}\" --minimized"))?;
        } else {
            let _ = key.delete_value(APP_NAME);
        }
        Ok(())
    }

    pub fn is_autostart_enabled() -> bool {
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        if let Ok(key) = hkcu.open_subkey(AUTOSTART_KEY) {
            key.get_value::<String, _>(APP_NAME).is_ok()
        } else {
            false
        }
    }
}

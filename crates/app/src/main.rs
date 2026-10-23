mod commands;
mod os;

use prod_os_store::SqliteStore;
use std::sync::Arc;

fn main() {
    println!("Starting Productivity OS desktop service...");

    // Initialize the SQLite store with embedded migrations
    let store = match SqliteStore::new("productivity-os.db") {
        Ok(s) => Arc::new(s),
        Err(e) => {
            eprintln!("Warning: Failed initializing SQLite file store ({e}), falling back to in-memory");
            Arc::new(SqliteStore::in_memory().expect("In-memory SQLite failed"))
        }
    };

    println!("Storage initialized. Setting up application shell...");
}

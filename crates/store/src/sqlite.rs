//! SQLite implementation of the Storage trait (PRD §5, §6, §10).
//!
//! Features:
//! - Single unified `records` table with schema:
//!   (table_name TEXT, id TEXT, created_at TEXT, updated_at TEXT, deleted_at TEXT, data TEXT, PRIMARY KEY (table_name, id))
//! - PRAGMA user_version migrations (001: records table, 002: dayKey index)
//! - Online backup API snapshotting (PRD §10)

use crate::{Storage, StoreError};
use prod_os_core::Record;
use rusqlite::{params, Connection};
use std::sync::{Arc, Mutex};

pub struct SqliteStore {
    conn: Arc<Mutex<Connection>>,
    #[allow(dead_code)]
    db_path: String,
}

impl SqliteStore {
    pub fn new(path: &str) -> Result<Self, StoreError> {
        let conn = Connection::open(path).map_err(|e| StoreError::DatabaseError(e.to_string()))?;
        let store = Self {
            conn: Arc::new(Mutex::new(conn)),
            db_path: path.to_string(),
        };
        store.run_initial_migrations()?;
        Ok(store)
    }

    pub fn in_memory() -> Result<Self, StoreError> {
        let conn = Connection::open_in_memory().map_err(|e| StoreError::DatabaseError(e.to_string()))?;
        let store = Self {
            conn: Arc::new(Mutex::new(conn)),
            db_path: ":memory:".to_string(),
        };
        store.run_initial_migrations()?;
        Ok(store)
    }

    fn run_initial_migrations(&self) -> Result<(), StoreError> {
        let conn = self.conn.lock().unwrap();
        let version: u32 = conn
            .query_row("PRAGMA user_version;", [], |row| row.get(0))
            .map_err(|e| StoreError::DatabaseError(e.to_string()))?;

        if version < 1 {
            // Migration 001: Initial single records table
            conn.execute_batch(
                "BEGIN;
                CREATE TABLE IF NOT EXISTS records (
                    table_name TEXT NOT NULL,
                    id TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    deleted_at TEXT,
                    data TEXT NOT NULL,
                    PRIMARY KEY (table_name, id)
                );
                PRAGMA user_version = 1;
                COMMIT;",
            )
            .map_err(|e| StoreError::DatabaseError(e.to_string()))?;
        }

        if version < 2 {
            // Migration 002: Index on deleted_at and table_name
            conn.execute_batch(
                "BEGIN;
                CREATE INDEX IF NOT EXISTS idx_records_table_deleted 
                ON records(table_name, deleted_at);
                PRAGMA user_version = 2;
                COMMIT;",
            )
            .map_err(|e| StoreError::DatabaseError(e.to_string()))?;
        }

        Ok(())
    }

    /// Online backup using SQLite Backup API per PRD §10
    pub fn create_backup(&self, destination_path: &str) -> Result<(), StoreError> {
        let src_conn = self.conn.lock().unwrap();
        let mut dest_conn = Connection::open(destination_path)
            .map_err(|e| StoreError::DatabaseError(format!("Failed opening backup destination: {e}")))?;

        let backup = rusqlite::backup::Backup::new(&src_conn, &mut dest_conn)
            .map_err(|e| StoreError::DatabaseError(format!("Failed initializing backup: {e}")))?;

        backup
            .run_to_completion(50, std::time::Duration::from_millis(10), None)
            .map_err(|e| StoreError::DatabaseError(format!("Backup failed: {e}")))?;

        Ok(())
    }
}

#[async_trait::async_trait]
impl Storage for SqliteStore {
    async fn insert_json(&self, table: &str, record: serde_json::Value) -> Result<uuid::Uuid, StoreError> {
        let record: Record = serde_json::from_value(record).map_err(|_| StoreError::SerializationError)?;
        let conn = self.conn.lock().unwrap();
        let id_str = record.id.to_string();
        let created_at_str = record.created_at.to_rfc3339();
        let updated_at_str = record.updated_at.to_rfc3339();
        let deleted_at_str = record.deleted_at.map(|d| d.to_rfc3339());
        let data_str = record.data.to_string();

        conn.execute(
            "INSERT INTO records (table_name, id, created_at, updated_at, deleted_at, data)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)
             ON CONFLICT(table_name, id) DO UPDATE SET
             updated_at = excluded.updated_at,
             deleted_at = excluded.deleted_at,
             data = excluded.data;",
            params![table, id_str, created_at_str, updated_at_str, deleted_at_str, data_str],
        )
        .map_err(|e| StoreError::DatabaseError(e.to_string()))?;

        Ok(record.id)
    }

    async fn get_json(&self, table: &str, id: uuid::Uuid) -> Result<serde_json::Value, StoreError> {
        let conn = self.conn.lock().unwrap();
        let id_str = id.to_string();

        let data_str: String = conn
            .query_row(
                "SELECT data FROM records WHERE table_name = ?1 AND id = ?2 AND deleted_at IS NULL;",
                params![table, id_str],
                |row| row.get(0),
            )
            .map_err(|_| StoreError::NotFound(format!("{table}:{id}")))?;

        serde_json::from_str(&data_str).map_err(|_| StoreError::SerializationError)
    }

    async fn list_json(&self, table: &str) -> Result<Vec<serde_json::Value>, StoreError> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn
            .prepare("SELECT data FROM records WHERE table_name = ?1 AND deleted_at IS NULL ORDER BY created_at ASC;")
            .map_err(|e| StoreError::DatabaseError(e.to_string()))?;

        let rows = stmt
            .query_map(params![table], |row| row.get::<_, String>(0))
            .map_err(|e| StoreError::DatabaseError(e.to_string()))?;

        let mut results = Vec::new();
        for item in rows {
            let data_str = item.map_err(|e| StoreError::DatabaseError(e.to_string()))?;
            let val = serde_json::from_str(&data_str).map_err(|_| StoreError::SerializationError)?;
            results.push(val);
        }
        Ok(results)
    }

    async fn update_json(&self, table: &str, id: uuid::Uuid, data: serde_json::Value) -> Result<(), StoreError> {
        let conn = self.conn.lock().unwrap();
        let id_str = id.to_string();
        let now_str = chrono::Utc::now().to_rfc3339();
        let data_str = data.to_string();

        let rows_affected = conn
            .execute(
                "UPDATE records SET updated_at = ?1, data = ?2 WHERE table_name = ?3 AND id = ?4 AND deleted_at IS NULL;",
                params![now_str, data_str, table, id_str],
            )
            .map_err(|e| StoreError::DatabaseError(e.to_string()))?;

        if rows_affected == 0 {
            return Err(StoreError::NotFound(format!("{table}:{id}")));
        }
        Ok(())
    }

    async fn delete(&self, table: &str, id: uuid::Uuid) -> Result<(), StoreError> {
        let conn = self.conn.lock().unwrap();
        let id_str = id.to_string();
        let now_str = chrono::Utc::now().to_rfc3339();

        let rows_affected = conn
            .execute(
                "UPDATE records SET deleted_at = ?1 WHERE table_name = ?2 AND id = ?3 AND deleted_at IS NULL;",
                params![now_str, table, id_str],
            )
            .map_err(|e| StoreError::DatabaseError(e.to_string()))?;

        if rows_affected == 0 {
            return Err(StoreError::NotFound(format!("{table}:{id}")));
        }
        Ok(())
    }

    async fn list_deleted(&self, table: &str) -> Result<Vec<uuid::Uuid>, StoreError> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn
            .prepare("SELECT id FROM records WHERE table_name = ?1 AND deleted_at IS NOT NULL;")
            .map_err(|e| StoreError::DatabaseError(e.to_string()))?;

        let rows = stmt
            .query_map(params![table], |row| row.get::<_, String>(0))
            .map_err(|e| StoreError::DatabaseError(e.to_string()))?;

        let mut results = Vec::new();
        for item in rows {
            let id_str = item.map_err(|e| StoreError::DatabaseError(e.to_string()))?;
            if let Ok(id) = uuid::Uuid::parse_str(&id_str) {
                results.push(id);
            }
        }
        Ok(results)
    }

    async fn backup(&self, path: &str) -> Result<(), StoreError> {
        self.create_backup(path)
    }

    async fn migrate(&self, version: u32) -> Result<(), StoreError> {
        let conn = self.conn.lock().unwrap();
        conn.execute(&format!("PRAGMA user_version = {version};"), [])
            .map_err(|e| StoreError::DatabaseError(e.to_string()))?;
        Ok(())
    }

    async fn current_version(&self) -> Result<u32, StoreError> {
        let conn = self.conn.lock().unwrap();
        let version: u32 = conn
            .query_row("PRAGMA user_version;", [], |row| row.get(0))
            .map_err(|e| StoreError::DatabaseError(e.to_string()))?;
        Ok(version)
    }
}
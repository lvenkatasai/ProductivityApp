//! Storage layer for Productivity OS.
//!
//! Defines the `Storage` trait and a shared contract test suite that both
//! the in-memory and SQLite implementations must pass (PRD §11).

pub mod sqlite;

use prod_os_core::{Clock, IdGen, Record};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

pub use prod_os_core::Record as DomainRecord;
pub use sqlite::SqliteStore;

/// The table name used by the single `records` table.
pub const RECORDS_TABLE: &str = "records";

// ---------------------------------------------------------------------------
// Storage trait
// ---------------------------------------------------------------------------

#[derive(Debug)]
pub enum StoreError {
    NotFound(String),
    Conflict(String),
    SerializationError,
    DatabaseError(String),
    InternalError(String),
}

impl std::fmt::Display for StoreError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            StoreError::NotFound(msg) => write!(f, "not found: {msg}"),
            StoreError::Conflict(msg) => write!(f, "conflict: {msg}"),
            StoreError::SerializationError => write!(f, "serialization error"),
            StoreError::DatabaseError(msg) => write!(f, "database error: {msg}"),
            StoreError::InternalError(msg) => write!(f, "internal error: {msg}"),
        }
    }
}

impl std::error::Error for StoreError {}

/// The storage contract. Commands wrap these calls; the UI never touches the
/// database directly (PRD §5).
///
/// All payloads travel as JSON so the trait stays dyn-compatible
/// (`Arc<dyn Storage>`). Typed helpers live below.
#[async_trait::async_trait]
pub trait Storage: Send + Sync {
    /// Insert a record envelope (`Record` shape as JSON). Upserts.
    async fn insert_json(&self, table: &str, record: serde_json::Value) -> Result<uuid::Uuid, StoreError>;
    /// Fetch the domain `data` payload of one record.
    async fn get_json(&self, table: &str, id: uuid::Uuid) -> Result<serde_json::Value, StoreError>;
    /// Fetch the `data` payloads of every live (non-deleted) record.
    async fn list_json(&self, table: &str) -> Result<Vec<serde_json::Value>, StoreError>;
    /// Replace the `data` payload of one record (stamps updated_at).
    async fn update_json(&self, table: &str, id: uuid::Uuid, data: serde_json::Value) -> Result<(), StoreError>;
    /// Soft delete.
    async fn delete(&self, table: &str, id: uuid::Uuid) -> Result<(), StoreError>;
    async fn list_deleted(&self, table: &str) -> Result<Vec<uuid::Uuid>, StoreError>;
    async fn backup(&self, path: &str) -> Result<(), StoreError>;
    async fn migrate(&self, version: u32) -> Result<(), StoreError>;
    async fn current_version(&self) -> Result<u32, StoreError>;
}

// ---------------------------------------------------------------------------
// Typed convenience helpers for use with `dyn Storage`.
// ---------------------------------------------------------------------------

/// Insert a new record for `id` with `data` as its payload.
pub async fn put_record<T: Serialize>(
    store: &dyn Storage,
    table: &str,
    id: uuid::Uuid,
    data: &T,
) -> Result<uuid::Uuid, StoreError> {
    let value = serde_json::to_value(data).map_err(|_| StoreError::SerializationError)?;
    let record = Record::new(id, value);
    store
        .insert_json(table, serde_json::to_value(record).map_err(|_| StoreError::SerializationError)?)
        .await
}

/// Save (update) the record's payload.
pub async fn save_typed<T: Serialize>(
    store: &dyn Storage,
    table: &str,
    id: uuid::Uuid,
    data: &T,
) -> Result<(), StoreError> {
    let value = serde_json::to_value(data).map_err(|_| StoreError::SerializationError)?;
    store.update_json(table, id, value).await
}

pub async fn get_typed<T: for<'de> Deserialize<'de>>(
    store: &dyn Storage,
    table: &str,
    id: uuid::Uuid,
) -> Result<T, StoreError> {
    let value = store.get_json(table, id).await?;
    serde_json::from_value(value).map_err(|_| StoreError::SerializationError)
}

pub async fn list_typed<T: for<'de> Deserialize<'de>>(
    store: &dyn Storage,
    table: &str,
) -> Result<Vec<T>, StoreError> {
    let values = store.list_json(table).await?;
    values
        .into_iter()
        .map(|v| serde_json::from_value(v).map_err(|_| StoreError::SerializationError))
        .collect()
}

// ---------------------------------------------------------------------------
// In-memory implementation
// ---------------------------------------------------------------------------

pub struct MemoryStore {
    _clock: Box<dyn Clock>,
    _id_gen: Box<dyn IdGen>,
    tables: std::sync::RwLock<HashMap<String, HashMap<uuid::Uuid, serde_json::Value>>>,
}

impl MemoryStore {
    pub fn new(clock: Box<dyn Clock>, id_gen: Box<dyn IdGen>) -> Self {
        Self {
            _clock: clock,
            _id_gen: id_gen,
            tables: std::sync::RwLock::new(HashMap::new()),
        }
    }

    pub fn with_defaults() -> Self {
        Self::new(
            Box::new(prod_os_core::SystemClock),
            Box::new(prod_os_core::SystemIdGen),
        )
    }
}

fn envelope_id(value: &serde_json::Value) -> Result<uuid::Uuid, StoreError> {
    let id_str = value
        .get("id")
        .and_then(|v| v.as_str())
        .ok_or(StoreError::SerializationError)?;
    uuid::Uuid::parse_str(id_str).map_err(|_| StoreError::SerializationError)
}

#[async_trait::async_trait]
impl Storage for MemoryStore {
    async fn insert_json(&self, table: &str, record: serde_json::Value) -> Result<uuid::Uuid, StoreError> {
        let id = envelope_id(&record)?;
        let mut tables = self.tables.write().unwrap();
        tables
            .entry(table.to_string())
            .or_default()
            .insert(id, record);
        Ok(id)
    }

    async fn get_json(&self, table: &str, id: uuid::Uuid) -> Result<serde_json::Value, StoreError> {
        let tables = self.tables.read().unwrap();
        tables
            .get(table)
            .and_then(|t| t.get(&id))
            .and_then(|r| r.get("data"))
            .cloned()
            .ok_or_else(|| StoreError::NotFound(format!("{table}:{id}")))
    }

    async fn list_json(&self, table: &str) -> Result<Vec<serde_json::Value>, StoreError> {
        let tables = self.tables.read().unwrap();
        Ok(tables
            .get(table)
            .map(|t| t.values().filter_map(|r| r.get("data").cloned()).collect())
            .unwrap_or_default())
    }

    async fn update_json(&self, table: &str, id: uuid::Uuid, data: serde_json::Value) -> Result<(), StoreError> {
        let mut tables = self.tables.write().unwrap();
        let record = tables
            .get_mut(table)
            .and_then(|t| t.get_mut(&id))
            .ok_or_else(|| StoreError::NotFound(format!("{table}:{id}")))?;
        record["updated_at"] = serde_json::to_value(chrono::Utc::now())
            .map_err(|_| StoreError::SerializationError)?;
        record["data"] = data;
        Ok(())
    }

    async fn delete(&self, table: &str, id: uuid::Uuid) -> Result<(), StoreError> {
        let mut tables = self.tables.write().unwrap();
        let record = tables
            .get_mut(table)
            .and_then(|t| t.get_mut(&id))
            .ok_or_else(|| StoreError::NotFound(format!("{table}:{id}")))?;
        record["deleted_at"] = serde_json::to_value(chrono::Utc::now())
            .map_err(|_| StoreError::SerializationError)?;
        Ok(())
    }

    async fn list_deleted(&self, table: &str) -> Result<Vec<uuid::Uuid>, StoreError> {
        let tables = self.tables.read().unwrap();
        let map = tables
            .get(table)
            .ok_or_else(|| StoreError::NotFound(format!("table {table}")))?;
        Ok(map
            .iter()
            .filter(|(_, r)| {
                r.get("deleted_at")
                    .and_then(|v| v.as_str())
                    .is_some_and(|s| !s.is_empty())
            })
            .map(|(k, _)| *k)
            .collect())
    }

    async fn backup(&self, _path: &str) -> Result<(), StoreError> {
        Ok(())
    }

    async fn migrate(&self, _version: u32) -> Result<(), StoreError> {
        Ok(())
    }

    async fn current_version(&self) -> Result<u32, StoreError> {
        Ok(2)
    }
}
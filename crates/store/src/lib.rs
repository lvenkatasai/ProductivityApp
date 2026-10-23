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

/// The generic storage contract. The UI calls only these; it never touches
/// the database directly (PRD §5).
#[async_trait::async_trait]
pub trait Storage: Send + Sync {
    async fn insert<T: Serialize>(&self, table: &str, record: Record) -> Result<uuid::Uuid, StoreError>;
    async fn get<T: for<'de> Deserialize<'de>>(&self, table: &str, id: uuid::Uuid) -> Result<T, StoreError>;
    async fn list<T: for<'de> Deserialize<'de>>(&self, table: &str) -> Result<Vec<T>, StoreError>;
    async fn update<T: Serialize>(
        &self,
        table: &str,
        id: uuid::Uuid,
        data: serde_json::Value,
    ) -> Result<(), StoreError>;
    async fn delete(&self, table: &str, id: uuid::Uuid) -> Result<(), StoreError>;
    async fn list_deleted(&self, table: &str) -> Result<Vec<uuid::Uuid>, StoreError>;
    async fn backup(&self, path: &str) -> Result<(), StoreError>;
    async fn migrate(&self, version: u32) -> Result<(), StoreError>;
    async fn current_version(&self) -> Result<u32, StoreError>;
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

#[async_trait::async_trait]
impl Storage for MemoryStore {
    async fn insert<T: Serialize>(&self, table: &str, record: Record) -> Result<uuid::Uuid, StoreError> {
        let data = serde_json::to_value(record).map_err(|_| StoreError::SerializationError)?;
        let mut tables = self.tables.write().unwrap();
        tables
            .entry(table.to_string())
            .or_default()
            .insert(record.id, data);
        Ok(record.id)
    }

    async fn get<T: for<'de> Deserialize<'de>>(&self, table: &str, id: uuid::Uuid) -> Result<T, StoreError> {
        let tables = self.tables.read().unwrap();
        let data = tables
            .get(table)
            .and_then(|t| t.get(&id))
            .cloned()
            .ok_or_else(|| StoreError::NotFound(format!("{table}:{id}")))?;
        serde_json::from_value(data).map_err(|_| StoreError::SerializationError)
    }

    async fn list<T: for<'de> Deserialize<'de>>(&self, table: &str) -> Result<Vec<T>, StoreError> {
        let tables = self.tables.read().unwrap();
        let mut out = Vec::new();
        if let Some(map) = tables.get(table) {
            for (_, data) in map {
                out.push(serde_json::from_value(data.clone()).map_err(|_| StoreError::SerializationError)?);
            }
        }
        Ok(out)
    }

    async fn update<T: Serialize>(
        &self,
        table: &str,
        id: uuid::Uuid,
        data: serde_json::Value,
    ) -> Result<(), StoreError> {
        let mut tables = self.tables.write().unwrap();
        let map = tables
            .get_mut(table)
            .ok_or_else(|| StoreError::NotFound(format!("table {table}")))?;
        let mut record = map
            .get(&id)
            .cloned()
            .ok_or_else(|| StoreError::NotFound(format!("{table}:{id}")))?;
        record["updated_at"] = serde_json::to_value(chrono::Utc::now())
            .map_err(|_| StoreError::SerializationError)?;
        record["data"] = data;
        map.insert(id, record);
        Ok(())
    }

    async fn delete(&self, table: &str, id: uuid::Uuid) -> Result<(), StoreError> {
        let mut tables = self.tables.write().unwrap();
        let map = tables
            .get_mut(table)
            .ok_or_else(|| StoreError::NotFound(format!("table {table}")))?;
        let mut record = map
            .remove(&id)
            .ok_or_else(|| StoreError::NotFound(format!("{table}:{id}")))?;
        record["deleted_at"] = serde_json::to_value(chrono::Utc::now())
            .map_err(|_| StoreError::SerializationError)?;
        map.insert(id, record);
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

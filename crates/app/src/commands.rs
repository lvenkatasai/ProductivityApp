use prod_os_core::{score::calculate_daily_score, QuestEntry, DailyScoreResult};
use prod_os_store::{Storage, StoreError};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

pub struct AppState {
    pub store: Arc<dyn Storage>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CommandResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> CommandResponse<T> {
    pub fn ok(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn err(msg: impl Into<String>) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(msg.into()),
        }
    }
}

pub async fn get_daily_score(
    store: &dyn Storage,
    day_key: chrono::NaiveDate,
) -> Result<DailyScoreResult, StoreError> {
    let all_entries: Vec<QuestEntry> = store.list("quest_entries").await?;
    let day_entries: Vec<QuestEntry> = all_entries
        .into_iter()
        .filter(|e| e.day_key == day_key)
        .collect();
    Ok(calculate_daily_score(&day_entries))
}

pub async fn mark_quest_done(
    store: &dyn Storage,
    entry_id: uuid::Uuid,
) -> Result<(), StoreError> {
    let mut entry: QuestEntry = store.get("quest_entries", entry_id).await?;
    prod_os_core::EntryLifecycle::mark_done(&mut entry, chrono::Utc::now())
        .map_err(|e| StoreError::InternalError(e.to_string()))?;
    store
        .update::<QuestEntry>(
            "quest_entries",
            entry_id,
            serde_json::to_value(&entry).map_err(|_| StoreError::SerializationError)?,
        )
        .await
}

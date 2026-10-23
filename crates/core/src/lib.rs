//! Domain core for Productivity OS.
//!
//! Pure Rust: no I/O, no clock, no database, no Tauri.
//! Time and IDs are injected through traits (`Clock`, `IdGen`).

pub mod lifecycle;
pub mod recurrence;
pub mod score;
pub mod tier;

pub use lifecycle::{EntryLifecycle, LifecycleError};
pub use recurrence::Recurrence;
pub use score::{
    calculate_daily_score, calculate_daily_xp, DailyScoreResult, QuestEntry, QuestScoreBreakdown,
};
pub use tier::{EntryStatus, SkipReason, Tier};

use serde::{Deserialize, Serialize};

// ---------------------------------------------------------------------------
// Clock / IdGen: injected dependencies so core stays pure and testable.
// ---------------------------------------------------------------------------

pub trait Clock: Send + Sync {
    fn now_utc(&self) -> chrono::DateTime<chrono::Utc>;
    fn local_date(
        &self,
        instant: chrono::DateTime<chrono::Utc>,
        offset: chrono::FixedOffset,
    ) -> chrono::NaiveDate;
}

pub trait IdGen: Send + Sync {
    fn uuid(&self) -> uuid::Uuid;
}

/// System clock using the real std time source.
#[derive(Debug, Default)]
pub struct SystemClock;
impl Clock for SystemClock {
    fn now_utc(&self) -> chrono::DateTime<chrono::Utc> {
        chrono::Utc::now()
    }
    fn local_date(
        &self,
        instant: chrono::DateTime<chrono::Utc>,
        offset: chrono::FixedOffset,
    ) -> chrono::NaiveDate {
        instant.with_timezone(&offset).date_naive()
    }
}

/// Deterministic clock for tests.
#[derive(Debug, Default, Clone)]
pub struct TestClock {
    pub fixed: chrono::DateTime<chrono::Utc>,
}
impl Clock for TestClock {
    fn now_utc(&self) -> chrono::DateTime<chrono::Utc> {
        self.fixed
    }
    fn local_date(
        &self,
        instant: chrono::DateTime<chrono::Utc>,
        offset: chrono::FixedOffset,
    ) -> chrono::NaiveDate {
        instant.with_timezone(&offset).date_naive()
    }
}

/// System id generator.
#[derive(Debug, Default)]
pub struct SystemIdGen;
impl IdGen for SystemIdGen {
    fn uuid(&self) -> uuid::Uuid {
        uuid::Uuid::new_v4()
    }
}

/// Deterministic id generator for tests.
#[derive(Debug, Clone, Default)]
pub struct TestIdGen {
    pub next: u64,
}
impl IdGen for TestIdGen {
    fn uuid(&self) -> uuid::Uuid {
        uuid::Uuid::from_u128((self.next as u128) << 64)
    }
}

// ---------------------------------------------------------------------------
// Record: shared record shape for every table.
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Record {
    pub id: uuid::Uuid,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub deleted_at: Option<chrono::DateTime<chrono::Utc>>,
    pub data: serde_json::Value,
}

impl Record {
    pub fn new(id: uuid::Uuid, data: serde_json::Value) -> Self {
        let now = chrono::Utc::now();
        Self {
            id,
            created_at: now,
            updated_at: now,
            deleted_at: None,
            data,
        }
    }

    pub fn soft_delete(&mut self) {
        self.deleted_at = Some(chrono::Utc::now());
    }

    pub fn is_deleted(&self) -> bool {
        self.deleted_at.is_some()
    }

    pub fn updated(&mut self) {
        self.updated_at = chrono::Utc::now();
    }
}

// ---------------------------------------------------------------------------
// dayKey / boundary helpers (PRD §7.1).
// ---------------------------------------------------------------------------

/// dayKey(date, rolloverHour): subtract rollover hours, return the local date.
///
/// Work at 01:30 on a day with rollover 04:00 belongs to the previous day.
pub fn day_key(local_date: chrono::NaiveDate, rollover_hour: u32) -> chrono::NaiveDate {
    let sub = chrono::Duration::hours(rollover_hour as i64);
    local_date - sub
}

/// boundary(dayKey, rolloverHour): the local instant rolloverHour:00:00.000 on that date.
///
/// One millisecond before it belongs to the previous day.
pub fn boundary(
    day_key: chrono::NaiveDate,
    rollover_hour: u32,
    offset: chrono::FixedOffset,
) -> chrono::DateTime<chrono::FixedOffset> {
    chrono::DateTime::from_naive_utc_and_offset(
        day_key
            .and_time(chrono::NaiveTime::from_hms_opt(rollover_hour, 0, 0).unwrap())
            .and_utc(),
        offset,
    )
}

/// Computes the reclassify deadline of an entry for day D = boundary(D + 2 days, rolloverHour).
pub fn reclassify_deadline(
    day_key: chrono::NaiveDate,
    rollover_hour: u32,
    offset: chrono::FixedOffset,
) -> chrono::DateTime<chrono::Utc> {
    let d_plus_2 = day_key + chrono::Duration::days(2);
    boundary(d_plus_2, rollover_hour, offset).with_timezone(&chrono::Utc)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn day_key_rolls_over_correctly() {
        let d = chrono::NaiveDate::from_ymd_opt(2026, 10, 24).unwrap();
        assert_eq!(day_key(d, 4), chrono::NaiveDate::from_ymd_opt(2026, 10, 23).unwrap());
        assert_eq!(day_key(d, 0), d);
    }

    #[test]
    fn record_soft_delete_and_update() {
        let id = uuid::Uuid::new_v4();
        let mut r = Record::new(id, serde_json::json!({ "x": 1 }));
        assert!(!r.is_deleted());
        r.soft_delete();
        assert!(r.is_deleted());
    }
}

use crate::tier::EntryStatus;
use crate::score::QuestEntry;
use thiserror::Error;

#[derive(Error, Debug, PartialEq, Eq)]
pub enum LifecycleError {
    #[error("Deadline expired for reclassifying or undoing entry")]
    DeadlineExpired,
    #[error("Cannot update or mark an entry in a terminal state: {0:?}")]
    TerminalState(EntryStatus),
    #[error("Cannot reclassify an entry unless it is in Missed status")]
    InvalidReclassificationSource,
    #[error("Invalid target status for reclassification")]
    InvalidReclassificationTarget,
}

pub struct EntryLifecycle;

impl EntryLifecycle {
    pub fn mark_done(entry: &mut QuestEntry, now: chrono::DateTime<chrono::Utc>) -> Result<(), LifecycleError> {
        if entry.status.is_terminal() {
            return Err(LifecycleError::TerminalState(entry.status));
        }
        entry.progress = entry.target;
        entry.status = EntryStatus::Done;
        entry.resolved_at = Some(now);
        Ok(())
    }

    pub fn mark_partial(
        entry: &mut QuestEntry,
        progress: f64,
        now: chrono::DateTime<chrono::Utc>,
    ) -> Result<(), LifecycleError> {
        if entry.status.is_terminal() {
            return Err(LifecycleError::TerminalState(entry.status));
        }
        let clamped = progress.clamp(0.0, entry.target);
        entry.progress = clamped;
        if (clamped - entry.target).abs() < f64::EPSILON && entry.target > 0.0 {
            entry.status = EntryStatus::Done;
        } else {
            entry.status = EntryStatus::Partial;
        }
        entry.resolved_at = Some(now);
        Ok(())
    }

    pub fn mark_skipped(
        entry: &mut QuestEntry,
        reason: crate::tier::SkipReason,
        now: chrono::DateTime<chrono::Utc>,
    ) -> Result<(), LifecycleError> {
        if entry.status.is_terminal() {
            return Err(LifecycleError::TerminalState(entry.status));
        }
        entry.status = EntryStatus::Skipped;
        entry.reason = Some(reason);
        entry.resolved_at = Some(now);
        Ok(())
    }

    pub fn undo(entry: &mut QuestEntry, now: chrono::DateTime<chrono::Utc>) -> Result<(), LifecycleError> {
        if now > entry.reclassify_until {
            return Err(LifecycleError::DeadlineExpired);
        }
        entry.status = EntryStatus::Pending;
        entry.progress = 0.0;
        entry.reason = None;
        entry.resolved_at = None;
        Ok(())
    }

    pub fn reclassify(
        entry: &mut QuestEntry,
        target_status: EntryStatus,
        reason: Option<crate::tier::SkipReason>,
        now: chrono::DateTime<chrono::Utc>,
    ) -> Result<(), LifecycleError> {
        if now > entry.reclassify_until {
            return Err(LifecycleError::DeadlineExpired);
        }
        if entry.status != EntryStatus::Missed {
            return Err(LifecycleError::InvalidReclassificationSource);
        }
        match target_status {
            EntryStatus::Skipped | EntryStatus::Carried | EntryStatus::Dropped => {
                entry.status = target_status;
                entry.reason = reason;
                entry.resolved_at = Some(now);
                Ok(())
            }
            _ => Err(LifecycleError::InvalidReclassificationTarget),
        }
    }

    /// Day close according to PRD §7.4:
    /// Turns every pending entry into missed.
    pub fn close_day_entry(entry: &mut QuestEntry, now: chrono::DateTime<chrono::Utc>) {
        if entry.status == EntryStatus::Pending {
            entry.status = EntryStatus::Missed;
            entry.resolved_at = Some(now);
        }
    }
}

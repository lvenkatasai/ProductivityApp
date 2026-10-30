//! Domain models for the five sources of quests (PRD §6, §7, §8).
//!
//! Every type is stored as a `Record` payload (JSON) by table name:
//! goals, habits, practices, workout_plans, workout_sessions,
//! focus_sessions, day_logs, user_stats, quest_entries.

use crate::recurrence::Recurrence;
use crate::tier::Tier;
use serde::{Deserialize, Serialize};

// ---------------------------------------------------------------------------
// Goals (PRD §8.2)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum GoalMethod {
    Numeric,
    Milestones,
    Tasks,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum GoalPeriod {
    Daily,
    Weekly,
    Monthly,
    Long,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Milestone {
    pub name: String,
    #[serde(default)]
    pub done: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Goal {
    pub id: uuid::Uuid,
    pub name: String,
    pub area: String,
    pub period: GoalPeriod,
    pub method: GoalMethod,
    #[serde(default)]
    pub target: f64,
    #[serde(default)]
    pub unit: String,
    #[serde(default)]
    pub current: f64,
    #[serde(default)]
    pub milestones: Vec<Milestone>,
    #[serde(default)]
    pub deadline: Option<chrono::NaiveDate>,
    #[serde(default)]
    pub note: String,
    #[serde(default)]
    pub archived: bool,
}

// ---------------------------------------------------------------------------
// Habits (PRD §8.1)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Habit {
    pub id: uuid::Uuid,
    pub name: String,
    pub area: String,
    pub tier: Tier,
    pub recurrence: Recurrence,
    pub target: f64,
    #[serde(default)]
    pub unit: String,
    #[serde(default = "default_true")]
    pub active: bool,
    /// Start date used by EveryNDays recurrence.
    #[serde(default)]
    pub start_date: chrono::NaiveDate,
    /// Aggregated completion history for streak/consistency display.
    /// Each entry: day_key string -> done (true) or skipped (false).
    #[serde(default)]
    pub completions: std::collections::BTreeMap<String, bool>,
}

fn default_true() -> bool {
    true
}

// ---------------------------------------------------------------------------
// Practice (PRD §8.4)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MediaKind {
    Text,
    Image,
    Audio,
    Video,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PracticeMedia {
    pub kind: MediaKind,
    #[serde(default)]
    pub name: String,
    /// For text media.
    #[serde(default)]
    pub text: Option<String>,
    /// Base64 data URL for image/audio/video.
    #[serde(default)]
    pub url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Practice {
    pub id: uuid::Uuid,
    pub name: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub media: Vec<PracticeMedia>,
    /// Daily target count (e.g. 108).
    pub target: f64,
    #[serde(default)]
    pub unit: String,
    #[serde(default = "default_true")]
    pub active: bool,
    /// Current count, valid for `last_day_key` only.
    #[serde(default)]
    pub current_count: f64,
    /// Day the counter belongs to (day_key string).
    #[serde(default)]
    pub last_day_key: String,
}

// ---------------------------------------------------------------------------
// Workout (PRD §8.5)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SetTemplate {
    pub reps: u32,
    #[serde(default)]
    pub weight: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExerciseTemplate {
    pub name: String,
    #[serde(default)]
    pub sets: Vec<SetTemplate>,
}

/// One planned day. `day` is 0..6 where 0 = Monday.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkoutPlan {
    pub id: uuid::Uuid,
    pub day: u8,
    #[serde(default)]
    pub rest_day: bool,
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub exercises: Vec<ExerciseTemplate>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SetLog {
    #[serde(default)]
    pub reps: u32,
    #[serde(default)]
    pub weight: f64,
    #[serde(default)]
    pub done: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExerciseLog {
    pub name: String,
    #[serde(default)]
    pub sets: Vec<SetLog>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkoutSession {
    pub id: uuid::Uuid,
    pub day_key: String,
    #[serde(default)]
    pub plan_name: String,
    #[serde(default)]
    pub exercises: Vec<ExerciseLog>,
    #[serde(default)]
    pub started_at: Option<chrono::DateTime<chrono::Utc>>,
    #[serde(default)]
    pub completed: bool,
}

// ---------------------------------------------------------------------------
// Focus sessions (PRD §8.3)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FocusSession {
    pub id: uuid::Uuid,
    /// day_key string (YYYY-MM-DD).
    pub day_key: String,
    pub minutes: u32,
    #[serde(default)]
    pub linked_to: String,
    #[serde(default)]
    pub started_at: chrono::DateTime<chrono::Utc>,
    #[serde(default)]
    pub completed: bool,
}

// ---------------------------------------------------------------------------
// Day log + user stats (PRD §7, §9)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct DayLog {
    /// day_key string (YYYY-MM-DD).
    pub day_key: String,
    #[serde(default)]
    pub wake_time: Option<String>,
    #[serde(default)]
    pub intention: Option<String>,
    #[serde(default)]
    pub began_at: Option<chrono::DateTime<chrono::Utc>>,
    #[serde(default)]
    pub closed_at: Option<chrono::DateTime<chrono::Utc>>,
    #[serde(default)]
    pub final_score: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct UserStats {
    pub overall_xp: u32,
    pub current_streak: u32,
    pub best_streak: u32,
    #[serde(default)]
    pub area_xp: std::collections::BTreeMap<String, u32>,
}
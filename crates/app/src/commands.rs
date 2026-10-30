use prod_os_core::domain::{
    DayLog, FocusSession, Goal, GoalMethod, Habit, Milestone, Practice, SetLog,
    UserStats, WorkoutPlan, WorkoutSession, ExerciseLog,
};
use prod_os_core::score::{calculate_daily_score, calculate_daily_xp, QuestEntry};
use prod_os_core::tier::{EntryStatus, SkipReason, Tier};
use prod_os_core::{EntryLifecycle, Recurrence};
use prod_os_store::{list_typed, put_record, save_typed, get_typed, Storage, StoreError};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

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
        Self { success: true, data: Some(data), error: None }
    }
    pub fn err_msg(msg: impl Into<String>) -> Self {
        Self { success: false, data: None, error: Some(msg.into()) }
    }
}

// Table names
const T_GOALS: &str = "goals";
const T_HABITS: &str = "habits";
const T_PRACTICES: &str = "practices";
const T_PLANS: &str = "workout_plans";
const T_SESSIONS: &str = "workout_sessions";
const T_FOCUS: &str = "focus_sessions";
const T_DAYS: &str = "day_logs";
const T_STATS: &str = "user_stats";
const T_ENTRIES: &str = "quest_entries";

const ROLLOVER_HOUR: u32 = 4;
/// The single user_stats record lives under the nil uuid.
const STATS_ID: Uuid = Uuid::nil();

// ---------------------------------------------------------------------------
// Shared input/output shapes
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MainPick {
    pub source_type: String,
    pub source_id: Uuid,
    pub name: String,
    pub target: f64,
    #[serde(default)]
    pub area: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BeginDayInput {
    pub day: String,
    #[serde(default)]
    pub wake_time: Option<String>,
    #[serde(default)]
    pub intention: Option<String>,
    #[serde(default)]
    pub main_picks: Vec<MainPick>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DayState {
    pub day_key: String,
    pub entries: Vec<QuestEntry>,
    pub score: prod_os_core::DailyScoreResult,
    pub day_log: Option<DayLog>,
    pub stats: UserStats,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CloseDayResult {
    pub score: prod_os_core::DailyScoreResult,
    pub stats: UserStats,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoalInput {
    pub name: String,
    pub area: String,
    pub period: prod_os_core::domain::GoalPeriod,
    pub method: GoalMethod,
    #[serde(default)]
    pub target: f64,
    #[serde(default)]
    pub unit: String,
    #[serde(default)]
    pub milestone_names: Vec<String>,
    #[serde(default)]
    pub deadline: Option<chrono::NaiveDate>,
    #[serde(default)]
    pub note: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddFocusInput {
    pub day: String,
    pub minutes: u32,
    #[serde(default)]
    pub linked_to: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DayScoresItem {
    pub day_key: String,
    pub score: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeeklyReport {
    pub overall_pct: f64,
    pub best_day: Option<String>,
    pub weakest_area: Option<String>,
    pub focus_minutes: u32,
    pub area_xp_7d: std::collections::BTreeMap<String, u32>,
    pub day_scores: Vec<DayScoresItem>,
    pub skip_counts: std::collections::BTreeMap<String, u32>,
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

fn parse_day(day: &str) -> Result<chrono::NaiveDate, String> {
    chrono::NaiveDate::parse_from_str(day, "%Y-%m-%d")
        .map_err(|e| format!("bad day '{day}': {e}"))
}

fn local_offset() -> chrono::FixedOffset {
    *chrono::Local::now().offset()
}

fn reclassify_deadline_for(day: chrono::NaiveDate) -> chrono::DateTime<chrono::Utc> {
    prod_os_core::reclassify_deadline(day, ROLLOVER_HOUR, local_offset())
}

fn weekday_index(day: chrono::NaiveDate) -> u8 {
    use chrono::Datelike;
    day.weekday().num_days_from_monday() as u8
}

async fn get_stats(store: &dyn Storage) -> Result<UserStats, StoreError> {
    match get_typed::<UserStats>(store, T_STATS, STATS_ID).await {
        Ok(s) => Ok(s),
        Err(StoreError::NotFound(_)) => {
            let s = UserStats::default();
            put_record(store, T_STATS, STATS_ID, &s).await?;
            Ok(s)
        }
        Err(e) => Err(e),
    }
}

async fn get_day_log(store: &dyn Storage, day: &str) -> Result<Option<DayLog>, StoreError> {
    match get_typed::<DayLog>(store, T_DAYS, uuid_from_day(day)).await {
        Ok(d) => Ok(Some(d)),
        Err(StoreError::NotFound(_)) => Ok(None),
        Err(e) => Err(e),
    }
}

fn uuid_from_day(day: &str) -> Uuid {
    // Deterministic uuid v5-ish: hash the day string. Simple and stable.
    let hash = md5_of(day);
    Uuid::from_bytes(hash)
}

fn md5_of(s: &str) -> [u8; 16] {
    // FNV-based pseudo-hash (NOT md5 despite the name) -> deterministic bytes.
    let mut a: u64 = 0xcbf29ce484222325;
    for b in s.as_bytes() {
        a ^= *b as u64;
        a = a.wrapping_mul(0x100000001b3);
    }
    let mut out = [0u8; 16];
    out[..8].copy_from_slice(&a.to_le_bytes());
    let mut b: u64 = 0x9e3779b97f4a7c15;
    b = b.wrapping_add(a);
    for c in s.bytes().rev() {
        b ^= c as u64;
        b = b.wrapping_mul(0x2545f4914f6cdd1d);
    }
    out[8..].copy_from_slice(&b.to_le_bytes());
    out
}

async fn list_entries(store: &dyn Storage, day: chrono::NaiveDate) -> Result<Vec<QuestEntry>, StoreError> {
    let all: Vec<QuestEntry> = list_typed(store, T_ENTRIES).await?;
    Ok(all.into_iter().filter(|e| e.day_key == day).collect())
}

fn entry_fraction(e: &QuestEntry) -> f64 {
    match e.status {
        EntryStatus::Done => 1.0,
        EntryStatus::Partial => {
            if e.target <= 0.0 {
                if e.progress > 0.0 { 1.0 } else { 0.0 }
            } else {
                (e.progress / e.target).clamp(0.0, 1.0)
            }
        }
        _ => 0.0,
    }
}

async fn save_entry(store: &dyn Storage, e: &QuestEntry) -> Result<(), StoreError> {
    save_typed(store, T_ENTRIES, e.id, e).await
}

async fn build_day_state(
    store: &dyn Storage,
    day: chrono::NaiveDate,
) -> Result<DayState, String> {
    let entries = list_entries(store, day)
        .await
        .map_err(|e| e.to_string())?;
    let score = calculate_daily_score(&entries);
    let stats = get_stats(store).await.map_err(|e| e.to_string())?;
    let day_log = get_day_log(store, &day.to_string())
        .await
        .map_err(|e| e.to_string())?;
    Ok(DayState {
        day_key: day.to_string(),
        entries,
        score,
        day_log,
        stats,
    })
}

// ---------------------------------------------------------------------------
// Day lifecycle (PRD §7.2, §7.4)
// ---------------------------------------------------------------------------

pub async fn begin_day(store: &dyn Storage, input: BeginDayInput) -> Result<DayState, String> {
    let day = parse_day(&input.day)?;
    let now = chrono::Utc::now();

    let existing_log = get_day_log(store, &input.day).await.map_err(|e| e.to_string())?;
    if existing_log.as_ref().and_then(|d| d.began_at).is_some() {
        return Err("day already begun".to_string());
    }

    let deadline = reclassify_deadline_for(day);
    let mut created: Vec<QuestEntry> = Vec::new();

    // Main picks (max 3, tier Core) — chosen during the wizard.
    for pick in input.main_picks.iter().take(3) {
        let entry = QuestEntry {
            id: Uuid::new_v4(),
            day_key: day,
            source_type: pick.source_type.clone(),
            source_id: pick.source_id,
            name: pick.name.clone(),
            tier: Tier::Core,
            target: pick.target.max(1.0),
            progress: 0.0,
            status: EntryStatus::Pending,
            reason: None,
            resolved_at: None,
            reclassify_until: deadline,
            area: pick.area.clone(),
        };
        put_record(store, T_ENTRIES, entry.id, &entry).await.map_err(|e| e.to_string())?;
        created.push(entry);
    }

    // Automatic entries: habits due today (their own tier).
    let habits: Vec<Habit> = list_typed(store, T_HABITS).await.map_err(|e| e.to_string())?;
    for habit in habits.iter().filter(|h| h.active) {
        if !habit.recurrence.is_due_on(day, habit.start_date) {
            continue;
        }
        // Idempotent: skip if an entry for this habit already exists today.
        let already = created.iter().any(|e| e.source_id == habit.id);
        if already {
            continue;
        }
        let entry = QuestEntry {
            id: Uuid::new_v4(),
            day_key: day,
            source_type: "habit".into(),
            source_id: habit.id,
            name: habit.name.clone(),
            tier: habit.tier,
            target: habit.target.max(1.0),
            progress: 0.0,
            status: EntryStatus::Pending,
            reason: None,
            resolved_at: None,
            reclassify_until: deadline,
            area: habit.area.clone(),
        };
        put_record(store, T_ENTRIES, entry.id, &entry).await.map_err(|e| e.to_string())?;
        created.push(entry);
    }

    // Practices: one entry per active practice, tier Standard.
    let practices: Vec<Practice> = list_typed(store, T_PRACTICES).await.map_err(|e| e.to_string())?;
    for pr in practices.iter().filter(|p| p.active) {
        if created.iter().any(|e| e.source_id == pr.id) {
            continue;
        }
        let entry = QuestEntry {
            id: Uuid::new_v4(),
            day_key: day,
            source_type: "practice".into(),
            source_id: pr.id,
            name: pr.name.clone(),
            tier: Tier::Standard,
            target: if pr.target > 0.0 { pr.target } else { 1.0 },
            progress: 0.0,
            status: EntryStatus::Pending,
            reason: None,
            resolved_at: None,
            reclassify_until: deadline,
            area: "practice".into(),
        };
        put_record(store, T_ENTRIES, entry.id, &entry).await.map_err(|e| e.to_string())?;
        created.push(entry);
    }

    // Workout: one entry if today's plan is not a rest day, tier Standard.
    let plans: Vec<WorkoutPlan> = list_typed(store, T_PLANS).await.map_err(|e| e.to_string())?;
    if let Some(plan) = plans.iter().find(|p| p.day == weekday_index(day)) {
        if !plan.rest_day {
            let name = if plan.name.is_empty() { "Workout".to_string() } else { format!("Workout: {}", plan.name) };
            let entry = QuestEntry {
                id: Uuid::new_v4(),
                day_key: day,
                source_type: "workout".into(),
                source_id: plan.id,
                name,
                tier: Tier::Standard,
                target: 1.0,
                progress: 0.0,
                status: EntryStatus::Pending,
                reason: None,
                resolved_at: None,
                reclassify_until: deadline,
                area: "fitness".into(),
            };
            put_record(store, T_ENTRIES, entry.id, &entry).await.map_err(|e| e.to_string())?;
            created.push(entry);
        }
    }

    // Day log.
    let log = DayLog {
        day_key: input.day.clone(),
        wake_time: input.wake_time,
        intention: input.intention,
        began_at: Some(now),
        closed_at: None,
        final_score: None,
    };
    put_record(store, T_DAYS, uuid_from_day(&input.day), &log).await.map_err(|e| e.to_string())?;

    build_day_state(store, day).await
}

pub async fn close_day(store: &dyn Storage, day: &str) -> Result<CloseDayResult, String> {
    let day_date = parse_day(day)?;
    let now = chrono::Utc::now();
    let mut entries = list_entries(store, day_date).await.map_err(|e| e.to_string())?;

    // Recompute after closing.
    for e in entries.iter_mut() {
        if e.status == EntryStatus::Pending {
            e.status = EntryStatus::Missed;
            e.resolved_at = Some(now);
        }
        save_entry(store, e).await.map_err(|err| err.to_string())?;
    }

    let score = calculate_daily_score(&entries);
    let xp = calculate_daily_xp(&entries);

    // Area XP per entry.
    let mut stats = get_stats(store).await.map_err(|e| e.to_string())?;
    stats.overall_xp = stats.overall_xp.saturating_add(xp);
    for e in entries.iter() {
        let frac = entry_fraction(e);
        if frac <= 0.0 {
            continue;
        }
        let area_xp = (e.tier.xp_value() as f64 * frac).round() as u32;
        prod_os_core::stats::add_area_xp(&mut stats, &e.area, area_xp);
    }
    prod_os_core::stats::apply_streak(&mut stats, score.final_score);
    save_typed(store, T_STATS, STATS_ID, &stats).await.map_err(|e| e.to_string())?;

    // Day log.
    let id = uuid_from_day(day);
    let mut log = match get_typed::<DayLog>(store, T_DAYS, id).await {
        Ok(l) => l,
        Err(_) => DayLog { day_key: day.to_string(), ..Default::default() },
    };
    log.closed_at = Some(now);
    log.final_score = Some(score.final_score);
    save_typed(store, T_DAYS, id, &log).await.map_err(|e| e.to_string())?;

    Ok(CloseDayResult { score, stats })
}

pub async fn get_day(store: &dyn Storage, day: &str) -> Result<DayState, String> {
    build_day_state(store, parse_day(day)?).await
}

// ---------------------------------------------------------------------------
// Quest entry lifecycle (PRD §7.3)
// ---------------------------------------------------------------------------

pub async fn mark_done(store: &dyn Storage, entry_id: Uuid) -> Result<(), String> {
    let mut e: QuestEntry = get_typed(store, T_ENTRIES, entry_id).await.map_err(|err| err.to_string())?;
    EntryLifecycle::mark_done(&mut e, chrono::Utc::now()).map_err(|err| err.to_string())?;
    save_entry(store, &e).await.map_err(|err| err.to_string())
}

pub async fn update_progress(store: &dyn Storage, entry_id: Uuid, progress: f64) -> Result<(), String> {
    let mut e: QuestEntry = get_typed(store, T_ENTRIES, entry_id).await.map_err(|err| err.to_string())?;
    EntryLifecycle::mark_partial(&mut e, progress, chrono::Utc::now()).map_err(|err| err.to_string())?;
    save_entry(store, &e).await.map_err(|err| err.to_string())
}

pub async fn skip_entry(store: &dyn Storage, entry_id: Uuid, reason: SkipReason) -> Result<(), String> {
    let mut e: QuestEntry = get_typed(store, T_ENTRIES, entry_id).await.map_err(|err| err.to_string())?;
    EntryLifecycle::mark_skipped(&mut e, reason, chrono::Utc::now()).map_err(|err| err.to_string())?;
    save_entry(store, &e).await.map_err(|err| err.to_string())
}

pub async fn undo_entry(store: &dyn Storage, entry_id: Uuid) -> Result<(), String> {
    let mut e: QuestEntry = get_typed(store, T_ENTRIES, entry_id).await.map_err(|err| err.to_string())?;
    EntryLifecycle::undo(&mut e, chrono::Utc::now()).map_err(|err| err.to_string())?;
    save_entry(store, &e).await.map_err(|err| err.to_string())
}

pub async fn reclassify_entry(
    store: &dyn Storage,
    entry_id: Uuid,
    target_status: EntryStatus,
    reason: Option<SkipReason>,
) -> Result<(), String> {
    let mut e: QuestEntry = get_typed(store, T_ENTRIES, entry_id).await.map_err(|err| err.to_string())?;
    EntryLifecycle::reclassify(&mut e, target_status, reason, chrono::Utc::now())
        .map_err(|err| err.to_string())?;
    save_entry(store, &e).await.map_err(|err| err.to_string())
}

// ---------------------------------------------------------------------------
// Goals (PRD §8.2)
// ---------------------------------------------------------------------------

pub async fn list_goals(store: &dyn Storage) -> Result<Vec<Goal>, String> {
    list_typed(store, T_GOALS).await.map_err(|e| e.to_string())
}

pub async fn create_goal(store: &dyn Storage, input: GoalInput) -> Result<Goal, String> {
    let goal = Goal {
        id: Uuid::new_v4(),
        name: input.name.clone(),
        area: input.area.clone(),
        period: input.period,
        method: input.method,
        target: input.target,
        unit: input.unit.clone(),
        current: 0.0,
        milestones: input.milestone_names.iter().map(|n| Milestone { name: n.clone(), done: false }).collect(),
        deadline: input.deadline,
        note: input.note.clone(),
        archived: false,
    };
    put_record(store, T_GOALS, goal.id, &goal).await.map_err(|e| e.to_string())?;
    Ok(goal)
}

pub async fn update_goal(store: &dyn Storage, goal: Goal) -> Result<(), String> {
    save_typed(store, T_GOALS, goal.id, &goal).await.map_err(|e| e.to_string())
}

pub async fn delete_goal(store: &dyn Storage, id: Uuid) -> Result<(), String> {
    store.delete(T_GOALS, id).await.map_err(|e| e.to_string())
}

pub async fn goal_progress(store: &dyn Storage, id: Uuid, delta: f64) -> Result<Goal, String> {
    let mut goal: Goal = get_typed(store, T_GOALS, id).await.map_err(|e| e.to_string())?;
    goal.current = (goal.current + delta).max(0.0);
    if goal.target > 0.0 {
        goal.current = goal.current.min(goal.target);
    }
    save_typed(store, T_GOALS, id, &goal).await.map_err(|e| e.to_string())?;
    Ok(goal)
}

pub async fn toggle_milestone(store: &dyn Storage, id: Uuid, index: usize) -> Result<Goal, String> {
    let mut goal: Goal = get_typed(store, T_GOALS, id).await.map_err(|e| e.to_string())?;
    if index >= goal.milestones.len() {
        return Err("milestone index out of range".to_string());
    }
    goal.milestones[index].done = !goal.milestones[index].done;
    save_typed(store, T_GOALS, id, &goal).await.map_err(|e| e.to_string())?;
    Ok(goal)
}

// ---------------------------------------------------------------------------
// Habits (PRD §8.1)
// ---------------------------------------------------------------------------

pub async fn list_habits(store: &dyn Storage) -> Result<Vec<Habit>, String> {
    list_typed(store, T_HABITS).await.map_err(|e| e.to_string())
}

pub async fn create_habit(store: &dyn Storage, mut habit: Habit) -> Result<Habit, String> {
    habit.id = Uuid::new_v4();
    if habit.start_date == chrono::NaiveDate::default() {
        habit.start_date = chrono::Local::now().date_naive();
    }
    put_record(store, T_HABITS, habit.id, &habit).await.map_err(|e| e.to_string())?;
    Ok(habit)
}

pub async fn update_habit(store: &dyn Storage, habit: Habit) -> Result<(), String> {
    save_typed(store, T_HABITS, habit.id, &habit).await.map_err(|e| e.to_string())
}

pub async fn delete_habit(store: &dyn Storage, id: Uuid) -> Result<(), String> {
    store.delete(T_HABITS, id).await.map_err(|e| e.to_string())
}

/// Record a habit completion (or un-completion) for a day.
pub async fn habit_complete(store: &dyn Storage, id: Uuid, day: String, done: bool) -> Result<Habit, String> {
    let mut habit: Habit = get_typed(store, T_HABITS, id).await.map_err(|e| e.to_string())?;
    if done {
        habit.completions.insert(day, true);
    } else {
        habit.completions.remove(&day);
    }
    save_typed(store, T_HABITS, id, &habit).await.map_err(|e| e.to_string())?;
    Ok(habit)
}

// ---------------------------------------------------------------------------
// Practice (PRD §8.4)
// ---------------------------------------------------------------------------

pub async fn list_practices(store: &dyn Storage) -> Result<Vec<Practice>, String> {
    list_typed(store, T_PRACTICES).await.map_err(|e| e.to_string())
}

pub async fn create_practice(store: &dyn Storage, mut practice: Practice) -> Result<Practice, String> {
    practice.id = Uuid::new_v4();
    put_record(store, T_PRACTICES, practice.id, &practice).await.map_err(|e| e.to_string())?;
    Ok(practice)
}

pub async fn delete_practice(store: &dyn Storage, id: Uuid) -> Result<(), String> {
    store.delete(T_PRACTICES, id).await.map_err(|e| e.to_string())
}

/// Increment/decrement/reset today's practice counter; mirrors the count into
/// today's quest entry if one exists.
pub async fn add_practice_count(store: &dyn Storage, id: Uuid, day: String, delta: f64) -> Result<Practice, String> {
    let mut pr: Practice = get_typed(store, T_PRACTICES, id).await.map_err(|e| e.to_string())?;
    if pr.last_day_key != day {
        pr.last_day_key = day.clone();
        pr.current_count = 0.0;
    }
    pr.current_count = (pr.current_count + delta).max(0.0);
    if pr.target > 0.0 {
        pr.current_count = pr.current_count.min(pr.target);
    }
    save_typed(store, T_PRACTICES, id, &pr).await.map_err(|e| e.to_string())?;

    let day_date = parse_day(&day)?;
    if let Some(mut entry) = list_entries(store, day_date)
        .await
        .map_err(|e| e.to_string())?
        .into_iter()
        .find(|e| e.source_id == id && e.source_type == "practice")
    {
        update_progress(store, entry.id, pr.current_count).await?;
    }
    Ok(pr)
}

// ---------------------------------------------------------------------------
// Workout (PRD §8.5)
// ---------------------------------------------------------------------------

pub async fn workout_get_week_plan(store: &dyn Storage) -> Result<Vec<WorkoutPlan>, String> {
    let mut plans: Vec<WorkoutPlan> = list_typed(store, T_PLANS).await.map_err(|e| e.to_string())?;
    // Seed the seven days once.
    if plans.is_empty() {
        for day in 0u8..7 {
            let plan = WorkoutPlan {
                id: Uuid::new_v4(),
                day,
                rest_day: true,
                name: String::new(),
                exercises: Vec::new(),
            };
            put_record(store, T_PLANS, plan.id, &plan).await.map_err(|e| e.to_string())?;
            plans.push(plan);
        }
        plans.sort_by_key(|p| p.day);
    }
    plans.sort_by_key(|p| p.day);
    Ok(plans)
}

pub async fn workout_set_day(store: &dyn Storage, plan: WorkoutPlan) -> Result<(), String> {
    // Replace by day-of-week.
    let existing: Vec<WorkoutPlan> = list_typed(store, T_PLANS).await.map_err(|e| e.to_string())?;
    if let Some(old) = existing.iter().find(|p| p.day == plan.day) {
        let id = old.id;
        save_typed(store, T_PLANS, id, &plan).await.map_err(|e| e.to_string())?;
    } else {
        put_record(store, T_PLANS, plan.id, &plan).await.map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Toggle a set's done flag in today's session, creating the session from the
/// plan on first use.
pub async fn workout_toggle_set(store: &dyn Storage, day: String, ex_index: usize, set_index: usize) -> Result<WorkoutSession, String> {
    let day_date = parse_day(&day)?;
    let mut sessions: Vec<WorkoutSession> = list_typed(store, T_SESSIONS).await.map_err(|e| e.to_string())?;
    let mut session = sessions.into_iter().find(|s| s.day_key == day);

    if session.is_none() {
        let plans: Vec<WorkoutPlan> = list_typed(store, T_PLANS).await.map_err(|e| e.to_string())?;
        let plan = plans
            .iter()
            .find(|p| p.day == weekday_index(day_date))
            .ok_or("no plan for that day")?;
        if plan.rest_day || plan.name.is_empty() && plan.exercises.is_empty() {
            return Err("rest day or empty plan".to_string());
        }
        session = Some(WorkoutSession {
            id: Uuid::new_v4(),
            day_key: day.clone(),
            plan_name: plan.name.clone(),
            exercises: plan
                .exercises
                .iter()
                .map(|ex| ExerciseLog {
                    name: ex.name.clone(),
                    sets: ex.sets.iter().map(|s| SetLog { reps: s.reps, weight: s.weight, done: false }).collect(),
                })
                .collect(),
            started_at: Some(chrono::Utc::now()),
            completed: false,
        });
    }

    let mut session = session.unwrap();
    let set = session
        .exercises
        .get_mut(ex_index)
        .and_then(|ex| ex.sets.get_mut(set_index))
        .ok_or("set index out of range")?;
    set.done = !set.done;

    if session.exercises.iter().all(|ex| ex.sets.iter().all(|s| s.done)) {
        session.completed = true;
    }
    save_typed(store, T_SESSIONS, session.id, &session).await.map_err(|e| e.to_string())?;
    Ok(session)
}

// ---------------------------------------------------------------------------
// Focus sessions (PRD §8.3)
// ---------------------------------------------------------------------------

pub async fn add_focus_session(store: &dyn Storage, input: AddFocusInput) -> Result<FocusSession, String> {
    let session = FocusSession {
        id: Uuid::new_v4(),
        day_key: input.day.clone(),
        minutes: input.minutes,
        linked_to: input.linked_to,
        started_at: chrono::Utc::now(),
        completed: true,
    };
    put_record(store, T_FOCUS, session.id, &session).await.map_err(|e| e.to_string())?;
    Ok(session)
}

pub async fn list_focus(store: &dyn Storage, day: String) -> Result<Vec<FocusSession>, String> {
    let all: Vec<FocusSession> = list_typed(store, T_FOCUS).await.map_err(|e| e.to_string())?;
    Ok(all.into_iter().filter(|s| s.day_key == day).collect())
}

// ---------------------------------------------------------------------------
// Calendar + reports (PRD §9)
// ---------------------------------------------------------------------------

pub async fn get_day_scores(
    store: &dyn Storage,
    from: String,
    to: String,
) -> Result<Vec<DayScoresItem>, String> {
    let from_date = parse_day(&from)?;
    let to_date = parse_day(&to)?;
    let mut logs: Vec<DayLog> = list_typed(store, T_DAYS).await.map_err(|e| e.to_string())?;
    logs.retain(|l| {
        match (parse_day(&l.day_key), l.final_score) {
            (Ok(d), Some(score)) => d >= from_date && d <= to_date,
            _ => false,
        }
    });
    logs.sort_by(|a, b| a.day_key.cmp(&b.day_key));
    Ok(logs
        .into_iter()
        .filter_map(|l| l.final_score.map(|s| DayScoresItem { day_key: l.day_key, score: s }))
        .collect())
}

pub async fn get_reports(store: &dyn Storage) -> Result<WeeklyReport, String> {
    let today = chrono::Local::now().date_naive();
    let from = today - chrono::Duration::days(6);

    let mut logs: Vec<DayLog> = list_typed(store, T_DAYS).await.map_err(|e| e.to_string())?;
    logs.retain(|l| match (parse_day(&l.day_key), l.final_score) {
        (Ok(d), Some(_)) => d >= from && d <= today,
        _ => false,
    });

    let scores: Vec<f64> = logs.iter().filter_map(|l| l.final_score).collect();
    let overall_pct = if scores.is_empty() { 0.0 } else { scores.iter().sum::<f64>() / scores.len() as f64 };
    let best_day = logs
        .iter()
        .max_by(|a, b| a.final_score.partial_cmp(&b.final_score).unwrap_or(std::cmp::Ordering::Equal))
        .filter(|l| l.final_score.unwrap_or(0.0) > 0.0)
        .map(|l| l.day_key.clone());

    // Area XP over the last 7 days from entries.
    let mut area_xp: std::collections::BTreeMap<String, u32> = Default::default();
    let mut skip_counts: std::collections::BTreeMap<String, u32> = Default::default();
    let entries: Vec<QuestEntry> = list_typed(store, T_ENTRIES).await.map_err(|e| e.to_string())?;
    for e in entries.iter().filter(|e| e.day_key >= from && e.day_key <= today) {
        let frac = entry_fraction(e);
        if frac > 0.0 {
            *area_xp.entry(e.area.clone()).or_insert(0) += (e.tier.xp_value() as f64 * frac).round() as u32;
        }
        if let Some(reason) = e.reason {
            let key = format!("{reason:?}").to_lowercase();
            *skip_counts.entry(key).or_insert(0) += 1;
        }
    }
    let weakest_area = area_xp
        .iter()
        .min_by_key(|(_, v)| **v)
        .map(|(k, _)| k.clone());

    let focus: Vec<FocusSession> = list_typed(store, T_FOCUS).await.map_err(|e| e.to_string())?;
    let focus_minutes = focus
        .iter()
        .filter(|s| match parse_day(&s.day_key) {
            Ok(d) => d >= from && d <= today,
            Err(_) => false,
        })
        .map(|s| s.minutes)
        .sum();

    let mut day_scores: Vec<DayScoresItem> = logs
        .into_iter()
        .filter_map(|l| l.final_score.map(|s| DayScoresItem { day_key: l.day_key, score: s }))
        .collect();
    day_scores.sort_by(|a, b| a.day_key.cmp(&b.day_key));

    Ok(WeeklyReport {
        overall_pct,
        best_day,
        weakest_area,
        focus_minutes,
        area_xp_7d: area_xp,
        day_scores,
        skip_counts,
    })
}

// ---------------------------------------------------------------------------
// OS + backup
// ---------------------------------------------------------------------------

#[cfg(windows)]
pub fn set_autostart(enabled: bool) -> Result<(), String> {
    crate::os::windows::set_autostart(enabled).map_err(|e| e.to_string())
}

#[cfg(not(windows))]
pub fn set_autostart(_enabled: bool) -> Result<(), String> {
    Ok(())
}

pub async fn backup_now(store: &dyn Storage, path: String) -> Result<(), String> {
    store.backup(&path).await.map_err(|e| e.to_string())
}
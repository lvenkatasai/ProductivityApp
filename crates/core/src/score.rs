use crate::tier::{EntryStatus, Tier};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuestEntry {
    pub id: uuid::Uuid,
    pub day_key: chrono::NaiveDate,
    pub source_type: String,
    pub source_id: uuid::Uuid,
    pub name: String,
    pub tier: Tier,
    pub target: f64,
    pub progress: f64,
    pub status: EntryStatus,
    pub reason: Option<crate::tier::SkipReason>,
    pub resolved_at: Option<chrono::DateTime<chrono::Utc>>,
    pub reclassify_until: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuestScoreBreakdown {
    pub entry_id: uuid::Uuid,
    pub name: String,
    pub tier: Tier,
    pub status: EntryStatus,
    pub weight: u32,
    pub earned_fraction: f64,
    pub points_contributed: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyScoreResult {
    pub final_score: f64,
    pub due_weight: u32,
    pub earned_weight: f64,
    pub bonus_points: f64,
    pub breakdown: Vec<QuestScoreBreakdown>,
    pub is_empty: bool,
}

/// Calculate daily score according to PRD §7.3
/// - Weights: Core 3, Standard 2, Bonus 0
/// - due weight = sum of weights of Core and Standard entries, excluding skipped
/// - Earned fraction: done 1; partial = clamp(progress / target, 0, 1), with target 0 giving 1 if progress > 0 else 0; missed, dropped, carried, pending 0
/// - Base score = earned weight / due weight * 100. If due weight is 0, score is 0.
/// - Bonus entries add 2.5 points * earned fraction each, capped at +10.
/// - Final score = min(100.0, round to 1 decimal).
pub fn calculate_daily_score(entries: &[QuestEntry]) -> DailyScoreResult {
    let mut due_weight: u32 = 0;
    let mut earned_weight: f64 = 0.0;
    let mut bonus_points_raw: f64 = 0.0;
    let mut breakdown = Vec::with_capacity(entries.len());

    for entry in entries {
        let earned_fraction = match entry.status {
            EntryStatus::Done => 1.0,
            EntryStatus::Partial => {
                if entry.target <= 0.0 {
                    if entry.progress > 0.0 { 1.0 } else { 0.0 }
                } else {
                    (entry.progress / entry.target).clamp(0.0, 1.0)
                }
            }
            EntryStatus::Skipped
            | EntryStatus::Missed
            | EntryStatus::Carried
            | EntryStatus::Dropped
            | EntryStatus::Pending => 0.0,
        };

        let weight = entry.tier.default_weight();
        let mut points_contributed = 0.0;

        match entry.tier {
            Tier::Core | Tier::Standard => {
                if entry.status != EntryStatus::Skipped {
                    due_weight += weight;
                    earned_weight += weight as f64 * earned_fraction;
                }
            }
            Tier::Bonus => {
                if entry.status != EntryStatus::Skipped {
                    let pts = 2.5 * earned_fraction;
                    bonus_points_raw += pts;
                    points_contributed = pts;
                }
            }
        }

        breakdown.push(QuestScoreBreakdown {
            entry_id: entry.id,
            name: entry.name.clone(),
            tier: entry.tier,
            status: entry.status,
            weight,
            earned_fraction,
            points_contributed,
        });
    }

    let is_empty = due_weight == 0;
    let base_score = if due_weight > 0 {
        (earned_weight / due_weight as f64) * 100.0
    } else {
        0.0
    };

    let bonus_capped = bonus_points_raw.min(10.0);
    let final_score_raw = if due_weight > 0 {
        (base_score + bonus_capped).min(100.0)
    } else {
        0.0
    };

    // Round to 1 decimal place
    let final_score = (final_score_raw * 10.0).round() / 10.0;

    DailyScoreResult {
        final_score,
        due_weight,
        earned_weight,
        bonus_points: (bonus_capped * 10.0).round() / 10.0,
        breakdown,
        is_empty,
    }
}

/// Calculate XP per entry according to PRD §7.5:
/// - XP per entry = tier XP * earned fraction
/// - Tier XP: Core 30, Standard 15, Bonus 5
/// - Daily caps per tier: Core 90, Standard 60, Bonus 10
pub fn calculate_daily_xp(entries: &[QuestEntry]) -> u32 {
    let mut core_xp = 0.0;
    let mut standard_xp = 0.0;
    let mut bonus_xp = 0.0;

    for entry in entries {
        let fraction = match entry.status {
            EntryStatus::Done => 1.0,
            EntryStatus::Partial => {
                if entry.target <= 0.0 {
                    if entry.progress > 0.0 { 1.0 } else { 0.0 }
                } else {
                    (entry.progress / entry.target).clamp(0.0, 1.0)
                }
            }
            _ => 0.0,
        };

        let val = entry.tier.xp_value() as f64 * fraction;
        match entry.tier {
            Tier::Core => core_xp += val,
            Tier::Standard => standard_xp += val,
            Tier::Bonus => bonus_xp += val,
        }
    }

    let capped_core = core_xp.min(Tier::Core.daily_xp_cap() as f64);
    let capped_standard = standard_xp.min(Tier::Standard.daily_xp_cap() as f64);
    let capped_bonus = bonus_xp.min(Tier::Bonus.daily_xp_cap() as f64);

    (capped_core + capped_standard + capped_bonus).round() as u32
}

#[cfg(test)]
mod tests {
    use super::*;

    fn dummy_entry(tier: Tier, status: EntryStatus, target: f64, progress: f64) -> QuestEntry {
        QuestEntry {
            id: uuid::Uuid::new_v4(),
            day_key: chrono::NaiveDate::from_ymd_opt(2026, 10, 24).unwrap(),
            source_type: "habit".into(),
            source_id: uuid::Uuid::new_v4(),
            name: "Test Entry".into(),
            tier,
            target,
            progress,
            status,
            reason: None,
            resolved_at: None,
            reclassify_until: chrono::Utc::now(),
        }
    }

    #[test]
    fn test_perfect_score_all_done() {
        let entries = vec![
            dummy_entry(Tier::Core, EntryStatus::Done, 1.0, 1.0),
            dummy_entry(Tier::Standard, EntryStatus::Done, 1.0, 1.0),
        ];
        let res = calculate_daily_score(&entries);
        assert_eq!(res.final_score, 100.0);
        assert_eq!(res.due_weight, 5);
        assert!(!res.is_empty);
    }

    #[test]
    fn test_skipped_excluded_from_weight() {
        let entries = vec![
            dummy_entry(Tier::Core, EntryStatus::Done, 1.0, 1.0),
            dummy_entry(Tier::Standard, EntryStatus::Skipped, 1.0, 0.0),
        ];
        let res = calculate_daily_score(&entries);
        assert_eq!(res.due_weight, 3);
        assert_eq!(res.final_score, 100.0);
    }

    #[test]
    fn test_bonus_points_and_cap() {
        let entries = vec![
            dummy_entry(Tier::Core, EntryStatus::Done, 1.0, 1.0), // 3/3 -> 100%
            dummy_entry(Tier::Bonus, EntryStatus::Done, 1.0, 1.0), // +2.5
            dummy_entry(Tier::Bonus, EntryStatus::Done, 1.0, 1.0), // +2.5
            dummy_entry(Tier::Bonus, EntryStatus::Done, 1.0, 1.0), // +2.5
            dummy_entry(Tier::Bonus, EntryStatus::Done, 1.0, 1.0), // +2.5
            dummy_entry(Tier::Bonus, EntryStatus::Done, 1.0, 1.0), // +2.5 (capped at +10)
        ];
        let res = calculate_daily_score(&entries);
        assert_eq!(res.bonus_points, 10.0);
        assert_eq!(res.final_score, 100.0);
    }

    #[test]
    fn test_daily_xp_caps() {
        // 4 Core tasks completed = 4 * 30 = 120 XP, capped at 90
        let entries = vec![
            dummy_entry(Tier::Core, EntryStatus::Done, 1.0, 1.0),
            dummy_entry(Tier::Core, EntryStatus::Done, 1.0, 1.0),
            dummy_entry(Tier::Core, EntryStatus::Done, 1.0, 1.0),
            dummy_entry(Tier::Core, EntryStatus::Done, 1.0, 1.0),
        ];
        let xp = calculate_daily_xp(&entries);
        assert_eq!(xp, 90);
    }
}

//! XP levels, ranks and streak rules (PRD §7.5, §9).

use crate::domain::UserStats;

/// Cumulative XP needed to reach level `n` = 100 * n.
/// Level is 1-based: 0 xp -> level 1, 100 xp -> level 2, ...
pub fn level_for(xp: u32) -> u32 {
    1 + xp / 100
}

/// Ranks with their minimum level.
pub const RANKS: &[(u32, &str)] = &[
    (1, "Novice"),
    (4, "Apprentice"),
    (8, "Journeyman"),
    (14, "Adept Architect"),
    (22, "Master Architect"),
    (32, "Eternal Architect"),
];

pub fn rank_for(level: u32) -> &'static str {
    let mut rank = RANKS[0].1;
    for (min_level, name) in RANKS {
        if level >= *min_level {
            rank = name;
        }
    }
    rank
}

/// Streak rule on day close (score-based, non-punitive):
/// - score >= 50  -> streak +1, best updated
/// - score > 0    -> streak unchanged (barely misses do not matter)
/// - score == 0   -> streak resets
pub fn apply_streak(stats: &mut UserStats, score: f64) {
    if score >= 50.0 {
        stats.current_streak += 1;
        if stats.current_streak > stats.best_streak {
            stats.best_streak = stats.current_streak;
        }
    } else if score <= 0.0 {
        stats.current_streak = 0;
    }
}

/// Add `amount` XP to a life area (no XP is ever lost, PRD §9).
pub fn add_area_xp(stats: &mut UserStats, area: &str, amount: u32) {
    if area.is_empty() {
        return;
    }
    *stats.area_xp.entry(area.to_string()).or_insert(0) += amount;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn levels_and_ranks() {
        assert_eq!(level_for(0), 1);
        assert_eq!(level_for(99), 1);
        assert_eq!(level_for(100), 2);
        assert_eq!(level_for(1300), 14);
        assert_eq!(rank_for(1), "Novice");
        assert_eq!(rank_for(14), "Adept Architect");
        assert_eq!(rank_for(40), "Eternal Architect");
    }

    #[test]
    fn streak_rules() {
        let mut s = UserStats::default();
        apply_streak(&mut s, 74.0);
        assert_eq!(s.current_streak, 1);
        apply_streak(&mut s, 40.0);
        assert_eq!(s.current_streak, 1);
        apply_streak(&mut s, 0.0);
        assert_eq!(s.current_streak, 0);
        assert_eq!(s.best_streak, 1);
    }

    #[test]
    fn area_xp_accumulates() {
        let mut s = UserStats::default();
        add_area_xp(&mut s, "skills", 30);
        add_area_xp(&mut s, "skills", 10);
        assert_eq!(s.area_xp.get("skills"), Some(&40));
    }
}
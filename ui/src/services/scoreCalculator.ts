import { QuestEntry, DailyScoreResult, Tier, EntryStatus } from '../types';

export function calculateDailyScore(entries: QuestEntry[]): DailyScoreResult {
  let dueWeight = 0;
  let earnedWeight = 0;
  let bonusPointsRaw = 0;
  const breakdown = [];

  for (const entry of entries) {
    let earnedFraction = 0;
    if (entry.status === 'done') {
      earnedFraction = 1.0;
    } else if (entry.status === 'partial') {
      if (entry.target <= 0) {
        earnedFraction = entry.progress > 0 ? 1.0 : 0.0;
      } else {
        earnedFraction = Math.min(Math.max(entry.progress / entry.target, 0), 1);
      }
    }

    const weight = entry.tier === 'core' ? 3 : entry.tier === 'standard' ? 2 : 0;
    let pointsContributed = 0;

    if (entry.tier === 'core' || entry.tier === 'standard') {
      if (entry.status !== 'skipped') {
        dueWeight += weight;
        earnedWeight += weight * earnedFraction;
      }
    } else if (entry.tier === 'bonus') {
      if (entry.status !== 'skipped') {
        const pts = 2.5 * earnedFraction;
        bonusPointsRaw += pts;
        pointsContributed = pts;
      }
    }

    breakdown.push({
      entry_id: entry.id,
      name: entry.name,
      tier: entry.tier,
      status: entry.status,
      weight,
      earned_fraction: earnedFraction,
      points_contributed: pointsContributed,
    });
  }

  const isEmpty = dueWeight === 0;
  const baseScore = dueWeight > 0 ? (earnedWeight / dueWeight) * 100 : 0;
  const bonusCapped = Math.min(bonusPointsRaw, 10.0);
  const finalScoreRaw = dueWeight > 0 ? Math.min(baseScore + bonusCapped, 100) : 0;
  const finalScore = Math.round(finalScoreRaw * 10) / 10;

  return {
    final_score: finalScore,
    due_weight: dueWeight,
    earned_weight: earnedWeight,
    bonus_points: Math.round(bonusCapped * 10) / 10,
    breakdown,
    is_empty: isEmpty,
  };
}

export function calculateDailyXP(entries: QuestEntry[]): number {
  let coreXP = 0;
  let standardXP = 0;
  let bonusXP = 0;

  for (const entry of entries) {
    let fraction = 0;
    if (entry.status === 'done') fraction = 1.0;
    else if (entry.status === 'partial') {
      fraction = entry.target <= 0 ? (entry.progress > 0 ? 1 : 0) : Math.min(Math.max(entry.progress / entry.target, 0), 1);
    }

    if (entry.tier === 'core') coreXP += 30 * fraction;
    else if (entry.tier === 'standard') standardXP += 15 * fraction;
    else if (entry.tier === 'bonus') bonusXP += 5 * fraction;
  }

  return Math.round(Math.min(coreXP, 90) + Math.min(standardXP, 60) + Math.min(bonusXP, 10));
}

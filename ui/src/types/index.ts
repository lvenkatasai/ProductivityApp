export type Tier = 'core' | 'standard' | 'bonus';

export type EntryStatus = 
  | 'pending' 
  | 'done' 
  | 'partial' 
  | 'skipped' 
  | 'missed' 
  | 'carried' 
  | 'dropped';

export type SkipReason = 
  | 'sick' 
  | 'travel' 
  | 'low_energy' 
  | 'overloaded' 
  | 'other';

export interface QuestEntry {
  id: string;
  day_key: string;
  source_type: string;
  source_id: string;
  name: string;
  tier: Tier;
  target: number;
  progress: number;
  status: EntryStatus;
  reason?: SkipReason;
  resolved_at?: string;
  reclassify_until: string;
}

export interface ScoreBreakdownItem {
  entry_id: string;
  name: string;
  tier: Tier;
  status: EntryStatus;
  weight: number;
  earned_fraction: number;
  points_contributed: number;
}

export interface DailyScoreResult {
  final_score: number;
  due_weight: number;
  earned_weight: number;
  bonus_points: number;
  breakdown: ScoreBreakdownItem[];
  is_empty: boolean;
}

export interface UserStats {
  level: number;
  rank: string;
  overall_xp: number;
  current_streak: number;
  day_begun: boolean;
  began_at?: string;
}

export interface DayScoreRecord {
  date: string;
  score: number;
  done: number;
  total: number;
}

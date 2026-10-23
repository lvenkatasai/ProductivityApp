use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Tier {
    Core,
    Standard,
    Bonus,
}

impl Tier {
    pub fn default_weight(&self) -> u32 {
        match self {
            Tier::Core => 3,
            Tier::Standard => 2,
            Tier::Bonus => 0,
        }
    }

    pub fn xp_value(&self) -> u32 {
        match self {
            Tier::Core => 30,
            Tier::Standard => 15,
            Tier::Bonus => 5,
        }
    }

    pub fn daily_xp_cap(&self) -> u32 {
        match self {
            Tier::Core => 90,
            Tier::Standard => 60,
            Tier::Bonus => 10,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum EntryStatus {
    Pending,
    Done,
    Partial,
    Skipped,
    Missed,
    Carried,
    Dropped,
}

impl EntryStatus {
    pub fn is_terminal(&self) -> bool {
        matches!(self, EntryStatus::Skipped | EntryStatus::Carried | EntryStatus::Dropped)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SkipReason {
    Sick,
    Travel,
    LowEnergy,
    Overloaded,
    Other,
}

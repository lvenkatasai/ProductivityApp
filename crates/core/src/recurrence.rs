use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Recurrence {
    Daily,
    Weekdays,
    Weekly { days_of_week: Vec<u8> }, // 1 = Monday, 7 = Sunday
    TimesPerWeek { target_times: u8 },
    EveryNDays { interval_days: u32 },
}

impl Recurrence {
    pub fn is_due_on(&self, date: chrono::NaiveDate, start_date: chrono::NaiveDate) -> bool {
        use chrono::Datelike;
        match self {
            Recurrence::Daily => true,
            Recurrence::Weekdays => {
                let weekday = date.weekday();
                weekday != chrono::Weekday::Sat && weekday != chrono::Weekday::Sun
            }
            Recurrence::Weekly { days_of_week } => {
                let current_day = date.weekday().number_from_monday() as u8;
                days_of_week.contains(&current_day)
            }
            Recurrence::EveryNDays { interval_days } => {
                if *interval_days == 0 {
                    return true;
                }
                let diff = (date - start_date).num_days();
                diff >= 0 && (diff as u32 % interval_days == 0)
            }
            Recurrence::TimesPerWeek { .. } => true, // Evaluated across week period
        }
    }
}

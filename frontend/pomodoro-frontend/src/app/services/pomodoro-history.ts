export const POMODORO_HISTORY_STORAGE_KEY = 'pomodoro-history';

export type PomodoroHistoryDate = string;

export interface PomodoroDailyHistoryEntry {
  date: PomodoroHistoryDate;
  completedSessions: number;
}

export type PomodoroHistory = PomodoroDailyHistoryEntry[];

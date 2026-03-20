import { Injectable } from '@angular/core';

export const POMODORO_HISTORY_STORAGE_KEY = 'pomodoro-history';

export type PomodoroHistoryDate = string;

export interface PomodoroDailyHistoryEntry {
  date: PomodoroHistoryDate;
  completedSessions: number;
}

export type PomodoroHistory = PomodoroDailyHistoryEntry[];

@Injectable({
  providedIn: 'root',
})
export class PomodoroHistoryService {
  addCompletedSession(): void {
    const today = this.getTodayDateString();
    const history = this.getDailyHistory();
    const todayHistoryEntry = history.find((entry) => entry.date === today);

    if (todayHistoryEntry) {
      todayHistoryEntry.completedSessions++;
    } else {
      history.push({
        date: today,
        completedSessions: 1,
      });
    }

    this.saveHistory(history);
  }

  getDailyHistory(): PomodoroHistory {
    const savedHistory = localStorage.getItem(POMODORO_HISTORY_STORAGE_KEY);

    if (!savedHistory) {
      return [];
    }

    try {
      const parsedHistory = JSON.parse(savedHistory) as PomodoroHistory;

      if (Array.isArray(parsedHistory)) {
        return parsedHistory
          .filter((entry) => this.isHistoryEntryValid(entry))
          .sort((leftEntry, rightEntry) =>
            leftEntry.date.localeCompare(rightEntry.date)
          );
      }
    } catch {
      return [];
    }

    return [];
  }

  getWeeklyHistory(): PomodoroHistory {
    const history = this.getDailyHistory();

    return this.getLastSevenDateStrings().map((date) => {
      const historyEntry = history.find((entry) => entry.date === date);

      return {
        date,
        completedSessions: historyEntry?.completedSessions ?? 0,
      };
    });
  }

  getCurrentStreak(): number {
    const completedSessionDates = new Set(
      this.getDailyHistory()
        .filter((entry) => entry.completedSessions > 0)
        .map((entry) => entry.date)
    );
    const today = new Date();
    const streakStartDate = completedSessionDates.has(this.formatDate(today))
      ? today
      : this.getDateDaysAgo(1);

    if (!completedSessionDates.has(this.formatDate(streakStartDate))) {
      return 0;
    }

    let streak = 0;
    const date = new Date(streakStartDate);

    while (completedSessionDates.has(this.formatDate(date))) {
      streak++;
      date.setDate(date.getDate() - 1);
    }

    return streak;
  }

  getCurrentWeeklyStreak(): number {
    const completedSessionWeekStartDates = new Set(
      this.getDailyHistory()
        .filter((entry) => entry.completedSessions > 0)
        .map((entry) => this.parseDate(entry.date))
        .map((date) => this.formatDate(this.getWeekStartDate(date)))
    );
    const currentWeekStartDate = this.getWeekStartDate(new Date());
    const previousWeekStartDate = new Date(currentWeekStartDate);
    previousWeekStartDate.setDate(previousWeekStartDate.getDate() - 7);
    const streakStartDate = completedSessionWeekStartDates.has(
      this.formatDate(currentWeekStartDate)
    )
      ? currentWeekStartDate
      : previousWeekStartDate;

    if (!completedSessionWeekStartDates.has(this.formatDate(streakStartDate))) {
      return 0;
    }

    let streak = 0;
    const weekStartDate = new Date(streakStartDate);

    while (completedSessionWeekStartDates.has(this.formatDate(weekStartDate))) {
      streak++;
      weekStartDate.setDate(weekStartDate.getDate() - 7);
    }

    return streak;
  }

  clearHistory(): void {
    localStorage.removeItem(POMODORO_HISTORY_STORAGE_KEY);
  }

  private saveHistory(history: PomodoroHistory): void {
    localStorage.setItem(POMODORO_HISTORY_STORAGE_KEY, JSON.stringify(history));
  }

  private isHistoryEntryValid(entry: PomodoroHistory[number]): boolean {
    return typeof entry.date === 'string'
      && Number.isInteger(entry.completedSessions)
      && entry.completedSessions >= 0;
  }

  private getLastSevenDateStrings(): PomodoroHistoryDate[] {
    return Array.from({ length: 7 }, (_, daysAgo) => {
      const date = this.getDateDaysAgo(6 - daysAgo);

      return this.formatDate(date);
    });
  }

  private getTodayDateString(): PomodoroHistoryDate {
    return this.formatDate(new Date());
  }

  private formatDate(date: Date): PomodoroHistoryDate {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private parseDate(date: PomodoroHistoryDate): Date {
    const [year, month, day] = date.split('-').map(Number);

    return new Date(year, month - 1, day);
  }

  private getDateDaysAgo(daysAgo: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    return date;
  }

  private getWeekStartDate(date: Date): Date {
    const weekStartDate = new Date(date);
    const daysSinceMonday = (weekStartDate.getDay() + 6) % 7;
    weekStartDate.setHours(0, 0, 0, 0);
    weekStartDate.setDate(weekStartDate.getDate() - daysSinceMonday);

    return weekStartDate;
  }
}

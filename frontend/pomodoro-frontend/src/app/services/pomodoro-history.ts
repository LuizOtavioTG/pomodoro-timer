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
      const date = new Date();
      date.setDate(date.getDate() - (6 - daysAgo));

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
}

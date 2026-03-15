import { TestBed } from '@angular/core/testing';

import {
  POMODORO_HISTORY_STORAGE_KEY,
  PomodoroHistoryService,
} from './pomodoro-history';

describe('PomodoroHistoryService', () => {
  let service: PomodoroHistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    localStorage.clear();
    service = TestBed.inject(PomodoroHistoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add a completed session for today', () => {
    service.addCompletedSession();

    expect(service.getDailyHistory()).toEqual([
      {
        date: getTodayDateString(),
        completedSessions: 1,
      },
    ]);
  });

  it('should increment an existing completed session entry for today', () => {
    localStorage.setItem(
      POMODORO_HISTORY_STORAGE_KEY,
      JSON.stringify([
        {
          date: getTodayDateString(),
          completedSessions: 2,
        },
      ])
    );

    service.addCompletedSession();

    expect(service.getDailyHistory()).toEqual([
      {
        date: getTodayDateString(),
        completedSessions: 3,
      },
    ]);
  });

  it('should keep completed sessions after reloading the service', () => {
    service.addCompletedSession();

    service = reloadService();

    expect(service.getDailyHistory()).toEqual([
      {
        date: getTodayDateString(),
        completedSessions: 1,
      },
    ]);
  });

  it('should return valid daily history sorted by date', () => {
    localStorage.setItem(
      POMODORO_HISTORY_STORAGE_KEY,
      JSON.stringify([
        {
          date: getTodayDateString(),
          completedSessions: 1,
        },
        {
          date: 'invalid-count',
          completedSessions: -1,
        },
        {
          date: getPreviousDayDateString(),
          completedSessions: 4,
        },
      ])
    );

    expect(service.getDailyHistory()).toEqual([
      {
        date: getPreviousDayDateString(),
        completedSessions: 4,
      },
      {
        date: getTodayDateString(),
        completedSessions: 1,
      },
    ]);
  });

  it('should return empty daily history when storage is invalid', () => {
    localStorage.setItem(POMODORO_HISTORY_STORAGE_KEY, 'not-json');

    expect(service.getDailyHistory()).toEqual([]);
  });

  it('should return the last seven days with zeroes for missing dates', () => {
    localStorage.setItem(
      POMODORO_HISTORY_STORAGE_KEY,
      JSON.stringify([
        {
          date: getTodayDateString(),
          completedSessions: 2,
        },
      ])
    );

    const weeklyHistory = service.getWeeklyHistory();

    expect(weeklyHistory.length).toBe(7);
    expect(weeklyHistory[0]).toEqual({
      date: getDateStringDaysAgo(6),
      completedSessions: 0,
    });
    expect(weeklyHistory[6]).toEqual({
      date: getTodayDateString(),
      completedSessions: 2,
    });
  });

  it('should ignore history older than the weekly window', () => {
    localStorage.setItem(
      POMODORO_HISTORY_STORAGE_KEY,
      JSON.stringify([
        {
          date: getDateStringDaysAgo(7),
          completedSessions: 5,
        },
        {
          date: getDateStringDaysAgo(6),
          completedSessions: 1,
        },
      ])
    );

    const weeklyHistory = service.getWeeklyHistory();

    expect(weeklyHistory[0]).toEqual({
      date: getDateStringDaysAgo(6),
      completedSessions: 1,
    });
    expect(weeklyHistory.reduce(
      (total, entry) => total + entry.completedSessions,
      0
    )).toBe(1);
  });

  it('should return zeroes for all weekly dates when no sessions were completed', () => {
    const weeklyHistory = service.getWeeklyHistory();

    expect(weeklyHistory.length).toBe(7);
    expect(weeklyHistory.every((entry) => entry.completedSessions === 0))
      .toBeTrue();
  });

  it('should return zero for the current streak when history is empty', () => {
    expect(service.getCurrentStreak()).toBe(0);
  });

  it('should count today as the current streak when sessions were completed today', () => {
    localStorage.setItem(
      POMODORO_HISTORY_STORAGE_KEY,
      JSON.stringify([
        {
          date: getTodayDateString(),
          completedSessions: 2,
        },
      ])
    );

    expect(service.getCurrentStreak()).toBe(1);
  });

  it('should keep yesterday streak active before a session is completed today', () => {
    localStorage.setItem(
      POMODORO_HISTORY_STORAGE_KEY,
      JSON.stringify([
        {
          date: getDateStringDaysAgo(2),
          completedSessions: 1,
        },
        {
          date: getPreviousDayDateString(),
          completedSessions: 3,
        },
      ])
    );

    expect(service.getCurrentStreak()).toBe(2);
  });

  it('should count consecutive days through today', () => {
    localStorage.setItem(
      POMODORO_HISTORY_STORAGE_KEY,
      JSON.stringify([
        {
          date: getDateStringDaysAgo(3),
          completedSessions: 1,
        },
        {
          date: getDateStringDaysAgo(2),
          completedSessions: 2,
        },
        {
          date: getPreviousDayDateString(),
          completedSessions: 1,
        },
        {
          date: getTodayDateString(),
          completedSessions: 4,
        },
      ])
    );

    expect(service.getCurrentStreak()).toBe(4);
  });

  it('should stop the current streak at missing days', () => {
    localStorage.setItem(
      POMODORO_HISTORY_STORAGE_KEY,
      JSON.stringify([
        {
          date: getDateStringDaysAgo(3),
          completedSessions: 1,
        },
        {
          date: getPreviousDayDateString(),
          completedSessions: 1,
        },
        {
          date: getTodayDateString(),
          completedSessions: 1,
        },
      ])
    );

    expect(service.getCurrentStreak()).toBe(2);
  });

  it('should return zero when neither today nor yesterday has sessions', () => {
    localStorage.setItem(
      POMODORO_HISTORY_STORAGE_KEY,
      JSON.stringify([
        {
          date: getDateStringDaysAgo(2),
          completedSessions: 1,
        },
      ])
    );

    expect(service.getCurrentStreak()).toBe(0);
  });

  it('should not count days with zero completed sessions in the current streak', () => {
    localStorage.setItem(
      POMODORO_HISTORY_STORAGE_KEY,
      JSON.stringify([
        {
          date: getPreviousDayDateString(),
          completedSessions: 0,
        },
        {
          date: getTodayDateString(),
          completedSessions: 1,
        },
      ])
    );

    expect(service.getCurrentStreak()).toBe(1);
  });

  it('should clear saved history', () => {
    service.addCompletedSession();

    service.clearHistory();

    expect(localStorage.getItem(POMODORO_HISTORY_STORAGE_KEY)).toBeNull();
    expect(service.getDailyHistory()).toEqual([]);
  });

  function getTodayDateString(): string {
    return getDateStringDaysAgo(0);
  }

  function getPreviousDayDateString(): string {
    return getDateStringDaysAgo(1);
  }

  function getDateStringDaysAgo(daysAgo: number): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  function reloadService(): PomodoroHistoryService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    return TestBed.inject(PomodoroHistoryService);
  }
});

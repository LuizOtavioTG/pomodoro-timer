import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { PomodoroTimerService } from './pomodoro-timer';

describe('PomodoroTimerService', () => {
  const dailyPomodoroCountStorageKey = 'daily-pomodoro-count';
  let service: PomodoroTimerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    localStorage.clear();
    service = TestBed.inject(PomodoroTimerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with the short session selected', () => {
    expect(service.selectedSession).toBe('short');
    expect(service.formattedTime).toBe('25:00');
  });

  it('should start with no completed pomodoros today', () => {
    expect(service.completedPomodorosToday).toBe(0);
  });

  it('should load saved completed pomodoros from today', () => {
    service = createServiceWithStoredDailyPomodoroCount({
      date: getTodayDateString(),
      count: 3,
    });

    expect(service.completedPomodorosToday).toBe(3);
  });

  it('should reset saved completed pomodoros from a previous day', () => {
    service = createServiceWithStoredDailyPomodoroCount({
      date: getPreviousDayDateString(),
      count: 5,
    });

    expect(service.completedPomodorosToday).toBe(0);
    expect(localStorage.getItem(dailyPomodoroCountStorageKey)).toBe(
      JSON.stringify({
        date: getTodayDateString(),
        count: 0,
      })
    );
  });

  it('should reset the timer when the session changes', () => {
    service.selectSession('break');

    expect(service.selectedSession).toBe('break');
    expect(service.formattedTime).toBe('10:00');
  });

  it('should count completed focus sessions', fakeAsync(() => {
    service.remainingSeconds = 1;

    service.start();
    tick(1000);

    expect(service.completedPomodorosToday).toBe(1);
  }));

  it('should move from a completed short focus session to a break', fakeAsync(() => {
    service.remainingSeconds = 1;

    service.start();
    tick(1000);

    expect(service.selectedSession).toBe('break');
    expect(service.formattedTime).toBe('10:00');
  }));

  it('should emit the completed session and next session when a session ends', fakeAsync(() => {
    const sessionCompletions: unknown[] = [];
    service.sessionCompleted$.subscribe((sessionCompletion) => {
      sessionCompletions.push(sessionCompletion);
    });
    service.remainingSeconds = 1;

    service.start();
    tick(1000);

    expect(sessionCompletions).toEqual([
      {
        completedSession: 'short',
        nextSession: 'break',
      },
    ]);
  }));

  it('should save completed focus sessions to local storage', fakeAsync(() => {
    service.remainingSeconds = 1;

    service.start();
    tick(1000);

    expect(localStorage.getItem(dailyPomodoroCountStorageKey)).toBe(
      JSON.stringify({
        date: getTodayDateString(),
        count: 1,
      })
    );
  }));

  it('should keep completed pomodoros after reloading the service', fakeAsync(() => {
    service.remainingSeconds = 1;

    service.start();
    tick(1000);
    service = reloadService();

    expect(service.completedPomodorosToday).toBe(1);
  }));

  it('should not count completed break sessions', fakeAsync(() => {
    service.selectSession('break');
    service.remainingSeconds = 1;

    service.start();
    tick(1000);

    expect(service.completedPomodorosToday).toBe(0);
  }));

  it('should move from a completed break session to a short focus session', fakeAsync(() => {
    service.selectSession('break');
    service.remainingSeconds = 1;

    service.start();
    tick(1000);

    expect(service.selectedSession).toBe('short');
    expect(service.formattedTime).toBe('25:00');
  }));

  it('should emit a completed break session before moving back to focus', fakeAsync(() => {
    const sessionCompletions: unknown[] = [];
    service.sessionCompleted$.subscribe((sessionCompletion) => {
      sessionCompletions.push(sessionCompletion);
    });
    service.selectSession('break');
    service.remainingSeconds = 1;

    service.start();
    tick(1000);

    expect(sessionCompletions).toEqual([
      {
        completedSession: 'break',
        nextSession: 'short',
      },
    ]);
  }));

  it('should move to a long focus session after four completed short cycles', fakeAsync(() => {
    completeShortFocusAndBreakCycle();
    completeShortFocusAndBreakCycle();
    completeShortFocusAndBreakCycle();
    completeShortFocusAndBreakCycle();

    expect(service.selectedSession).toBe('long');
    expect(service.formattedTime).toBe('50:00');
  }));

  function getTodayDateString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  function getPreviousDayDateString(): string {
    const previousDay = new Date();
    previousDay.setDate(previousDay.getDate() - 1);
    const year = previousDay.getFullYear();
    const month = String(previousDay.getMonth() + 1).padStart(2, '0');
    const day = String(previousDay.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  function createServiceWithStoredDailyPomodoroCount(
    dailyPomodoroCount: unknown
  ): PomodoroTimerService {
    TestBed.resetTestingModule();
    localStorage.clear();
    localStorage.setItem(
      dailyPomodoroCountStorageKey,
      JSON.stringify(dailyPomodoroCount)
    );
    TestBed.configureTestingModule({});

    return TestBed.inject(PomodoroTimerService);
  }

  function reloadService(): PomodoroTimerService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    return TestBed.inject(PomodoroTimerService);
  }

  function completeShortFocusAndBreakCycle(): void {
    service.remainingSeconds = 1;
    service.start();
    tick(1000);

    service.remainingSeconds = 1;
    service.start();
    tick(1000);
  }
});

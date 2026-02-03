import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { PomodoroTimerService } from './pomodoro-timer';

describe('PomodoroTimerService', () => {
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

  it('should not count completed break sessions', fakeAsync(() => {
    service.selectSession('break');
    service.remainingSeconds = 1;

    service.start();
    tick(1000);

    expect(service.completedPomodorosToday).toBe(0);
  }));
});

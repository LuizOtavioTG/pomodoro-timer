import { TestBed } from '@angular/core/testing';

import { PomodoroTimerService } from './pomodoro-timer';

describe('PomodoroTimerService', () => {
  let service: PomodoroTimerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PomodoroTimerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with the short session selected', () => {
    expect(service.selectedSession).toBe('short');
    expect(service.formattedTime).toBe('25:00');
  });

  it('should reset the timer when the session changes', () => {
    service.selectSession('break');

    expect(service.selectedSession).toBe('break');
    expect(service.formattedTime).toBe('10:00');
  });
});

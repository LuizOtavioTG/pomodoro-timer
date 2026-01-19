import { TestBed } from '@angular/core/testing';

import { PomodoroConfigService } from './pomodoro-config';

describe('PomodoroConfigService', () => {
  let service: PomodoroConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PomodoroConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return the default settings', () => {
    expect(service.getSettings()).toEqual({
      shortMinutes: 25,
      longMinutes: 50,
      breakMinutes: 10,
    });
  });

  it('should return the session duration by type', () => {
    expect(service.getDurationInMinutes('short')).toBe(25);
    expect(service.getDurationInMinutes('long')).toBe(50);
    expect(service.getDurationInMinutes('break')).toBe(10);
  });
});

import { TestBed } from '@angular/core/testing';

import { PomodoroConfigService } from './pomodoro-config';

describe('PomodoroConfigService', () => {
  let service: PomodoroConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    localStorage.clear();
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
      autoStartNextSession: true,
      soundNotificationsEnabled: true,
      browserNotificationsEnabled: false,
    });
  });

  it('should return the session duration by type', () => {
    expect(service.getDurationInMinutes('short')).toBe(25);
    expect(service.getDurationInMinutes('long')).toBe(50);
    expect(service.getDurationInMinutes('break')).toBe(10);
  });

  it('should save updated settings in localStorage', () => {
    service.updateSettings({
      shortMinutes: 30,
      breakMinutes: 15,
    });

    expect(service.getSettings()).toEqual({
      shortMinutes: 30,
      longMinutes: 50,
      breakMinutes: 15,
      autoStartNextSession: true,
      soundNotificationsEnabled: true,
      browserNotificationsEnabled: false,
    });
    expect(localStorage.getItem('pomodoro-settings')).toBe(
      JSON.stringify({
        shortMinutes: 30,
        longMinutes: 50,
        breakMinutes: 15,
        autoStartNextSession: true,
        soundNotificationsEnabled: true,
        browserNotificationsEnabled: false,
      })
    );
  });

  it('should save notification settings in localStorage', () => {
    service.updateSettings({
      soundNotificationsEnabled: false,
      browserNotificationsEnabled: true,
    });

    expect(service.getSettings()).toEqual({
      shortMinutes: 25,
      longMinutes: 50,
      breakMinutes: 10,
      autoStartNextSession: true,
      soundNotificationsEnabled: false,
      browserNotificationsEnabled: true,
    });
    expect(localStorage.getItem('pomodoro-settings')).toBe(
      JSON.stringify({
        shortMinutes: 25,
        longMinutes: 50,
        breakMinutes: 10,
        autoStartNextSession: true,
        soundNotificationsEnabled: false,
        browserNotificationsEnabled: true,
      })
    );
  });

  it('should load saved settings from localStorage', () => {
    localStorage.setItem(
      'pomodoro-settings',
      JSON.stringify({
        shortMinutes: 20,
        longMinutes: 45,
        breakMinutes: 8,
      })
    );

    const loadedService = new PomodoroConfigService();

    expect(loadedService.getSettings()).toEqual({
      shortMinutes: 20,
      longMinutes: 45,
      breakMinutes: 8,
      autoStartNextSession: true,
      soundNotificationsEnabled: true,
      browserNotificationsEnabled: false,
    });
  });

  it('should load saved notification settings from localStorage', () => {
    localStorage.setItem(
      'pomodoro-settings',
      JSON.stringify({
        shortMinutes: 20,
        longMinutes: 45,
        breakMinutes: 8,
        autoStartNextSession: false,
        soundNotificationsEnabled: false,
        browserNotificationsEnabled: true,
      })
    );

    const loadedService = new PomodoroConfigService();

    expect(loadedService.getSettings()).toEqual({
      shortMinutes: 20,
      longMinutes: 45,
      breakMinutes: 8,
      autoStartNextSession: false,
      soundNotificationsEnabled: false,
      browserNotificationsEnabled: true,
    });
  });

  it('should reset settings to the default values', () => {
    service.updateSettings({
      shortMinutes: 35,
      longMinutes: 60,
      breakMinutes: 12,
    });

    service.resetSettings();

    expect(service.getSettings()).toEqual({
      shortMinutes: 25,
      longMinutes: 50,
      breakMinutes: 10,
      autoStartNextSession: true,
      soundNotificationsEnabled: true,
      browserNotificationsEnabled: false,
    });
  });
});

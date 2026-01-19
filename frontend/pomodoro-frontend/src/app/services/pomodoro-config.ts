import { Injectable } from '@angular/core';

export type PomodoroSessionType = 'short' | 'long' | 'break';

export interface PomodoroSettings {
  shortMinutes: number;
  longMinutes: number;
  breakMinutes: number;
}

@Injectable({
  providedIn: 'root',
})
export class PomodoroConfigService {
  private readonly settings: PomodoroSettings = {
    shortMinutes: 25,
    longMinutes: 50,
    breakMinutes: 10,
  };

  getSettings(): PomodoroSettings {
    return this.settings;
  }

  getDurationInMinutes(sessionType: PomodoroSessionType): number {
    switch (sessionType) {
      case 'long':
        return this.settings.longMinutes;
      case 'break':
        return this.settings.breakMinutes;
      case 'short':
      default:
        return this.settings.shortMinutes;
    }
  }
}

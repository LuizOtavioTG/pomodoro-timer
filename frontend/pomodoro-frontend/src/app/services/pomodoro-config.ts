import { Injectable } from '@angular/core';

export type PomodoroSessionType = 'short' | 'long' | 'break';

export interface PomodoroSettings {
  shortMinutes: number;
  longMinutes: number;
  breakMinutes: number;
}

const STORAGE_KEY = 'pomodoro-settings';
const DEFAULT_SETTINGS: PomodoroSettings = {
  shortMinutes: 25,
  longMinutes: 50,
  breakMinutes: 10,
};

@Injectable({
  providedIn: 'root',
})
export class PomodoroConfigService {
  private settings: PomodoroSettings = this.loadSettings();

  getSettings(): PomodoroSettings {
    return this.settings;
  }

  updateSettings(newSettings: Partial<PomodoroSettings>): void {
    this.settings = {
      ...this.settings,
      ...newSettings,
    };

    this.saveSettings();
  }

  resetSettings(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
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

  private loadSettings(): PomodoroSettings {
    const savedSettings = localStorage.getItem(STORAGE_KEY);

    if (!savedSettings) {
      return { ...DEFAULT_SETTINGS };
    }

    try {
      return {
        ...DEFAULT_SETTINGS,
        ...JSON.parse(savedSettings),
      };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  private saveSettings(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
  }
}

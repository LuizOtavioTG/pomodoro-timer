import { Component, DestroyRef, HostBinding, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TimerDisplay } from "./timer-display/timer-display";
import { SessionSelector } from "./session-selector/session-selector";
import { TimerControls } from "./timer-controls/timer-controls";
import {
  BrowserNotificationPermissionStatus,
  PomodoroBrowserNotificationService,
} from '../services/pomodoro-browser-notification';
import {
  PomodoroConfigService,
  PomodoroSessionType,
  PomodoroSettings,
} from '../services/pomodoro-config';
import {
  PomodoroSessionCompletion,
  PomodoroTimerService,
} from '../services/pomodoro-timer';
import { PomodoroSoundNotificationService } from '../services/pomodoro-sound-notification';
import { ModalComponent } from '../shared/modal/modal';
import { SettingsFormComponent } from './settings-form/settings-form';

const THEME_STORAGE_KEY = 'pomodoro-theme';
type PomodoroTheme = 'light' | 'dark';

@Component({
  selector: 'app-pomodoro-container',
  standalone:true,
  imports: [
    TimerDisplay,
    SessionSelector,
    TimerControls,
    ModalComponent,
    SettingsFormComponent,
  ],
  templateUrl: './pomodoro-container.html',
  styleUrl: './pomodoro-container.scss',
})
export class PomodoroContainer {
  private readonly pomodoroConfig = inject(PomodoroConfigService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly soundNotification = inject(PomodoroSoundNotificationService);
  private readonly browserNotification =
    inject(PomodoroBrowserNotificationService);

  isSettingsModalOpen = false;
  isDarkMode = this.loadThemePreference() === 'dark';
  settingsForm: PomodoroSettings = this.createSettingsSnapshot();
  browserNotificationPermissionStatus: BrowserNotificationPermissionStatus =
    this.browserNotification.getPermissionStatus();

  @HostBinding('class.theme-dark')
  get darkModeClass(): boolean {
    return this.isDarkMode;
  }

  constructor(public pomodoroTimer: PomodoroTimerService) {
    this.pomodoroTimer.sessionCompleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((sessionCompletion) => {
        this.playSessionEndSound();
        this.showSessionEndBrowserNotification(sessionCompletion);
      });
  }

  get dailyPomodoroProgressMessage(): string {
    const completedPomodoros = this.pomodoroTimer.completedPomodorosToday;

    if (completedPomodoros === 0) {
      return 'Nenhum pomodoro concluido hoje';
    }

    if (completedPomodoros === 1) {
      return '1 pomodoro concluido hoje';
    }

    return `${completedPomodoros} pomodoros concluidos hoje`;
  }

  onSessionSelected(sessionType: PomodoroSessionType): void {
    if (this.pomodoroTimer.isRunning) {
      return;
    }

    this.pomodoroTimer.selectSession(sessionType);
  }

  onTimerToggleClicked(): void {
    if (this.pomodoroTimer.isRunning) {
      this.pomodoroTimer.pause();
      return;
    }

    this.soundNotification.prepare();
    this.pomodoroTimer.start();
  }

  onResetClicked(): void {
    if (this.pomodoroTimer.isRunning) {
      return;
    }

    this.pomodoroTimer.reset();
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    this.saveThemePreference(this.isDarkMode ? 'dark' : 'light');
  }

  openSettingsModal(): void {
    if (this.pomodoroTimer.isRunning) {
      return;
    }

    this.browserNotificationPermissionStatus =
      this.browserNotification.getPermissionStatus();
    this.settingsForm = this.createSettingsSnapshot();
    this.disableBrowserNotificationsWhenPermissionIsUnavailable();
    this.isSettingsModalOpen = true;
  }

  closeSettingsModal(): void {
    this.isSettingsModalOpen = false;
  }

  restoreDefaultSettings(): void {
    this.pomodoroConfig.resetSettings();
    this.settingsForm = this.createSettingsSnapshot();
    this.pomodoroTimer.reset();
  }

  saveSettings(): void {
    if (!this.canSaveSettings()) {
      return;
    }

    this.pomodoroConfig.updateSettings({ ...this.settingsForm });
    this.pomodoroTimer.reset();
    this.closeSettingsModal();
  }

  canSaveSettings(): boolean {
    return this.isValidDuration(this.settingsForm.shortMinutes)
      && this.isValidDuration(this.settingsForm.longMinutes)
      && this.isValidDuration(this.settingsForm.breakMinutes);
  }

  onSettingsFormChange(settings: PomodoroSettings): void {
    this.settingsForm = settings;
  }

  async requestBrowserNotificationPermission(): Promise<void> {
    this.browserNotificationPermissionStatus =
      await this.browserNotification.requestPermission();
    this.settingsForm = {
      ...this.settingsForm,
      browserNotificationsEnabled:
        this.browserNotificationPermissionStatus === 'granted',
    };
    this.disableBrowserNotificationsWhenPermissionIsUnavailable();
  }

  private createSettingsSnapshot(): PomodoroSettings {
    return { ...this.pomodoroConfig.getSettings() };
  }

  private playSessionEndSound(): void {
    if (!this.pomodoroConfig.getSettings().soundNotificationsEnabled) {
      return;
    }

    void this.soundNotification.playSessionEndAlert();
  }

  private showSessionEndBrowserNotification(
    sessionCompletion: PomodoroSessionCompletion
  ): void {
    if (!this.pomodoroConfig.getSettings().browserNotificationsEnabled) {
      return;
    }

    this.browserNotificationPermissionStatus =
      this.browserNotification.getPermissionStatus();

    if (this.browserNotificationPermissionStatus !== 'granted') {
      this.disableBrowserNotificationsWhenPermissionIsUnavailable();
      return;
    }

    this.browserNotification.showNotification(
      this.getSessionEndNotificationTitle(sessionCompletion.completedSession),
      this.getSessionEndNotificationBody(sessionCompletion.nextSession)
    );
  }

  private getSessionEndNotificationTitle(
    completedSession: PomodoroSessionType
  ): string {
    if (completedSession === 'break') {
      return 'Pausa finalizada';
    }

    return 'Pomodoro finalizado';
  }

  private getSessionEndNotificationBody(
    nextSession: PomodoroSessionType
  ): string {
    if (nextSession === 'break') {
      return 'Hora de fazer uma pausa.';
    }

    return 'Hora de voltar ao foco.';
  }

  private disableBrowserNotificationsWhenPermissionIsUnavailable(): void {
    const browserNotificationsEnabled =
      this.settingsForm.browserNotificationsEnabled
      || this.pomodoroConfig.getSettings().browserNotificationsEnabled;

    if (
      this.browserNotificationPermissionStatus === 'granted'
      || !browserNotificationsEnabled
    ) {
      return;
    }

    this.settingsForm = {
      ...this.settingsForm,
      browserNotificationsEnabled: false,
    };
    this.pomodoroConfig.updateSettings({
      browserNotificationsEnabled: false,
    });
  }

  private isValidDuration(value: number): boolean {
    return Number.isInteger(value) && value >= 1 && value <= 120;
  }

  private loadThemePreference(): PomodoroTheme {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (savedTheme === 'dark') {
      return 'dark';
    }

    return 'light';
  }

  private saveThemePreference(theme: PomodoroTheme): void {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
}

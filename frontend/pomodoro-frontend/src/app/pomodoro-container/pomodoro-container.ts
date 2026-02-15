import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TimerDisplay } from "./timer-display/timer-display";
import { SessionSelector } from "./session-selector/session-selector";
import { TimerControls } from "./timer-controls/timer-controls";
import {
  PomodoroConfigService,
  PomodoroSessionType,
  PomodoroSettings,
} from '../services/pomodoro-config';
import { PomodoroTimerService } from '../services/pomodoro-timer';
import { PomodoroSoundNotificationService } from '../services/pomodoro-sound-notification';
import { ModalComponent } from '../shared/modal/modal';
import { SettingsFormComponent } from './settings-form/settings-form';

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

  isSettingsModalOpen = false;
  settingsForm: PomodoroSettings = this.createSettingsSnapshot();

  constructor(public pomodoroTimer: PomodoroTimerService) {
    this.pomodoroTimer.sessionCompleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.playSessionEndSound();
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
    this.pomodoroTimer.selectSession(sessionType);
  }

  onStartClicked(): void {
    this.soundNotification.prepare();
    this.pomodoroTimer.start();
  }

  openSettingsModal(): void {
    this.settingsForm = this.createSettingsSnapshot();
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

  private createSettingsSnapshot(): PomodoroSettings {
    return { ...this.pomodoroConfig.getSettings() };
  }

  private playSessionEndSound(): void {
    if (!this.pomodoroConfig.getSettings().soundNotificationsEnabled) {
      return;
    }

    void this.soundNotification.playSessionEndAlert();
  }

  private isValidDuration(value: number): boolean {
    return Number.isInteger(value) && value >= 1 && value <= 120;
  }
}

import { Component, inject } from '@angular/core';
import { TimerDisplay } from "./timer-display/timer-display";
import { SessionSelector } from "./session-selector/session-selector";
import { TimerControls } from "./timer-controls/timer-controls";
import {
  PomodoroConfigService,
  PomodoroSessionType,
  PomodoroSettings,
} from '../services/pomodoro-config';
import { PomodoroTimerService } from '../services/pomodoro-timer';
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

  isSettingsModalOpen = false;
  settingsForm: PomodoroSettings = this.createSettingsSnapshot();

  constructor(public pomodoroTimer: PomodoroTimerService) {}

  onSessionSelected(sessionType: PomodoroSessionType): void {
    this.pomodoroTimer.selectSession(sessionType);
  }

  openSettingsModal(): void {
    this.settingsForm = this.createSettingsSnapshot();
    this.isSettingsModalOpen = true;
  }

  closeSettingsModal(): void {
    this.isSettingsModalOpen = false;
  }

  restoreDefaultSettings(): void {
    this.settingsForm = {
      shortMinutes: 25,
      longMinutes: 50,
      breakMinutes: 10,
    };
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

  private isValidDuration(value: number): boolean {
    return Number.isInteger(value) && value >= 1 && value <= 120;
  }
}

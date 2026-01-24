import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
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

@Component({
  selector: 'app-pomodoro-container',
  standalone:true,
  imports: [
    CommonModule,
    FormsModule,
    TimerDisplay,
    SessionSelector,
    TimerControls,
    ModalComponent,
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
    if (!this.isSettingsFormValid()) {
      return;
    }

    this.pomodoroConfig.updateSettings({ ...this.settingsForm });
    this.pomodoroTimer.reset();
    this.closeSettingsModal();
  }

  isSettingsFormValid(): boolean {
    return this.isValidDuration(this.settingsForm.shortMinutes)
      && this.isValidDuration(this.settingsForm.longMinutes)
      && this.isValidDuration(this.settingsForm.breakMinutes);
  }

  private createSettingsSnapshot(): PomodoroSettings {
    return { ...this.pomodoroConfig.getSettings() };
  }

  private isValidDuration(value: number): boolean {
    return Number.isInteger(value) && value >= 1 && value <= 120;
  }
}

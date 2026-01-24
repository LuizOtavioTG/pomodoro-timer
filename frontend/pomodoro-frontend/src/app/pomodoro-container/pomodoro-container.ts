import { Component } from '@angular/core';
import { TimerDisplay } from "./timer-display/timer-display";
import { SessionSelector } from "./session-selector/session-selector";
import { TimerControls } from "./timer-controls/timer-controls";
import { PomodoroSessionType } from '../services/pomodoro-config';
import { PomodoroTimerService } from '../services/pomodoro-timer';
import { ModalComponent } from '../shared/modal/modal';

@Component({
  selector: 'app-pomodoro-container',
  standalone:true,
  imports: [TimerDisplay, SessionSelector, TimerControls, ModalComponent],
  templateUrl: './pomodoro-container.html',
  styleUrl: './pomodoro-container.scss',
})
export class PomodoroContainer {
  isSettingsModalOpen = false;

  constructor(public pomodoroTimer: PomodoroTimerService) {}

  onSessionSelected(sessionType: PomodoroSessionType): void {
    this.pomodoroTimer.selectSession(sessionType);
  }

  openSettingsModal(): void {
    this.isSettingsModalOpen = true;
  }

  closeSettingsModal(): void {
    this.isSettingsModalOpen = false;
  }
}

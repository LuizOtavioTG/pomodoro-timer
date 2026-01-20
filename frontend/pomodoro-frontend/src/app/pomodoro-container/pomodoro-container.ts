import { Component } from '@angular/core';
import { TimerDisplay } from "./timer-display/timer-display";
import { SessionSelector } from "./session-selector/session-selector";
import { TimerControls } from "./timer-controls/timer-controls";
import { PomodoroSessionType } from '../services/pomodoro-config';

@Component({
  selector: 'app-pomodoro-container',
  standalone:true,
  imports: [TimerDisplay, SessionSelector, TimerControls],
  templateUrl: './pomodoro-container.html',
  styleUrl: './pomodoro-container.scss',
})
export class PomodoroContainer {
  selectedSession: PomodoroSessionType = 'short';

  onSessionSelected(sessionType: PomodoroSessionType): void {
    this.selectedSession = sessionType;
  }
}

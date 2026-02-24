import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PomodoroSessionType } from '../../services/pomodoro-config';

@Component({
  selector: 'app-session-selector',
  standalone: true,
  imports: [],
  templateUrl: './session-selector.html',
  styleUrl: './session-selector.scss',
})
export class SessionSelector {
  @Input() selectedSession: PomodoroSessionType = 'short';
  @Input() isDisabled = false;
  @Output() sessionSelected = new EventEmitter<PomodoroSessionType>();

  selectSession(sessionType: PomodoroSessionType): void {
    if (this.isDisabled) {
      return;
    }

    this.sessionSelected.emit(sessionType);
  }
}

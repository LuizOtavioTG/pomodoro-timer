import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-timer-controls',
  standalone: true,
  imports: [],
  templateUrl: './timer-controls.html',
  styleUrl: './timer-controls.scss',
})
export class TimerControls {
  @Input() isRunning = false;
  @Input() isResetDisabled = false;
  @Output() toggleClicked = new EventEmitter<void>();
  @Output() resetClicked = new EventEmitter<void>();
}

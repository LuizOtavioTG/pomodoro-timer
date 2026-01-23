import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-timer-controls',
  standalone: true,
  imports: [],
  templateUrl: './timer-controls.html',
  styleUrl: './timer-controls.scss',
})
export class TimerControls {
  @Output() startClicked = new EventEmitter<void>();
  @Output() pauseClicked = new EventEmitter<void>();
  @Output() resetClicked = new EventEmitter<void>();
}

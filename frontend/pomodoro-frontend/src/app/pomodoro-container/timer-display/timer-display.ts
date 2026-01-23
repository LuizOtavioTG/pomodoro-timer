import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-timer-display',
  standalone: true,
  imports: [],
  templateUrl: './timer-display.html',
  styleUrl: './timer-display.scss',
})
export class TimerDisplay {
  @Input() formattedTime: string = '00:00';
}

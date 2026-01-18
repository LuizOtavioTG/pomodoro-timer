import { Component, OnDestroy, OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-timer-display',
  imports: [],
  templateUrl: './timer-display.html',
  styleUrl: './timer-display.scss',
})
export class TimerDisplay implements OnInit, OnDestroy {

  seconds = 0;
  minutes = 0;
  formatedTimer = "00:00";

  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = interval(1000).subscribe(() => {
      this.seconds++;
      this.minutes = Math.floor(this.seconds / 60);

      const mins = String(this.minutes).padStart(2, '0');
      const secs = String(this.seconds % 60).padStart(2, '0');

      this.formatedTimer = `${mins}:${secs}`;
    });
  }
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}

import { inject, Injectable } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import {
  PomodoroConfigService,
  PomodoroSessionType,
} from './pomodoro-config';

@Injectable({
  providedIn: 'root',
})
export class PomodoroTimerService {
  private readonly pomodoroConfig = inject(PomodoroConfigService);

  selectedSession: PomodoroSessionType = 'short';
  remainingSeconds = this.getDurationInSeconds('short');
  formattedTime = this.formatTime(this.remainingSeconds);
  completedPomodorosToday = 0;

  private timerSubscription?: Subscription;

  selectSession(sessionType: PomodoroSessionType): void {
    this.selectedSession = sessionType;
    this.reset();
  }

  start(): void {
    if (this.timerSubscription || this.remainingSeconds === 0) {
      return;
    }

    this.timerSubscription = interval(1000).subscribe(() => {
      if (this.remainingSeconds > 0) {
        this.remainingSeconds--;
        this.formattedTime = this.formatTime(this.remainingSeconds);
      }

      if (this.remainingSeconds === 0) {
        this.pause();
      }
    });
  }

  pause(): void {
    this.timerSubscription?.unsubscribe();
    this.timerSubscription = undefined;
  }

  reset(): void {
    this.pause();
    this.remainingSeconds = this.getDurationInSeconds(this.selectedSession);
    this.formattedTime = this.formatTime(this.remainingSeconds);
  }

  private getDurationInSeconds(sessionType: PomodoroSessionType): number {
    return this.pomodoroConfig.getDurationInMinutes(sessionType) * 60;
  }

  private formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
      2,
      '0'
    )}`;
  }
}

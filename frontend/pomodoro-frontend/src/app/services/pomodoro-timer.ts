import { inject, Injectable } from '@angular/core';
import { interval, Subject, Subscription } from 'rxjs';
import {
  PomodoroConfigService,
  PomodoroSessionType,
} from './pomodoro-config';

const DAILY_POMODORO_COUNT_STORAGE_KEY = 'daily-pomodoro-count';
const SHORT_CYCLES_BEFORE_LONG_FOCUS = 4;

interface DailyPomodoroCount {
  date: string;
  count: number;
}

export interface PomodoroSessionCompletion {
  completedSession: PomodoroSessionType;
  nextSession: PomodoroSessionType;
}

@Injectable({
  providedIn: 'root',
})
export class PomodoroTimerService {
  private readonly pomodoroConfig = inject(PomodoroConfigService);
  private readonly sessionCompletedSubject =
    new Subject<PomodoroSessionCompletion>();

  selectedSession: PomodoroSessionType = 'short';
  remainingSeconds = this.getDurationInSeconds('short');
  formattedTime = this.formatTime(this.remainingSeconds);
  completedPomodorosToday = this.loadCompletedPomodorosToday();
  isRunning = false;
  sessionCompleted$ = this.sessionCompletedSubject.asObservable();

  private timerSubscription?: Subscription;
  private completedShortCycles = 0;

  selectSession(sessionType: PomodoroSessionType): void {
    this.selectedSession = sessionType;
    this.reset();
  }

  start(): void {
    if (this.timerSubscription || this.remainingSeconds === 0) {
      return;
    }

    this.isRunning = true;
    this.timerSubscription = interval(1000).subscribe(() => {
      if (this.remainingSeconds > 0) {
        this.remainingSeconds--;
        this.formattedTime = this.formatTime(this.remainingSeconds);
      }

      if (this.remainingSeconds === 0) {
        this.completeSession();
      }
    });
  }

  pause(): void {
    this.timerSubscription?.unsubscribe();
    this.timerSubscription = undefined;
    this.isRunning = false;
  }

  reset(): void {
    this.pause();
    this.remainingSeconds = this.getDurationInSeconds(this.selectedSession);
    this.formattedTime = this.formatTime(this.remainingSeconds);
  }

  private getDurationInSeconds(sessionType: PomodoroSessionType): number {
    return this.pomodoroConfig.getDurationInMinutes(sessionType) * 60;
  }

  private completeSession(): void {
    const completedSession = this.selectedSession;

    if (this.isFocusSession(completedSession)) {
      this.completedPomodorosToday++;
      this.saveCompletedPomodorosToday();
    }

    this.pause();
    this.selectNextSession(completedSession);
  }

  private isFocusSession(sessionType: PomodoroSessionType): boolean {
    return sessionType !== 'break';
  }

  private selectNextSession(completedSession: PomodoroSessionType): void {
    const nextSession = this.getNextSession(completedSession);

    this.sessionCompletedSubject.next({
      completedSession,
      nextSession,
    });

    this.selectedSession = nextSession;
    this.remainingSeconds = this.getDurationInSeconds(nextSession);
    this.formattedTime = this.formatTime(this.remainingSeconds);
  }

  private getNextSession(
    completedSession: PomodoroSessionType
  ): PomodoroSessionType {
    if (completedSession === 'short') {
      this.completedShortCycles++;
      return 'break';
    }

    if (completedSession === 'break') {
      if (this.completedShortCycles >= SHORT_CYCLES_BEFORE_LONG_FOCUS) {
        this.completedShortCycles = 0;
        return 'long';
      }

      return 'short';
    }

    return 'break';
  }

  private saveCompletedPomodorosToday(): void {
    this.saveDailyPomodoroCount(this.completedPomodorosToday);
  }

  private saveDailyPomodoroCount(count: number): void {
    localStorage.setItem(
      DAILY_POMODORO_COUNT_STORAGE_KEY,
      JSON.stringify({
        date: this.getTodayDateString(),
        count,
      })
    );
  }

  private loadCompletedPomodorosToday(): number {
    const savedDailyPomodoroCount = localStorage.getItem(
      DAILY_POMODORO_COUNT_STORAGE_KEY
    );

    if (!savedDailyPomodoroCount) {
      return 0;
    }

    try {
      const parsedDailyPomodoroCount = JSON.parse(
        savedDailyPomodoroCount
      ) as DailyPomodoroCount;

      if (this.isSavedDailyPomodoroCountValid(parsedDailyPomodoroCount)) {
        return parsedDailyPomodoroCount.count;
      }
    } catch {
      this.saveDailyPomodoroCount(0);
      return 0;
    }

    this.saveDailyPomodoroCount(0);
    return 0;
  }

  private isSavedDailyPomodoroCountValid(
    dailyPomodoroCount: DailyPomodoroCount
  ): boolean {
    return dailyPomodoroCount.date === this.getTodayDateString()
      && Number.isInteger(dailyPomodoroCount.count)
      && dailyPomodoroCount.count >= 0;
  }

  private getTodayDateString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
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

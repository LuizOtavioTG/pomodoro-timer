import { DOCUMENT } from '@angular/common';
import {
  Component,
  DestroyRef,
  HostBinding,
  OnDestroy,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, Subscription } from 'rxjs';
import { TimerDisplay } from "./timer-display/timer-display";
import { SessionSelector } from "./session-selector/session-selector";
import { TimerControls } from "./timer-controls/timer-controls";
import {
  BrowserNotificationPermissionStatus,
  PomodoroBrowserNotificationService,
} from '../services/pomodoro-browser-notification';
import {
  PomodoroConfigService,
  PomodoroSessionType,
  PomodoroSettings,
} from '../services/pomodoro-config';
import {
  PomodoroSessionCompletion,
  PomodoroTimerService,
} from '../services/pomodoro-timer';
import {
  PomodoroDailyHistoryEntry,
  PomodoroHistoryService,
} from '../services/pomodoro-history';
import { PomodoroSoundNotificationService } from '../services/pomodoro-sound-notification';
import { ModalComponent } from '../shared/modal/modal';
import { SettingsFormComponent } from './settings-form/settings-form';

const THEME_STORAGE_KEY = 'pomodoro-theme';
type PomodoroTheme = 'light' | 'dark';
type HistoryViewMode = 'daily' | 'weekly';

interface PomodoroTask {
  id: number;
  title: string;
  completed: boolean;
  pomodorosCount: number;
}

@Component({
  selector: 'app-pomodoro-container',
  standalone:true,
  imports: [
    FormsModule,
    TimerDisplay,
    SessionSelector,
    TimerControls,
    ModalComponent,
    SettingsFormComponent,
  ],
  templateUrl: './pomodoro-container.html',
  styleUrl: './pomodoro-container.scss',
})
export class PomodoroContainer implements OnDestroy {
  private readonly pomodoroConfig = inject(PomodoroConfigService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly soundNotification = inject(PomodoroSoundNotificationService);
  private readonly pomodoroHistory = inject(PomodoroHistoryService);
  private readonly browserNotification =
    inject(PomodoroBrowserNotificationService);
  private readonly originalDocumentTitle = this.document.title;
  private currentDocumentTitle = '';
  private documentTitleTimerSubscription?: Subscription;

  isSettingsModalOpen = false;
  isHistoryModalOpen = false;
  isDarkMode = this.loadThemePreference() === 'dark';
  selectedHistoryView: HistoryViewMode = 'weekly';
  tasks: PomodoroTask[] = [];
  newTaskTitle = '';
  private nextTaskId = 1;
  weeklyHistory: PomodoroDailyHistoryEntry[] =
    this.pomodoroHistory.getWeeklyHistory();
  currentStreak = this.pomodoroHistory.getCurrentStreak();
  currentWeeklyStreak = this.pomodoroHistory.getCurrentWeeklyStreak();
  settingsForm: PomodoroSettings = this.createSettingsSnapshot();
  browserNotificationPermissionStatus: BrowserNotificationPermissionStatus =
    this.browserNotification.getPermissionStatus();

  @HostBinding('class.theme-dark')
  get darkModeClass(): boolean {
    return this.isDarkMode;
  }

  constructor(public pomodoroTimer: PomodoroTimerService) {
    this.pomodoroTimer.sessionCompleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((sessionCompletion) => {
        this.refreshHistory();
        this.playSessionEndSound();
        this.showSessionEndBrowserNotification(sessionCompletion);
      });

    this.updateDocumentTitle();
  }

  ngOnDestroy(): void {
    this.stopDocumentTitleTimer();
    this.document.title = this.originalDocumentTitle;
  }

  get dailyPomodoroProgressMessage(): string {
    const completedPomodoros = this.pomodoroTimer.completedPomodorosToday;

    if (completedPomodoros === 0) {
      return 'Nenhum pomodoro concluido hoje';
    }

    if (completedPomodoros === 1) {
      return '1 pomodoro concluido hoje';
    }

    return `${completedPomodoros} pomodoros concluidos hoje`;
  }

  get completedPomodorosThisWeek(): number {
    return this.weeklyHistory.reduce(
      (total, historyEntry) => total + historyEntry.completedSessions,
      0
    );
  }

  get completedPomodorosFromHistoryToday(): number {
    const today = this.getTodayDateString();

    return this.weeklyHistory.find((entry) => entry.date === today)
      ?.completedSessions ?? 0;
  }

  get displayedStreak(): number {
    if (this.selectedHistoryView === 'daily') {
      return this.currentStreak;
    }

    return this.currentWeeklyStreak;
  }

  get displayedHistory(): PomodoroDailyHistoryEntry[] {
    if (this.selectedHistoryView === 'daily') {
      return [
        {
          date: this.getTodayDateString(),
          completedSessions: this.completedPomodorosFromHistoryToday,
        },
      ];
    }

    return this.weeklyHistory;
  }

  get historyPeriodLabel(): string {
    if (this.selectedHistoryView === 'daily') {
      return 'Hoje';
    }

    return 'Ultimos 7 dias';
  }

  get historyListAriaLabel(): string {
    if (this.selectedHistoryView === 'daily') {
      return 'Pomodoros concluidos hoje';
    }

    return 'Pomodoros concluidos por data';
  }

  get historyChartAriaLabel(): string {
    if (this.selectedHistoryView === 'daily') {
      return 'Grafico de pomodoros concluidos hoje';
    }

    return 'Grafico de pomodoros concluidos nos ultimos 7 dias';
  }

  get maxCompletedPomodorosInDisplayedHistory(): number {
    return Math.max(
      ...this.displayedHistory.map((entry) => entry.completedSessions),
      0
    );
  }

  formatHistoryDate(date: string): string {
    const [, month, day] = date.split('-');

    return `${day}/${month}`;
  }

  getHistoryBarHeight(completedSessions: number): number {
    if (
      completedSessions === 0
      || this.maxCompletedPomodorosInDisplayedHistory === 0
    ) {
      return 0;
    }

    return Math.max(
      18,
      Math.round(
        (completedSessions / this.maxCompletedPomodorosInDisplayedHistory)
        * 100
      )
    );
  }

  selectHistoryView(viewMode: HistoryViewMode): void {
    this.selectedHistoryView = viewMode;
  }

  onSessionSelected(sessionType: PomodoroSessionType): void {
    if (this.pomodoroTimer.isRunning) {
      return;
    }

    this.pomodoroTimer.selectSession(sessionType);
    this.updateDocumentTitle();
  }

  onTimerToggleClicked(): void {
    if (this.pomodoroTimer.isRunning) {
      this.pomodoroTimer.pause();
      this.stopDocumentTitleTimer();
      this.updateDocumentTitle();
      return;
    }

    this.soundNotification.prepare();
    this.pomodoroTimer.start();
    this.updateDocumentTitle();

    if (this.pomodoroTimer.isRunning) {
      this.startDocumentTitleTimer();
    }
  }

  onResetClicked(): void {
    if (this.pomodoroTimer.isRunning) {
      return;
    }

    this.pomodoroTimer.reset();
    this.updateDocumentTitle();
  }

  addTask(): void {
    const title = this.newTaskTitle.trim();

    if (title.length === 0) {
      return;
    }

    this.tasks = [
      ...this.tasks,
      {
        id: this.nextTaskId,
        title,
        completed: false,
        pomodorosCount: 0,
      },
    ];
    this.nextTaskId += 1;
    this.newTaskTitle = '';
  }

  toggleTaskCompleted(taskId: number): void {
    this.tasks = this.tasks.map((task) => {
      if (task.id !== taskId) {
        return task;
      }

      return {
        ...task,
        completed: !task.completed,
      };
    });
  }

  removeTask(taskId: number): void {
    this.tasks = this.tasks.filter((task) => task.id !== taskId);
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    this.saveThemePreference(this.isDarkMode ? 'dark' : 'light');
  }

  openHistoryModal(): void {
    this.refreshHistory();
    this.isHistoryModalOpen = true;
  }

  closeHistoryModal(): void {
    this.isHistoryModalOpen = false;
  }

  openSettingsModal(): void {
    if (this.pomodoroTimer.isRunning) {
      return;
    }

    this.browserNotificationPermissionStatus =
      this.browserNotification.getPermissionStatus();
    this.settingsForm = this.createSettingsSnapshot();
    this.disableBrowserNotificationsWhenPermissionIsUnavailable();
    this.isSettingsModalOpen = true;
  }

  closeSettingsModal(): void {
    this.isSettingsModalOpen = false;
  }

  restoreDefaultSettings(): void {
    this.pomodoroConfig.resetSettings();
    this.settingsForm = this.createSettingsSnapshot();
    this.pomodoroTimer.reset();
    this.updateDocumentTitle();
  }

  saveSettings(): void {
    if (!this.canSaveSettings()) {
      return;
    }

    this.pomodoroConfig.updateSettings({ ...this.settingsForm });
    this.pomodoroTimer.reset();
    this.updateDocumentTitle();
    this.closeSettingsModal();
  }

  canSaveSettings(): boolean {
    return this.isValidDuration(this.settingsForm.shortMinutes)
      && this.isValidDuration(this.settingsForm.longMinutes)
      && this.isValidDuration(this.settingsForm.breakMinutes);
  }

  onSettingsFormChange(settings: PomodoroSettings): void {
    this.settingsForm = settings;
  }

  async requestBrowserNotificationPermission(): Promise<void> {
    this.browserNotificationPermissionStatus =
      await this.browserNotification.requestPermission();
    this.settingsForm = {
      ...this.settingsForm,
      browserNotificationsEnabled:
        this.browserNotificationPermissionStatus === 'granted',
    };
    this.disableBrowserNotificationsWhenPermissionIsUnavailable();
  }

  private createSettingsSnapshot(): PomodoroSettings {
    return { ...this.pomodoroConfig.getSettings() };
  }

  private refreshHistory(): void {
    this.weeklyHistory = this.pomodoroHistory.getWeeklyHistory();
    this.currentStreak = this.pomodoroHistory.getCurrentStreak();
    this.currentWeeklyStreak = this.pomodoroHistory.getCurrentWeeklyStreak();
  }

  private updateDocumentTitle(): void {
    const nextDocumentTitle = this.getDocumentTitle();

    if (nextDocumentTitle === this.currentDocumentTitle) {
      return;
    }

    this.document.title = nextDocumentTitle;
    this.currentDocumentTitle = nextDocumentTitle;
  }

  private startDocumentTitleTimer(): void {
    this.stopDocumentTitleTimer();
    this.documentTitleTimerSubscription = interval(1000).subscribe(() => {
      this.updateDocumentTitle();

      if (!this.pomodoroTimer.isRunning) {
        this.stopDocumentTitleTimer();
      }
    });
  }

  private stopDocumentTitleTimer(): void {
    this.documentTitleTimerSubscription?.unsubscribe();
    this.documentTitleTimerSubscription = undefined;
  }

  private getDocumentTitle(): string {
    return `${this.pomodoroTimer.formattedTime} - ${this.getDocumentTitleSessionLabel()}`;
  }

  private getDocumentTitleSessionLabel(): string {
    if (this.pomodoroTimer.selectedSession === 'break') {
      return 'Break';
    }

    return 'Focus';
  }

  private playSessionEndSound(): void {
    if (!this.pomodoroConfig.getSettings().soundNotificationsEnabled) {
      return;
    }

    void this.soundNotification.playSessionEndAlert();
  }

  private showSessionEndBrowserNotification(
    sessionCompletion: PomodoroSessionCompletion
  ): void {
    if (!this.pomodoroConfig.getSettings().browserNotificationsEnabled) {
      return;
    }

    this.browserNotificationPermissionStatus =
      this.browserNotification.getPermissionStatus();

    if (this.browserNotificationPermissionStatus !== 'granted') {
      this.disableBrowserNotificationsWhenPermissionIsUnavailable();
      return;
    }

    this.browserNotification.showNotification(
      this.getSessionEndNotificationTitle(sessionCompletion.completedSession),
      this.getSessionEndNotificationBody(sessionCompletion.nextSession)
    );
  }

  private getSessionEndNotificationTitle(
    completedSession: PomodoroSessionType
  ): string {
    if (completedSession === 'break') {
      return 'Pausa finalizada';
    }

    return 'Pomodoro finalizado';
  }

  private getSessionEndNotificationBody(
    nextSession: PomodoroSessionType
  ): string {
    if (nextSession === 'break') {
      return 'Hora de fazer uma pausa.';
    }

    return 'Hora de voltar ao foco.';
  }

  private disableBrowserNotificationsWhenPermissionIsUnavailable(): void {
    const browserNotificationsEnabled =
      this.settingsForm.browserNotificationsEnabled
      || this.pomodoroConfig.getSettings().browserNotificationsEnabled;

    if (
      this.browserNotificationPermissionStatus === 'granted'
      || !browserNotificationsEnabled
    ) {
      return;
    }

    this.settingsForm = {
      ...this.settingsForm,
      browserNotificationsEnabled: false,
    };
    this.pomodoroConfig.updateSettings({
      browserNotificationsEnabled: false,
    });
  }

  private isValidDuration(value: number): boolean {
    return Number.isInteger(value) && value >= 1 && value <= 120;
  }

  private loadThemePreference(): PomodoroTheme {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (savedTheme === 'dark') {
      return 'dark';
    }

    return 'light';
  }

  private saveThemePreference(theme: PomodoroTheme): void {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  private getTodayDateString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}

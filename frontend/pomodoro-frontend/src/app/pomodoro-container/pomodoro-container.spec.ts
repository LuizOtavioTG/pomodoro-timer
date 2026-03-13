import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';

import { PomodoroContainer } from './pomodoro-container';
import { PomodoroBrowserNotificationService } from '../services/pomodoro-browser-notification';
import { PomodoroConfigService } from '../services/pomodoro-config';
import { POMODORO_HISTORY_STORAGE_KEY } from '../services/pomodoro-history';
import { PomodoroSoundNotificationService } from '../services/pomodoro-sound-notification';

describe('PomodoroContainer', () => {
  let component: PomodoroContainer;
  let fixture: ComponentFixture<PomodoroContainer>;
  let configService: PomodoroConfigService;
  let soundNotificationService: jasmine.SpyObj<PomodoroSoundNotificationService>;
  let browserNotificationService:
    jasmine.SpyObj<PomodoroBrowserNotificationService>;
  let originalDocumentTitle: string;

  beforeEach(async () => {
    localStorage.clear();
    originalDocumentTitle = document.title;
    soundNotificationService =
      jasmine.createSpyObj<PomodoroSoundNotificationService>(
        'PomodoroSoundNotificationService',
        ['prepare', 'playSessionEndAlert']
      );
    soundNotificationService.playSessionEndAlert.and.resolveTo();
    browserNotificationService =
      jasmine.createSpyObj<PomodoroBrowserNotificationService>(
        'PomodoroBrowserNotificationService',
        ['getPermissionStatus', 'requestPermission', 'showNotification']
      );
    browserNotificationService.getPermissionStatus.and.returnValue('default');
    browserNotificationService.requestPermission.and.resolveTo('granted');

    await TestBed.configureTestingModule({
      imports: [PomodoroContainer],
      providers: [
        {
          provide: PomodoroBrowserNotificationService,
          useValue: browserNotificationService,
        },
        {
          provide: PomodoroSoundNotificationService,
          useValue: soundNotificationService,
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(PomodoroContainer);
    component = fixture.componentInstance;
    configService = TestBed.inject(PomodoroConfigService);
    fixture.detectChanges();
  });

  afterEach(() => {
    document.title = originalDocumentTitle;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show the focus timer in the browser tab title', () => {
    expect(document.title).toBe('25:00 - Focus');
  });

  it('should show the break timer in the browser tab title', () => {
    component.onSessionSelected('break');
    fixture.detectChanges();

    expect(document.title).toBe('10:00 - Break');
  });

  it('should update the browser tab title when the timer ticks', fakeAsync(() => {
    component.onTimerToggleClicked();
    tick(1000);

    expect(document.title).toBe('24:59 - Focus');

    component.onTimerToggleClicked();
  }));

  it('should update the browser tab title when a focus session ends', fakeAsync(() => {
    component.pomodoroTimer.remainingSeconds = 1;

    component.onTimerToggleClicked();
    tick(1000);

    expect(document.title).toBe('10:00 - Break');
  }));

  it('should restore the original browser tab title when destroyed', () => {
    fixture.destroy();
    document.title = 'Pomodoro Timer';
    fixture = TestBed.createComponent(PomodoroContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(document.title).toBe('25:00 - Focus');

    fixture.destroy();

    expect(document.title).toBe('Pomodoro Timer');
  });

  it('should open the settings modal', () => {
    component.openSettingsModal();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.modal-backdrop')).not.toBeNull();
    expect(compiled.textContent).toContain('Configuracoes');
  });

  it('should display the completed pomodoros progress for today', () => {
    component.pomodoroTimer.completedPomodorosToday = 4;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.daily-pomodoro-count')?.textContent)
      .toContain('4 pomodoros concluidos hoje');
  });

  it('should toggle dark mode and persist the theme preference', () => {
    component.toggleTheme();
    fixture.detectChanges();

    expect(component.isDarkMode).toBeTrue();
    expect(localStorage.getItem('pomodoro-theme')).toBe('dark');
    expect((fixture.nativeElement as HTMLElement).classList)
      .toContain('theme-dark');
  });

  it('should load a saved dark mode preference', () => {
    fixture.destroy();
    localStorage.setItem('pomodoro-theme', 'dark');

    fixture = TestBed.createComponent(PomodoroContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isDarkMode).toBeTrue();
    expect((fixture.nativeElement as HTMLElement).classList)
      .toContain('theme-dark');
  });

  it('should display singular completed pomodoro progress', () => {
    component.pomodoroTimer.completedPomodorosToday = 1;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.daily-pomodoro-count')?.textContent)
      .toContain('1 pomodoro concluido hoje');
  });

  it('should update the completed pomodoros display when a focus session ends', fakeAsync(() => {
    component.pomodoroTimer.remainingSeconds = 1;

    component.pomodoroTimer.start();
    tick(1000);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.daily-pomodoro-count')?.textContent)
      .toContain('1 pomodoro concluido hoje');
  }));

  it('should display the weekly history summary', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.history-summary')?.textContent)
      .toContain('Historico');
    expect(compiled.querySelector('.history-summary')?.textContent)
      .toContain('Ultimos 7 dias');
    expect(compiled.querySelectorAll('.history-list-item').length).toBe(7);
    expect(compiled.querySelectorAll('.history-chart-item').length).toBe(7);
  });

  it('should switch between daily and weekly history views', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const dailyButton = getHistoryViewButton('Diario');
    const weeklyButton = getHistoryViewButton('Semanal');

    dailyButton.click();
    fixture.detectChanges();

    expect(component.selectedHistoryView).toBe('daily');
    expect(dailyButton.getAttribute('aria-pressed')).toBe('true');
    expect(compiled.querySelector('.history-heading')?.textContent)
      .toContain('Hoje');
    expect(compiled.querySelectorAll('.history-list-item').length).toBe(1);
    expect(compiled.querySelectorAll('.history-chart-item').length).toBe(1);
    expect(compiled.querySelector('.history-chart')?.getAttribute('aria-label'))
      .toBe('Grafico de pomodoros concluidos hoje');

    weeklyButton.click();
    fixture.detectChanges();

    expect(component.selectedHistoryView).toBe('weekly');
    expect(weeklyButton.getAttribute('aria-pressed')).toBe('true');
    expect(compiled.querySelector('.history-heading')?.textContent)
      .toContain('Ultimos 7 dias');
    expect(compiled.querySelectorAll('.history-list-item').length).toBe(7);
    expect(compiled.querySelectorAll('.history-chart-item').length).toBe(7);
  });

  it('should keep history outside the main timer container', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const timerContainer = compiled.querySelector('.pomodoro-container');
    const historySummary = compiled.querySelector('.history-summary');

    expect(timerContainer?.contains(historySummary)).toBeFalse();
    expect(historySummary?.parentElement?.classList)
      .toContain('pomodoro-layout');
  });

  it('should load completed pomodoros from history', () => {
    fixture.destroy();
    localStorage.setItem(
      POMODORO_HISTORY_STORAGE_KEY,
      JSON.stringify([
        {
          date: getDateStringDaysAgo(1),
          completedSessions: 2,
        },
        {
          date: getTodayDateString(),
          completedSessions: 3,
        },
      ])
    );

    fixture = TestBed.createComponent(PomodoroContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const historyTotals = compiled.querySelectorAll('.history-total strong');

    expect(historyTotals[0].textContent?.trim()).toBe('3');
    expect(historyTotals[1].textContent?.trim()).toBe('5');
    expect(compiled.querySelector('.history-summary')?.textContent)
      .toContain(formatHistoryDate(getTodayDateString()));
  });

  it('should scale history chart bars by the weekly maximum', () => {
    fixture.destroy();
    localStorage.setItem(
      POMODORO_HISTORY_STORAGE_KEY,
      JSON.stringify([
        {
          date: getDateStringDaysAgo(1),
          completedSessions: 2,
        },
        {
          date: getTodayDateString(),
          completedSessions: 4,
        },
      ])
    );

    fixture = TestBed.createComponent(PomodoroContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const chartItems = compiled.querySelectorAll('.history-chart-item');
    const yesterdayBar = chartItems[5].querySelector(
      '.history-bar'
    ) as HTMLElement;
    const todayBar = chartItems[6].querySelector('.history-bar') as HTMLElement;

    expect(yesterdayBar.style.height).toBe('50%');
    expect(todayBar.style.height).toBe('100%');
    expect(chartItems[6].getAttribute('aria-label'))
      .toContain('4 pomodoros concluidos');
  });

  it('should render empty chart bars for days without sessions', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const bars = Array.from(
      compiled.querySelectorAll('.history-bar')
    ) as HTMLElement[];

    expect(bars.length).toBe(7);
    expect(bars.every((bar) => bar.style.height === '0%')).toBeTrue();
  });

  it('should update the history summary when a focus session ends', fakeAsync(() => {
    component.pomodoroTimer.remainingSeconds = 1;

    component.pomodoroTimer.start();
    tick(1000);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const historyTotals = compiled.querySelectorAll('.history-total strong');

    expect(historyTotals[0].textContent?.trim()).toBe('1');
    expect(historyTotals[1].textContent?.trim()).toBe('1');
  }));

  it('should prepare sound before starting the timer from the unified control', () => {
    spyOn(component.pomodoroTimer, 'start');

    component.onTimerToggleClicked();

    expect(soundNotificationService.prepare).toHaveBeenCalled();
    expect(component.pomodoroTimer.start).toHaveBeenCalled();
  });

  it('should pause the timer from the unified control when it is running', () => {
    spyOn(component.pomodoroTimer, 'pause');
    component.pomodoroTimer.isRunning = true;

    component.onTimerToggleClicked();

    expect(soundNotificationService.prepare).not.toHaveBeenCalled();
    expect(component.pomodoroTimer.pause).toHaveBeenCalled();
  });

  it('should not open settings while the timer is running', () => {
    component.pomodoroTimer.isRunning = true;

    component.openSettingsModal();

    expect(component.isSettingsModalOpen).toBeFalse();
  });

  it('should not change session while the timer is running', () => {
    spyOn(component.pomodoroTimer, 'selectSession');
    component.pomodoroTimer.isRunning = true;

    component.onSessionSelected('long');

    expect(component.pomodoroTimer.selectSession).not.toHaveBeenCalled();
  });

  it('should not reset while the timer is running', () => {
    spyOn(component.pomodoroTimer, 'reset');
    component.pomodoroTimer.isRunning = true;

    component.onResetClicked();

    expect(component.pomodoroTimer.reset).not.toHaveBeenCalled();
  });

  it('should play a sound when a session ends and sound notifications are enabled', fakeAsync(() => {
    component.pomodoroTimer.remainingSeconds = 1;

    component.pomodoroTimer.start();
    tick(1000);

    expect(soundNotificationService.playSessionEndAlert).toHaveBeenCalled();
  }));

  it('should not play a sound when sound notifications are disabled', fakeAsync(() => {
    configService.updateSettings({
      soundNotificationsEnabled: false,
    });
    component.pomodoroTimer.remainingSeconds = 1;

    component.pomodoroTimer.start();
    tick(1000);

    expect(soundNotificationService.playSessionEndAlert).not.toHaveBeenCalled();
  }));

  it('should show a browser notification when a focus session ends and browser notifications are enabled', fakeAsync(() => {
    configService.updateSettings({
      browserNotificationsEnabled: true,
    });
    browserNotificationService.getPermissionStatus.and.returnValue('granted');
    component.pomodoroTimer.remainingSeconds = 1;

    component.pomodoroTimer.start();
    tick(1000);

    expect(browserNotificationService.showNotification).toHaveBeenCalledWith(
      'Pomodoro finalizado',
      'Hora de fazer uma pausa.'
    );
  }));

  it('should show a browser notification when a break session ends and browser notifications are enabled', fakeAsync(() => {
    configService.updateSettings({
      browserNotificationsEnabled: true,
    });
    browserNotificationService.getPermissionStatus.and.returnValue('granted');
    component.pomodoroTimer.selectSession('break');
    component.pomodoroTimer.remainingSeconds = 1;

    component.pomodoroTimer.start();
    tick(1000);

    expect(browserNotificationService.showNotification).toHaveBeenCalledWith(
      'Pausa finalizada',
      'Hora de voltar ao foco.'
    );
  }));

  it('should not show a browser notification when browser notifications are disabled', fakeAsync(() => {
    component.pomodoroTimer.remainingSeconds = 1;

    component.pomodoroTimer.start();
    tick(1000);

    expect(browserNotificationService.showNotification).not.toHaveBeenCalled();
  }));

  it('should not show a browser notification when permission is no longer granted', fakeAsync(() => {
    configService.updateSettings({
      browserNotificationsEnabled: true,
    });
    browserNotificationService.getPermissionStatus.and.returnValue('denied');
    component.pomodoroTimer.remainingSeconds = 1;

    component.pomodoroTimer.start();
    tick(1000);

    expect(browserNotificationService.showNotification).not.toHaveBeenCalled();
    expect(configService.getSettings().browserNotificationsEnabled).toBeFalse();
  }));

  it('should load the current settings when opening the modal', () => {
    configService.updateSettings({
      shortMinutes: 30,
      longMinutes: 55,
      breakMinutes: 12,
    });

    component.openSettingsModal();

    expect(component.settingsForm).toEqual({
      shortMinutes: 30,
      longMinutes: 55,
      breakMinutes: 12,
      soundNotificationsEnabled: true,
      browserNotificationsEnabled: false,
    });
  });

  it('should refresh browser notification permission when opening settings', () => {
    browserNotificationService.getPermissionStatus.and.returnValue('denied');

    component.openSettingsModal();

    expect(component.browserNotificationPermissionStatus).toBe('denied');
  });

  it('should disable saved browser notifications when opening settings after permission is denied', () => {
    configService.updateSettings({
      browserNotificationsEnabled: true,
    });
    browserNotificationService.getPermissionStatus.and.returnValue('denied');

    component.openSettingsModal();

    expect(component.settingsForm.browserNotificationsEnabled).toBeFalse();
    expect(configService.getSettings().browserNotificationsEnabled).toBeFalse();
  });

  it('should enable browser notifications when permission is granted', fakeAsync(() => {
    browserNotificationService.requestPermission.and.resolveTo('granted');

    component.requestBrowserNotificationPermission();
    tick();

    expect(component.browserNotificationPermissionStatus).toBe('granted');
    expect(component.settingsForm.browserNotificationsEnabled).toBeTrue();
  }));

  it('should keep browser notifications disabled when permission is denied', fakeAsync(() => {
    browserNotificationService.requestPermission.and.resolveTo('denied');
    component.settingsForm = {
      ...component.settingsForm,
      browserNotificationsEnabled: false,
    };

    component.requestBrowserNotificationPermission();
    tick();

    expect(component.browserNotificationPermissionStatus).toBe('denied');
    expect(component.settingsForm.browserNotificationsEnabled).toBeFalse();
  }));

  it('should restore the default settings in the form', () => {
    configService.updateSettings({
      shortMinutes: 40,
      longMinutes: 70,
      breakMinutes: 15,
    });
    component.pomodoroTimer.selectSession('break');
    component.settingsForm = {
      shortMinutes: 40,
      longMinutes: 70,
      breakMinutes: 15,
      soundNotificationsEnabled: false,
      browserNotificationsEnabled: true,
    };

    component.restoreDefaultSettings();

    expect(component.settingsForm).toEqual({
      shortMinutes: 25,
      longMinutes: 50,
      breakMinutes: 10,
      soundNotificationsEnabled: true,
      browserNotificationsEnabled: false,
    });
    expect(configService.getSettings()).toEqual({
      shortMinutes: 25,
      longMinutes: 50,
      breakMinutes: 10,
      soundNotificationsEnabled: true,
      browserNotificationsEnabled: false,
    });
    expect(component.pomodoroTimer.formattedTime).toBe('10:00');
  });

  it('should save valid settings and close the modal', () => {
    component.openSettingsModal();
    component.settingsForm = {
      shortMinutes: 35,
      longMinutes: 60,
      breakMinutes: 8,
      soundNotificationsEnabled: false,
      browserNotificationsEnabled: true,
    };

    component.saveSettings();

    expect(configService.getSettings()).toEqual({
      shortMinutes: 35,
      longMinutes: 60,
      breakMinutes: 8,
      soundNotificationsEnabled: false,
      browserNotificationsEnabled: true,
    });
    expect(component.isSettingsModalOpen).toBeFalse();
    expect(component.pomodoroTimer.formattedTime).toBe('35:00');
  });

  function getTodayDateString(): string {
    return getDateStringDaysAgo(0);
  }

  function getDateStringDaysAgo(daysAgo: number): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  function formatHistoryDate(date: string): string {
    const [, month, day] = date.split('-');

    return `${day}/${month}`;
  }

  function getHistoryViewButton(label: string): HTMLButtonElement {
    const buttons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll(
        '.history-view-button'
      )
    ) as HTMLButtonElement[];

    return buttons.find((button) => button.textContent?.trim() === label)!;
  }
});

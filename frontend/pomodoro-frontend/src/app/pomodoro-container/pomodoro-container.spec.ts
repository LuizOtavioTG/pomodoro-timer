import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';

import { PomodoroContainer } from './pomodoro-container';
import { PomodoroBrowserNotificationService } from '../services/pomodoro-browser-notification';
import { PomodoroConfigService } from '../services/pomodoro-config';
import { PomodoroSoundNotificationService } from '../services/pomodoro-sound-notification';

describe('PomodoroContainer', () => {
  let component: PomodoroContainer;
  let fixture: ComponentFixture<PomodoroContainer>;
  let configService: PomodoroConfigService;
  let soundNotificationService: jasmine.SpyObj<PomodoroSoundNotificationService>;
  let browserNotificationService:
    jasmine.SpyObj<PomodoroBrowserNotificationService>;

  beforeEach(async () => {
    localStorage.clear();
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

  it('should create', () => {
    expect(component).toBeTruthy();
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
});

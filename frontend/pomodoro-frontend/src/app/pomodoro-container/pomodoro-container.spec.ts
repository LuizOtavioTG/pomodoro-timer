import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PomodoroContainer } from './pomodoro-container';
import { PomodoroConfigService } from '../services/pomodoro-config';

describe('PomodoroContainer', () => {
  let component: PomodoroContainer;
  let fixture: ComponentFixture<PomodoroContainer>;
  let configService: PomodoroConfigService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PomodoroContainer]
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
    });
  });

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
    };

    component.restoreDefaultSettings();

    expect(component.settingsForm).toEqual({
      shortMinutes: 25,
      longMinutes: 50,
      breakMinutes: 10,
    });
    expect(configService.getSettings()).toEqual({
      shortMinutes: 25,
      longMinutes: 50,
      breakMinutes: 10,
    });
    expect(component.pomodoroTimer.formattedTime).toBe('10:00');
  });

  it('should save valid settings and close the modal', () => {
    component.openSettingsModal();
    component.settingsForm = {
      shortMinutes: 35,
      longMinutes: 60,
      breakMinutes: 8,
    };

    component.saveSettings();

    expect(configService.getSettings()).toEqual({
      shortMinutes: 35,
      longMinutes: 60,
      breakMinutes: 8,
    });
    expect(component.isSettingsModalOpen).toBeFalse();
    expect(component.pomodoroTimer.formattedTime).toBe('35:00');
  });
});

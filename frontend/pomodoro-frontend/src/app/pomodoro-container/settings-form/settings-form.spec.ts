import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsFormComponent } from './settings-form';

describe('SettingsFormComponent', () => {
  let component: SettingsFormComponent;
  let fixture: ComponentFixture<SettingsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsFormComponent);
    component = fixture.componentInstance;
    component.settings = {
      shortMinutes: 25,
      longMinutes: 50,
      breakMinutes: 10,
      autoStartNextSession: true,
      soundNotificationsEnabled: true,
      browserNotificationsEnabled: false,
    };
    component.browserNotificationPermissionStatus = 'default';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit updated settings when a field changes', () => {
    const emitSpy = spyOn(component.settingsChange, 'emit');

    component.updateSetting('shortMinutes', 30);

    expect(emitSpy).toHaveBeenCalledWith({
      shortMinutes: 30,
      longMinutes: 50,
      breakMinutes: 10,
      autoStartNextSession: true,
      soundNotificationsEnabled: true,
      browserNotificationsEnabled: false,
    });
  });

  it('should emit updated settings when sound notifications change', () => {
    const emitSpy = spyOn(component.settingsChange, 'emit');

    component.updateNotificationSetting('soundNotificationsEnabled', false);

    expect(emitSpy).toHaveBeenCalledWith({
      shortMinutes: 25,
      longMinutes: 50,
      breakMinutes: 10,
      autoStartNextSession: true,
      soundNotificationsEnabled: false,
      browserNotificationsEnabled: false,
    });
  });

  it('should emit updated settings when auto-start changes', () => {
    const emitSpy = spyOn(component.settingsChange, 'emit');

    component.updateNotificationSetting('autoStartNextSession', false);

    expect(emitSpy).toHaveBeenCalledWith({
      shortMinutes: 25,
      longMinutes: 50,
      breakMinutes: 10,
      autoStartNextSession: false,
      soundNotificationsEnabled: true,
      browserNotificationsEnabled: false,
    });
  });

  it('should request browser notification permission before enabling it', () => {
    const settingsEmitSpy = spyOn(component.settingsChange, 'emit');
    const permissionEmitSpy = spyOn(
      component.browserNotificationPermissionRequested,
      'emit'
    );

    component.updateNotificationSetting('browserNotificationsEnabled', true);

    expect(permissionEmitSpy).toHaveBeenCalled();
    expect(settingsEmitSpy).not.toHaveBeenCalled();
  });

  it('should disable browser notifications toggle when permission is denied', () => {
    component.browserNotificationPermissionStatus = 'denied';

    expect(component.isBrowserNotificationToggleDisabled()).toBeTrue();
    expect(component.getBrowserNotificationPermissionLabel()).toBe('Bloqueada');
    expect(component.getBrowserNotificationPermissionClass()).toBe(
      'permission-denied'
    );
    expect(component.getBrowserNotificationHelpText()).toBe(
      'Permissao bloqueada nas configuracoes do navegador.'
    );
  });

  it('should disable browser notifications toggle when notifications are unsupported', () => {
    component.browserNotificationPermissionStatus = 'unsupported';

    expect(component.isBrowserNotificationToggleDisabled()).toBeTrue();
    expect(component.getBrowserNotificationPermissionLabel()).toBe(
      'Indisponivel'
    );
    expect(component.getBrowserNotificationPermissionClass()).toBe(
      'permission-unsupported'
    );
    expect(component.getBrowserNotificationHelpText()).toBe(
      'Seu navegador nao suporta notificacoes.'
    );
  });

  it('should show the browser notification permission as not requested by default', () => {
    expect(component.getBrowserNotificationPermissionLabel()).toBe(
      'Nao solicitada'
    );
    expect(component.getBrowserNotificationPermissionClass()).toBe(
      'permission-default'
    );
    expect(component.getBrowserNotificationHelpText()).toBe(
      'Ao ativar, o navegador pedira permissao.'
    );
  });

  it('should show granted browser notification permission status', () => {
    component.browserNotificationPermissionStatus = 'granted';

    expect(component.isBrowserNotificationToggleDisabled()).toBeFalse();
    expect(component.getBrowserNotificationPermissionLabel()).toBe('Permitida');
    expect(component.getBrowserNotificationPermissionClass()).toBe(
      'permission-granted'
    );
  });

  it('should invalidate values that are zero or negative', () => {
    component.settings = {
      shortMinutes: 0,
      longMinutes: -10,
      breakMinutes: 10,
      autoStartNextSession: true,
      soundNotificationsEnabled: true,
      browserNotificationsEnabled: false,
    };

    expect(component.getShortError()).toBe('The value must be greater than zero.');
    expect(component.getLongError()).toBe('The value must be greater than zero.');
    expect(component.isFormValid()).toBeFalse();
  });

  it('should invalidate values above the allowed range', () => {
    component.settings = {
      shortMinutes: 121,
      longMinutes: 50,
      breakMinutes: 10,
      autoStartNextSession: true,
      soundNotificationsEnabled: true,
      browserNotificationsEnabled: false,
    };

    expect(component.getShortError()).toBe('The value must be at most 120 minutes.');
    expect(component.isFormValid()).toBeFalse();
  });
});

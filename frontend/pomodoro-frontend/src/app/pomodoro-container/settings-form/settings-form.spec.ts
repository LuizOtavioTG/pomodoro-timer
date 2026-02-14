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
      soundNotificationsEnabled: true,
      browserNotificationsEnabled: false,
    };
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
      soundNotificationsEnabled: true,
      browserNotificationsEnabled: false,
    });
  });

  it('should emit updated settings when a notification setting changes', () => {
    const emitSpy = spyOn(component.settingsChange, 'emit');

    component.updateNotificationSetting('browserNotificationsEnabled', true);

    expect(emitSpy).toHaveBeenCalledWith({
      shortMinutes: 25,
      longMinutes: 50,
      breakMinutes: 10,
      soundNotificationsEnabled: true,
      browserNotificationsEnabled: true,
    });
  });

  it('should invalidate values that are zero or negative', () => {
    component.settings = {
      shortMinutes: 0,
      longMinutes: -10,
      breakMinutes: 10,
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
      soundNotificationsEnabled: true,
      browserNotificationsEnabled: false,
    };

    expect(component.getShortError()).toBe('The value must be at most 120 minutes.');
    expect(component.isFormValid()).toBeFalse();
  });
});

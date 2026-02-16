import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserNotificationPermissionStatus } from '../../services/pomodoro-browser-notification';
import { PomodoroSettings } from '../../services/pomodoro-config';

type PomodoroDurationSettingKey =
  | 'shortMinutes'
  | 'longMinutes'
  | 'breakMinutes';

type PomodoroNotificationSettingKey =
  | 'soundNotificationsEnabled'
  | 'browserNotificationsEnabled';

@Component({
  selector: 'app-settings-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-form.html',
  styleUrl: './settings-form.scss',
})
export class SettingsFormComponent {
  @Input({ required: true }) settings!: PomodoroSettings;
  @Input({ required: true })
  browserNotificationPermissionStatus!: BrowserNotificationPermissionStatus;

  @Output() settingsChange = new EventEmitter<PomodoroSettings>();
  @Output() browserNotificationPermissionRequested =
    new EventEmitter<void>();

  readonly minMinutes = 1;
  readonly maxMinutes = 120;

  updateSetting(
    key: PomodoroDurationSettingKey,
    rawValue: string | number | null
  ): void {
    const numericValue = typeof rawValue === 'number'
      ? rawValue
      : Number(rawValue);

    this.settingsChange.emit({
      ...this.settings,
      [key]: Number.isNaN(numericValue) ? 0 : numericValue,
    });
  }

  updateNotificationSetting(
    key: PomodoroNotificationSettingKey,
    enabled: boolean
  ): void {
    if (key === 'browserNotificationsEnabled' && enabled) {
      this.browserNotificationPermissionRequested.emit();
      return;
    }

    this.settingsChange.emit({
      ...this.settings,
      [key]: enabled,
    });
  }

  isBrowserNotificationToggleDisabled(): boolean {
    return this.browserNotificationPermissionStatus === 'unsupported'
      || this.browserNotificationPermissionStatus === 'denied';
  }

  getBrowserNotificationHelpText(): string {
    switch (this.browserNotificationPermissionStatus) {
      case 'granted':
        return 'Mostra um aviso fora da aba quando permitido.';
      case 'denied':
        return 'Permissao bloqueada nas configuracoes do navegador.';
      case 'unsupported':
        return 'Seu navegador nao suporta notificacoes.';
      case 'default':
      default:
        return 'Ao ativar, o navegador pedira permissao.';
    }
  }

  isFormValid(): boolean {
    return this.getShortError() === null
      && this.getLongError() === null
      && this.getBreakError() === null;
  }

  getShortError(): string | null {
    return this.getDurationError(this.settings.shortMinutes);
  }

  getLongError(): string | null {
    return this.getDurationError(this.settings.longMinutes);
  }

  getBreakError(): string | null {
    return this.getDurationError(this.settings.breakMinutes);
  }

  private getDurationError(value: number): string | null {
    if (!Number.isInteger(value)) {
      return 'Use an integer number of minutes.';
    }

    if (value < this.minMinutes) {
      return 'The value must be greater than zero.';
    }

    if (value > this.maxMinutes) {
      return `The value must be at most ${this.maxMinutes} minutes.`;
    }

    return null;
  }
}

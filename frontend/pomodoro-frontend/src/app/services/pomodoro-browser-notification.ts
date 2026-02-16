import { Injectable } from '@angular/core';

export type BrowserNotificationPermissionStatus =
  | NotificationPermission
  | 'unsupported';

@Injectable({
  providedIn: 'root',
})
export class PomodoroBrowserNotificationService {
  getPermissionStatus(): BrowserNotificationPermissionStatus {
    if (!this.isSupported()) {
      return 'unsupported';
    }

    return Notification.permission;
  }

  async requestPermission(): Promise<BrowserNotificationPermissionStatus> {
    if (!this.isSupported()) {
      return 'unsupported';
    }

    return Notification.requestPermission();
  }

  private isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }
}

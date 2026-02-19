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

  showNotification(title: string, body: string): void {
    if (this.getPermissionStatus() !== 'granted') {
      return;
    }

    new Notification(title, {
      body,
    });
  }

  private isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }
}

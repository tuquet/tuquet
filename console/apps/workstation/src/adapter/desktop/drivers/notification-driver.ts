import type { NotificationOptions } from '../notification';

/**
 * Notification Driver Interface
 * Adheres to Dependency Inversion Principle (DIP) & Open/Closed Principle (OCP).
 */
export interface NotificationDriver {
  send(options: NotificationOptions): Promise<boolean>;
}

export class TauriNotificationDriver implements NotificationDriver {
  async send(options: NotificationOptions): Promise<boolean> {
    const { body, title } = options;
    try {
      const { isPermissionGranted, requestPermission, sendNotification } =
        await import('@tauri-apps/plugin-notification');

      let granted = await isPermissionGranted();
      if (!granted) {
        const permission = await requestPermission();
        granted = permission === 'granted';
      }

      if (granted) {
        sendNotification({ body, title });
        return true;
      }
    } catch {
      // Ignored when native notification fails
    }
    return false;
  }
}

export class WebNotificationDriver implements NotificationDriver {
  async send(options: NotificationOptions): Promise<boolean> {
    const { body, title } = options;
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'granted') {
          const _n = new Notification(title, { body });
          void _n;
          return true;
        } else if (Notification.permission !== 'denied') {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            const _n = new Notification(title, { body });
            void _n;
            return true;
          }
        }
      } catch {
        // Ignored in non-secure or restricted contexts
      }
    }
    return false;
  }
}

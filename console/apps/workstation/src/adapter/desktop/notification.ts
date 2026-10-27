import type { NotificationDriver } from './drivers';

import { TauriNotificationDriver, WebNotificationDriver } from './drivers';
import { isTauriEnvironment } from './index';

export interface NotificationOptions {
  body?: string;
  title: string;
}

let activeNotificationDriver: NotificationDriver | null = null;

/**
 * Returns or initializes the current active notification driver based on runtime environment.
 * Allows driver injection for testing or extending (DIP/OCP).
 */
export function getNotificationDriver(): NotificationDriver {
  if (!activeNotificationDriver) {
    activeNotificationDriver = isTauriEnvironment()
      ? new TauriNotificationDriver()
      : new WebNotificationDriver();
  }
  return activeNotificationDriver;
}

/**
 * Injects a custom notification driver (DIP / testing).
 */
export function setNotificationDriver(driver: NotificationDriver | null): void {
  activeNotificationDriver = driver;
}

/**
 * Sends a native OS notification on desktop, with browser fallback.
 */
export async function sendDesktopNotification(
  options: NotificationOptions,
): Promise<boolean> {
  return getNotificationDriver().send(options);
}

import { isTauriEnvironment } from './index';

export interface UpdateInfo {
  available: boolean;
  currentVersion?: string;
  notes?: string;
  version?: string;
}

/**
 * Checks for desktop updates via configured GitHub Releases endpoint.
 */
export async function checkDesktopUpdate(): Promise<UpdateInfo> {
  if (!isTauriEnvironment()) {
    return { available: false };
  }

  try {
    const { check } = await import('@tauri-apps/plugin-updater');
    const update = await check();

    if (update?.available) {
      return {
        available: true,
        currentVersion: update.currentVersion,
        notes: update.body,
        version: update.version,
      };
    }

    return {
      available: false,
      currentVersion: update?.currentVersion,
    };
  } catch (error) {
    console.warn('[Desktop Updater] Check failed:', error);
    return { available: false };
  }
}

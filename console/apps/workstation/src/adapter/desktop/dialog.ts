import { isTauriEnvironment } from './index';

export interface DialogFilter {
  extensions: string[];
  name: string;
}

export interface SaveDialogOptions {
  defaultPath?: string;
  filters?: DialogFilter[];
  title?: string;
}

export interface OpenDialogOptions {
  directory?: boolean;
  filters?: DialogFilter[];
  multiple?: boolean;
  title?: string;
}

/**
 * Prompts native file save dialog, returning selected file path.
 */
export async function showSaveDialog(
  options: SaveDialogOptions = {},
): Promise<null | string> {
  if (isTauriEnvironment()) {
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      return await save(options);
    } catch (error) {
      console.warn('[Desktop Dialog] Save error:', error);
    }
  }
  return null;
}

/**
 * Prompts native file open dialog, returning selected file path(s).
 */
export async function showOpenDialog(
  options: OpenDialogOptions = {},
): Promise<null | string | string[]> {
  if (isTauriEnvironment()) {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      return await open(options);
    } catch (error) {
      console.warn('[Desktop Dialog] Open error:', error);
    }
  }
  return null;
}

import { beforeEach, describe, expect, it } from 'vitest';

import { preferencesManager } from '../src/preferences';
import { usePreferences } from '../src/use-preferences';

describe('usePreferences - anti-lockout safeguards', () => {
  beforeEach(() => {
    preferencesManager.resetPreferences();
  });

  it('falls back to fixed position when header is disabled but position is set to header', () => {
    const { preferencesButtonPosition } = usePreferences();

    // Set position to header and enable preferences
    preferencesManager.updatePreferences({
      app: {
        enablePreferences: true,
        preferencesButtonPosition: 'header',
      },
      header: {
        enable: true,
        hidden: false,
      },
    });

    expect(preferencesButtonPosition.value).toEqual({
      fixed: false,
      header: true,
      userDropdown: false,
    });

    // Now disable the header: must automatically fallback to fixed: true
    preferencesManager.updatePreferences({
      header: {
        enable: false,
      },
    });

    expect(preferencesButtonPosition.value).toEqual({
      fixed: true,
      header: false,
      userDropdown: false,
    });
  });

  it('falls back to fixed position when header is hidden', () => {
    const { preferencesButtonPosition } = usePreferences();

    preferencesManager.updatePreferences({
      app: {
        enablePreferences: true,
        preferencesButtonPosition: 'header',
      },
      header: {
        enable: true,
        hidden: true,
      },
    });

    expect(preferencesButtonPosition.value).toEqual({
      fixed: true,
      header: false,
      userDropdown: false,
    });
  });

  it('returns all false when enablePreferences is false', () => {
    const { preferencesButtonPosition } = usePreferences();

    preferencesManager.updatePreferences({
      app: {
        enablePreferences: false,
        preferencesButtonPosition: 'header',
      },
      header: {
        enable: true,
        hidden: false,
      },
    });

    expect(preferencesButtonPosition.value).toEqual({
      fixed: false,
      header: false,
      userDropdown: false,
    });
  });

  it('does not produce diffPreference when only isMobile is toggled', () => {
    const { diffPreference } = usePreferences();

    // Baseline is identical
    expect(diffPreference.value).toBeUndefined();

    // Toggle runtime isMobile
    preferencesManager.updatePreferences({
      app: { isMobile: true },
    });

    // Should NOT report diffPreference because isMobile is runtime viewport state
    expect(diffPreference.value).toBeUndefined();

    // Change an actual user preference
    preferencesManager.updatePreferences({
      app: { locale: 'vi-VN' },
    });

    // Now it should report the real user preference diff
    expect(diffPreference.value).toEqual({
      app: { locale: 'vi-VN' },
    });
  });

  it('keeps diffPreference undefined when builtinType is neutral default and resets cleanly after change', async () => {
    const { diffPreference } = usePreferences();

    expect(preferencesManager.getPreferences().theme.builtinType).toBe(
      'neutral',
    );
    expect(diffPreference.value).toBeUndefined();

    preferencesManager.updatePreferences({
      theme: { builtinType: 'violet' },
    });

    expect(diffPreference.value).toEqual({
      theme: {
        builtinType: 'violet',
        colorPrimary: 'hsl(245 82% 67%)',
      },
    });

    await preferencesManager.resetPreferences();

    expect(preferencesManager.getPreferences().theme.builtinType).toBe(
      'neutral',
    );
    expect(diffPreference.value).toBeUndefined();
  });
});

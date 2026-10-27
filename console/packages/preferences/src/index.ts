import type {
  CustomPreferencesRecord,
  Preferences,
  PreferencesExtension,
} from '@tuquet-core/preferences';
import type { DeepPartial } from '@tuquet-core/typings';

/**
 * If you want all apps to use the same default preferences, you can define them here
 * instead of modifying the default preferences in @tuquet-core/preferences.
 * @param preferences
 * @returns
 */

function defineOverridesPreferences(preferences: DeepPartial<Preferences>) {
  return preferences;
}

function definePreferencesExtension<
  TCustomPreferences extends object = CustomPreferencesRecord,
>(extension: PreferencesExtension<TCustomPreferences>) {
  return extension;
}

/** Application copyright preferences for app overrides */
const appCopyrightPreferences = {
  companyName: 'Tuquet',
  companySiteLink: 'https://tuquet.com',
  date: '2026',
  enable: true,
  icp: '',
  icpLink: '',
  settingShow: true,
} satisfies DeepPartial<Preferences>['copyright'];

export {
  appCopyrightPreferences,
  defineOverridesPreferences,
  definePreferencesExtension,
};

export * from '@tuquet-core/preferences';

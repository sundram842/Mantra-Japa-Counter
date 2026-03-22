export interface AppSettings {
  vibrationEnabled: boolean;
  vibrationDuration: number;
  soundEnabled: boolean;
  resetConfirmation: boolean;
  darkMode: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  vibrationEnabled: true,
  vibrationDuration: 50,
  soundEnabled: false,
  resetConfirmation: true,
  darkMode: false,
};

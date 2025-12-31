import { NativeModules, Platform } from 'react-native';

const { IconSwitcher } = NativeModules as { IconSwitcher?: { setLauncherIcon: (mode: string) => void } };

export function setAndroidLauncherIcon(mode: 'light' | 'dark' | 'default') {
  if (Platform.OS !== 'android') return;
  try {
    if (IconSwitcher && typeof IconSwitcher.setLauncherIcon === 'function') {
      IconSwitcher.setLauncherIcon(mode);
    } else {
      console.warn('IconSwitcher native module not available');
    }
  } catch (e) {
    console.warn('Failed to set Android launcher icon:', e);
  }
}

export default {
  setAndroidLauncherIcon,
};

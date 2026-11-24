import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kokilux.hoshitsugi',
  appName: '星継',
  webDir: 'release',
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: '#cfc3a8',
    },
  },
};

export default config;

import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sdesimeur.bt4gps',
  appName: 'BT4GPS',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  android: {
    useLegacyBridge: true
  }
};

export default config;

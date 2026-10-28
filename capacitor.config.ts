import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wafflehouse.cairo',
  appName: 'Waffle House',
  webDir: 'public',
  server: {
    url: 'https://waffle-house-eg.vercel.app',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#FAF7F2',
  },
};

export default config;

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.myclasscast.ios',
  appName: 'ClassCast',
  webDir: 'out',
  server: {
    // Production App Store build
    // url: 'https://class-cast.com',
    // For local development with simulator:
    url: 'http://localhost:3003',
    cleartext: true,
  },
  ios: {
    contentInset: 'never',
    preferredContentMode: 'mobile',
    scheme: 'ClassCast',
    backgroundColor: '#005587',
    scrollEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#005587',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#005587',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;

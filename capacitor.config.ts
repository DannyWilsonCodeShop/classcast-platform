import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.myclasscast.ios',
  appName: 'ClassCast',
  webDir: 'out',
  server: {
    // Production App Store build
    url: 'https://class-cast.com',
    // For local development with simulator:
    // url: 'http://localhost:3003',
    // cleartext: true,
  },
  ios: {
    contentInset: 'never',
    preferredContentMode: 'mobile',
    scheme: 'ClassCast',
    backgroundColor: '#ffffff',
    scrollEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#ffffff',
      overlaysWebView: false,
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

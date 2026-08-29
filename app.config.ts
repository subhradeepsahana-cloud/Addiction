import type { ExpoConfig } from 'expo/config';

// Product name is intentionally configurable. Set EXPO_PUBLIC_APP_NAME to
// rebrand the app without touching source code.
const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME || 'Sober Companion';
const APP_SLUG = 'sober-companion';
const SCHEME = 'sobercompanion';

const config: ExpoConfig = {
  name: APP_NAME,
  slug: APP_SLUG,
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  scheme: SCHEME,
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.sobercompanion.app',
    infoPlist: {
      NSCameraUsageDescription:
        'Used to add a photo to My Why so you can capture what matters most to your recovery.',
      NSPhotoLibraryUsageDescription:
        'Used to choose photos for My Why, your personal collection of reasons for change.',
      NSLocationWhenInUseUsageDescription:
        'Optional. If enabled, location helps identify places associated with your drinking patterns. You can turn this off at any time in Settings.',
      NSFaceIDUsageDescription: 'Used to unlock the app quickly and securely.',
      UIBackgroundModes: ['remote-notification'],
    },
  },
  android: {
    package: 'com.sobercompanion.app',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    permissions: [
      'android.permission.CAMERA',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.POST_NOTIFICATIONS',
    ],
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#F6F3EE',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'Allow $(PRODUCT_NAME) to access your photos so you can add pictures to My Why.',
        cameraPermission:
          'Allow $(PRODUCT_NAME) to use the camera so you can capture pictures for My Why.',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/icon.png',
        color: '#5B6B4E',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {},
  },
};

export default config;

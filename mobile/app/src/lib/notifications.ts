import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { storage } from './storage';
import { authApi } from './api';

import { logger } from '@/lib/logger';
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Push izni iste, cihaz push tokenını al, AsyncStorage'a kaydet,
 * backend'e ilet.
 */
export async function registerPushToken(): Promise<string | null> {
  // Expo native tokens: Android = FCM; iOS = APNs, not an FCM token.
  // iOS needs a separate provider bridge before using registerFcmToken.
  if (Platform.OS !== 'android') return null;

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Varsayılan',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#C9A961',
  });

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') return null;

  try {
    const tokenResponse = await Notifications.getDevicePushTokenAsync();
    const token = String(tokenResponse.data);
    await authApi.registerFcmToken(token);
    await storage.setPushToken(token);
    
    return token;
  } catch (err) {
    logger.warn('Push token registration failed:', err);
    return null;
  }
}

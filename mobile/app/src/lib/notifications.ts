import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { storage } from './storage';
import { authApi } from './api';

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
 * Push izni iste, Expo Push token al, AsyncStorage'a kaydet,
 * backend'e ilet.
 */
export async function registerPushToken(): Promise<string | null> {
  // Simülatörde token alınamaz
  if (!Constants.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Varsayılan',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C9A961',
    });
  }

  try {
    const projectId =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas
        ?.projectId ||
      (Constants.easConfig as { projectId?: string } | undefined)?.projectId;
    
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await storage.setPushToken(token);
    
    // Backend'e kaydet (ignore error if not logged in yet)
    await authApi.registerFcmToken(token).catch(() => {});
    
    return token;
  } catch (err) {
    console.warn('Push token registration failed:', err);
    return null;
  }
}

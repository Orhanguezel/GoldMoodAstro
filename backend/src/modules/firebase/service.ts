import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { env } from '@/core/env';

let firebaseApp: App | null = null;

function getFirebaseApp() {
  if (firebaseApp) return firebaseApp;
  if (getApps().length) {
    firebaseApp = getApps()[0] ?? null;
    return firebaseApp;
  }

  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    return null;
  }

  firebaseApp = initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });

  return firebaseApp;
}

export async function sendPushNotification(params: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<void> {
  const app = getFirebaseApp();
  if (!app) {
    const error = new Error('firebase_not_configured');
    (error as Error & { statusCode?: number }).statusCode = 500;
    throw error;
  }

  await getMessaging(app).send({
    token: params.token,
    notification: {
      title: params.title,
      body: params.body,
    },
    data: params.data,
  });
}

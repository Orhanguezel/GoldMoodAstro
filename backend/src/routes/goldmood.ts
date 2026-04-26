import type { FastifyInstance } from 'fastify';
import { registerBirthCharts } from '@/modules/birthCharts/router';
import { registerConsultants } from '@/modules/consultants/router';
import { registerConsultantsAdmin } from '@/modules/consultants/admin.routes';
import { registerFirebasePush } from '@/modules/firebase/router';
import { registerLiveKitAdmin } from '@/modules/livekit/admin.routes';
import { registerLiveKit } from '@/modules/livekit/router';
import { registerGeocodeRoutes } from '@/modules/geocode/router';
import { registerReadings } from '@/modules/readings/router';
import { registerHoroscopeRoutes } from '@/modules/horoscopes/router';
import { registerTarotRoutes } from '@/modules/tarot/router';
import { registerNumerologyRoutes } from '@/modules/numerology/router';
import { registerStubs } from './stubs';

import { registerFirebaseAdmin } from '@/modules/firebase/admin.routes';

// Project-specific modules
// Project-specific modules

export async function registerGoldmoodPublic(api: FastifyInstance) {
  await registerConsultants(api);
  await registerBirthCharts(api);
  await registerLiveKit(api);
  await registerFirebasePush(api);
  await registerReadings(api);
  await api.register(registerGeocodeRoutes, { prefix: '/geocode' });
  await api.register(registerHoroscopeRoutes, { prefix: '/horoscopes' });
  await api.register(registerTarotRoutes, { prefix: '/tarot' });
  await api.register(registerNumerologyRoutes, { prefix: '/numerology' });
  await api.register(registerStubs);
}

export async function registerGoldmoodAdmin(adminApi: FastifyInstance) {
  await adminApi.register(registerConsultantsAdmin);
  await adminApi.register(registerFirebaseAdmin);
  await adminApi.register(registerLiveKitAdmin);
}

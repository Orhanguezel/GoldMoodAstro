import type { FastifyInstance } from 'fastify';
import { registerAgora } from '@/modules/agora/router';
import { registerConsultants } from '@/modules/consultants/router';
import { registerConsultantsAdmin } from '@/modules/consultants/admin.routes';
import { registerFirebasePush } from '@/modules/firebase/router';

import { registerFirebaseAdmin } from '@/modules/firebase/admin.routes';

// Project-specific modules
// Faz 1: consultants, agora, firebase-fcm modülleri buraya register edilecek

export async function registerGoldmoodPublic(api: FastifyInstance) {
  await registerConsultants(api);
  await registerAgora(api);
  await registerFirebasePush(api);
}

export async function registerGoldmoodAdmin(adminApi: FastifyInstance) {
  await adminApi.register(registerConsultantsAdmin);
  await adminApi.register(registerFirebaseAdmin);
}

import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../../middleware/auth';
import {
  addFavoriteHandler,
  listFavoriteIdsHandler,
  listFavoritesHandler,
  removeFavoriteHandler,
} from './controller';

export async function registerFavorites(app: FastifyInstance) {
  const guard = { preHandler: [requireAuth] };

  app.get('/me/favorites', guard, listFavoritesHandler);
  app.get('/me/favorites/ids', guard, listFavoriteIdsHandler);
  app.post('/me/favorites/:consultantId', guard, addFavoriteHandler);
  app.delete('/me/favorites/:consultantId', guard, removeFavoriteHandler);
}

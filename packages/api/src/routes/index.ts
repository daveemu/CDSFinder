import type { FastifyInstance } from 'fastify';
import { viewsRoutes } from './views.js';
import { searchRoutes } from './search.js';
import { sourcesRoutes } from './sources.js';
import { ingestionRoutes } from './ingestion.js';

export async function registerRoutes(app: FastifyInstance) {
  await app.register(viewsRoutes, { prefix: '/api/v1' });
  await app.register(searchRoutes, { prefix: '/api/v1' });
  await app.register(sourcesRoutes, { prefix: '/api/v1' });
  await app.register(ingestionRoutes, { prefix: '/api/v1' });
}

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config.js';
import { registerRoutes } from './routes/index.js';

export async function buildServer() {
  const isDev = process.env['NODE_ENV'] !== 'production';

  const app = Fastify({
    logger: isDev
      ? { level: config.logLevel, transport: { target: 'pino-pretty', options: { colorize: true } } }
      : { level: config.logLevel },
  });

  await app.register(cors, {
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  });

  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    embeddingProvider: config.embeddingProvider,
  }));

  await registerRoutes(app);

  return app;
}

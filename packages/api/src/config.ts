import { z } from 'zod';

const ConfigSchema = z.object({
  port: z.coerce.number().default(3001),
  databaseUrl: z.string().min(1),
  corsOrigin: z.string().default('http://localhost:5173'),
  encryptionKey: z.string().min(32),
  embeddingProvider: z.enum(['none', 'openai', 'ollama']).default('none'),
  openaiApiKey: z.string().optional(),
  ollamaBaseUrl: z.string().url().optional(),
  ollamaModel: z.string().default('nomic-embed-text'),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

function loadConfig() {
  const result = ConfigSchema.safeParse({
    port: process.env['PORT'],
    databaseUrl: process.env['DATABASE_URL'],
    corsOrigin: process.env['CORS_ORIGIN'],
    encryptionKey: process.env['ENCRYPTION_KEY'],
    embeddingProvider: process.env['EMBEDDING_PROVIDER'],
    openaiApiKey: process.env['OPENAI_API_KEY'],
    ollamaBaseUrl: process.env['OLLAMA_BASE_URL'],
    ollamaModel: process.env['OLLAMA_MODEL'],
    logLevel: process.env['LOG_LEVEL'],
  });

  if (!result.success) {
    console.error('Invalid configuration:', result.error.flatten().fieldErrors);
    process.exit(1);
  }

  return result.data;
}

export const config = loadConfig();
export type Config = typeof config;

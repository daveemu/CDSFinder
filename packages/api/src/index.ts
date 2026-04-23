import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { config } from './config.js';
import { buildServer } from './server.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  // Run migrations on startup
  const migrationClient = postgres(config.databaseUrl, { max: 1 });
  const migrationDb = drizzle(migrationClient);

  try {
    await migrate(migrationDb, {
      migrationsFolder: join(__dirname, 'db/migrations'),
    });
    console.log('Database migrations applied successfully.');
  } finally {
    await migrationClient.end();
  }

  const app = await buildServer();

  await app.listen({ port: config.port, host: '0.0.0.0' });
  console.log(`CDSFinder API listening on port ${config.port}`);
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

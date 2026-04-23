import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { config } from '../config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  const migrationClient = postgres(config.databaseUrl, { max: 1 });
  const db = drizzle(migrationClient);

  console.log('Running database migrations...');
  await migrate(db, { migrationsFolder: join(__dirname, 'migrations') });
  console.log('Migrations complete.');

  await migrationClient.end();
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

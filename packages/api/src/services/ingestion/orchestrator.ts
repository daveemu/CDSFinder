import { eq, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { ingestionJobs, cdsViews, cdsFields, cdsAnnotations, dataSources } from '../../db/schema/index.js';
import { SapODataClient } from './sap-odata.js';
import { normalizeExtractionView } from './normalizer.js';
import { decrypt } from '../crypto.js';
import type { IngestionJobLog } from '@cdsfinder/shared';

interface StartJobOptions {
  sourceId: string;
}

async function updateJob(
  jobId: string,
  updates: Partial<{
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    startedAt: Date;
    completedAt: Date;
    viewsFound: number;
    viewsCreated: number;
    viewsUpdated: number;
    errorMessage: string;
  }>,
  logEntry?: IngestionJobLog,
) {
  const current = await db.select({ logEntries: ingestionJobs.logEntries }).from(ingestionJobs)
    .where(eq(ingestionJobs.id, jobId))
    .limit(1);

  const currentLogs = (current[0]?.logEntries as IngestionJobLog[] | undefined) ?? [];
  const logs = logEntry ? [...currentLogs, logEntry] : currentLogs;

  await db.update(ingestionJobs).set({ ...updates, logEntries: logs }).where(eq(ingestionJobs.id, jobId));
}

function log(level: IngestionJobLog['level'], message: string): IngestionJobLog {
  return { ts: new Date().toISOString(), level, message };
}

export async function startIngestionJob({ sourceId }: StartJobOptions): Promise<string> {
  // Create job record
  const [job] = await db.insert(ingestionJobs).values({
    sourceId,
    status: 'PENDING',
    sourceType: 'S4_ODATA',
  }).returning({ id: ingestionJobs.id });

  if (!job) throw new Error('Failed to create ingestion job');

  // Run asynchronously
  runJob(job.id, sourceId).catch(console.error);

  return job.id;
}

async function runJob(jobId: string, sourceId: string) {
  await updateJob(jobId, { status: 'RUNNING', startedAt: new Date() }, log('INFO', 'Ingestion job started.'));

  try {
    // Load source config
    const [source] = await db.select().from(dataSources).where(eq(dataSources.id, sourceId)).limit(1);
    if (!source) throw new Error('Data source not found');

    const credentials = source.credentialsEncrypted
      ? (JSON.parse(decrypt(source.credentialsEncrypted)) as { username?: string; password?: string })
      : {};

    const client = new SapODataClient({
      baseUrl: source.baseUrl ?? '',
      systemId: source.systemId ?? '',
      client: source.client ?? '000',
      authType: (source.authType as 'BASIC' | 'OAUTH2'),
      username: credentials.username,
      password: credentials.password,
      maxPageSize: 500,
      timeoutMs: 30_000,
    });

    let viewsFound = 0;
    let viewsCreated = 0;
    let viewsUpdated = 0;

    await updateJob(jobId, {}, log('INFO', `Connected to ${source.baseUrl}. Starting view extraction...`));

    for await (const batch of client.streamExtractionViews()) {
      viewsFound += batch.length;

      for (const raw of batch) {
        const viewData = normalizeExtractionView(raw, sourceId);

        const existing = await db.select({ id: cdsViews.id })
          .from(cdsViews)
          .where(eq(cdsViews.viewName, viewData.viewName))
          .limit(1);

        if (existing.length > 0) {
          await db.update(cdsViews)
            .set({ ...viewData, updatedAt: new Date() })
            .where(eq(cdsViews.viewName, viewData.viewName));
          viewsUpdated++;
        } else {
          await db.insert(cdsViews).values(viewData);
          viewsCreated++;
        }
      }

      await updateJob(jobId, { viewsFound, viewsCreated, viewsUpdated },
        log('INFO', `Processed ${viewsFound} views so far (${viewsCreated} new, ${viewsUpdated} updated).`));
    }

    // Update last_connected on source
    await db.update(dataSources)
      .set({ lastConnected: new Date() })
      .where(eq(dataSources.id, sourceId));

    await updateJob(jobId, {
      status: 'COMPLETED',
      completedAt: new Date(),
      viewsFound,
      viewsCreated,
      viewsUpdated,
    }, log('INFO', `Ingestion complete. ${viewsFound} views found, ${viewsCreated} created, ${viewsUpdated} updated.`));

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await updateJob(jobId, {
      status: 'FAILED',
      completedAt: new Date(),
      errorMessage: message,
    }, log('ERROR', `Ingestion failed: ${message}`));
  }
}

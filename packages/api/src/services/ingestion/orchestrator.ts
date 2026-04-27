import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { ingestionJobs, cdsViews, cdsFields, cdsAnnotations, dataSources } from '../../db/schema/index.js';
import { SapODataClient } from './sap-odata.js';
import { normalizeExtractionView, normalizeODataField, normalizeODataAnnotation } from './normalizer.js';
import { decrypt } from '../crypto.js';
import type { IngestionJobLog, RawODataFieldRecord, RawODataAnnotationRecord } from '@cdsfinder/shared';

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
  const [job] = await db.insert(ingestionJobs).values({
    sourceId,
    status: 'PENDING',
    sourceType: 'S4_ODATA',
  }).returning({ id: ingestionJobs.id });

  if (!job) throw new Error('Failed to create ingestion job');

  runJob(job.id, sourceId).catch(console.error);

  return job.id;
}

async function runJob(jobId: string, sourceId: string) {
  await updateJob(jobId, { status: 'RUNNING', startedAt: new Date() }, log('INFO', 'Ingestion job started.'));

  try {
    const [source] = await db.select().from(dataSources).where(eq(dataSources.id, sourceId)).limit(1);
    if (!source) throw new Error('Data source not found');

    const credentials = source.credentialsEncrypted
      ? (JSON.parse(decrypt(source.credentialsEncrypted)) as { username?: string; password?: string })
      : {};

    const oDataConfig = {
      baseUrl: source.baseUrl ?? '',
      systemId: source.systemId ?? '',
      client: source.client ?? '000',
      authType: (source.authType as 'BASIC' | 'OAUTH2'),
      username: credentials.username,
      password: credentials.password,
      maxPageSize: 500,
      timeoutMs: 30_000,
    };

    const client = new SapODataClient(oDataConfig);

    // ── Phase 1: Ingest CDS views ──────────────────────────────────────────────

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

    // ── Phase 2: Ingest fields (optional) ─────────────────────────────────────

    if (source.fieldsEntityUrl) {
      await updateJob(jobId, {}, log('INFO', `Fetching fields from ${source.fieldsEntityUrl}...`));

      // Build viewName → id map from the views we just ingested
      const allViews = await db.select({ id: cdsViews.id, viewName: cdsViews.viewName }).from(cdsViews);
      const viewIdByName = new Map(allViews.map((v) => [v.viewName, v.id]));

      let fieldsCreated = 0;
      const deletedViewIds = new Set<string>();
      const fieldClient = new SapODataClient({ ...oDataConfig, baseUrl: source.fieldsEntityUrl });

      for await (const batch of fieldClient.streamEntities<RawODataFieldRecord>()) {
        for (const raw of batch) {
          const viewId = viewIdByName.get(raw.ViewName);
          if (!viewId) continue;

          // Delete stale fields on first encounter for this view
          if (!deletedViewIds.has(viewId)) {
            await db.delete(cdsFields).where(eq(cdsFields.viewId, viewId));
            deletedViewIds.add(viewId);
          }

          await db.insert(cdsFields).values({ ...normalizeODataField(raw), viewId });
          fieldsCreated++;
        }
      }

      await updateJob(jobId, {}, log('INFO', `Fields ingested: ${fieldsCreated} records for ${deletedViewIds.size} views.`));
    }

    // ── Phase 3: Ingest annotations (optional) ────────────────────────────────

    if (source.annotationsEntityUrl) {
      await updateJob(jobId, {}, log('INFO', `Fetching annotations from ${source.annotationsEntityUrl}...`));

      const allViews = await db.select({ id: cdsViews.id, viewName: cdsViews.viewName }).from(cdsViews);
      const viewIdByName = new Map(allViews.map((v) => [v.viewName, v.id]));

      let annotationsCreated = 0;
      const deletedViewIds = new Set<string>();
      const annotationClient = new SapODataClient({ ...oDataConfig, baseUrl: source.annotationsEntityUrl });

      for await (const batch of annotationClient.streamEntities<RawODataAnnotationRecord>()) {
        for (const raw of batch) {
          const viewId = viewIdByName.get(raw.ViewName);
          if (!viewId) continue;

          if (!deletedViewIds.has(viewId)) {
            await db.delete(cdsAnnotations).where(eq(cdsAnnotations.viewId, viewId));
            deletedViewIds.add(viewId);
          }

          await db.insert(cdsAnnotations).values({ ...normalizeODataAnnotation(raw), viewId });
          annotationsCreated++;
        }
      }

      await updateJob(jobId, {}, log('INFO', `Annotations ingested: ${annotationsCreated} records for ${deletedViewIds.size} views.`));
    }

    // ── Finalise ───────────────────────────────────────────────────────────────

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

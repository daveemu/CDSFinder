import type { FastifyPluginAsync } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db/client.js';
import { ingestionJobs, cdsViews } from '../db/schema/index.js';
import { startIngestionJob } from '../services/ingestion/orchestrator.js';
import { parseIxtrctnenbldvwCsv } from '../services/ingestion/csv-import.js';
import type { IngestionJobLog } from '@cdsfinder/shared';

export const ingestionRoutes: FastifyPluginAsync = async (app) => {
  // Start a new OData ingestion job (requires custom OData service on SAP side)
  app.post<{ Body: { sourceId: string } }>('/ingestion/jobs', async (request, reply) => {
    const { sourceId } = request.body;
    if (!sourceId) {
      return reply.status(400).send({ error: 'Bad Request', message: 'sourceId is required' });
    }
    const jobId = await startIngestionJob({ sourceId });
    return reply.status(202).send({ data: { jobId } });
  });

  /**
   * CSV import — no SAP system connection required.
   *
   * Accepts a raw CSV/TSV text body exported from:
   *   - SE16 → Table IXTRCTNENBLDVW → System → List → Save → Local File
   *   - Fiori "View Browser" app → Export
   *
   * Request: POST /api/v1/ingestion/csv
   * Content-Type: text/plain  (paste CSV body directly)
   * Optional query param: ?sourceSystemId=<uuid>
   */
  app.post<{ Querystring: { sourceSystemId?: string } }>(
    '/ingestion/csv',
    async (request, reply) => {
      const csvContent = request.body as string;
      if (!csvContent || typeof csvContent !== 'string' || csvContent.trim().length < 10) {
        return reply.status(400).send({ error: 'Bad Request', message: 'CSV body is empty or too short.' });
      }

      const sourceSystemId = request.query.sourceSystemId ?? null;

      const [job] = await db.insert(ingestionJobs).values({
        sourceId: sourceSystemId,
        status: 'RUNNING',
        sourceType: 'CSV_IMPORT',
        startedAt: new Date(),
      }).returning();

      if (!job) return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to create job.' });

      // Run synchronously (CSV parse is fast)
      try {
        const { views, skipped, warnings } = parseIxtrctnenbldvwCsv(csvContent, sourceSystemId);

        const logs: IngestionJobLog[] = [
          { ts: new Date().toISOString(), level: 'INFO', message: `Parsed ${views.length} views from CSV (${skipped} rows skipped).` },
          ...warnings.map((w) => ({ ts: new Date().toISOString(), level: 'WARN' as const, message: w })),
        ];

        let created = 0;
        let updated = 0;

        for (const view of views) {
          const existing = await db.select({ id: cdsViews.id })
            .from(cdsViews).where(eq(cdsViews.viewName, view.viewName)).limit(1);

          if (existing.length > 0) {
            await db.update(cdsViews).set({ ...view, updatedAt: new Date() }).where(eq(cdsViews.viewName, view.viewName));
            updated++;
          } else {
            await db.insert(cdsViews).values(view);
            created++;
          }
        }

        logs.push({ ts: new Date().toISOString(), level: 'INFO', message: `Done. ${created} created, ${updated} updated.` });

        await db.update(ingestionJobs).set({
          status: 'COMPLETED',
          completedAt: new Date(),
          viewsFound: views.length,
          viewsCreated: created,
          viewsUpdated: updated,
          logEntries: logs,
        }).where(eq(ingestionJobs.id, job.id));

        return reply.status(200).send({
          data: {
            jobId: job.id,
            viewsFound: views.length,
            viewsCreated: created,
            viewsUpdated: updated,
            warnings,
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await db.update(ingestionJobs).set({
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: message,
        }).where(eq(ingestionJobs.id, job.id));
        return reply.status(500).send({ error: 'Parse Error', message });
      }
    },
  );

  // Get job status
  app.get<{ Params: { id: string } }>('/ingestion/jobs/:id', async (request, reply) => {
    const { id } = request.params;
    const [job] = await db.select().from(ingestionJobs).where(eq(ingestionJobs.id, id)).limit(1);
    if (!job) return reply.status(404).send({ error: 'Not Found', message: 'Job not found' });
    return { data: job };
  });

  // List recent jobs
  app.get('/ingestion/jobs', async () => {
    const jobs = await db.select().from(ingestionJobs)
      .orderBy(desc(ingestionJobs.createdAt))
      .limit(50);
    return { data: jobs };
  });
};

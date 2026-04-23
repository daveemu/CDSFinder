import type { FastifyPluginAsync } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db/client.js';
import { ingestionJobs } from '../db/schema/index.js';
import { startIngestionJob } from '../services/ingestion/orchestrator.js';

export const ingestionRoutes: FastifyPluginAsync = async (app) => {
  // Start a new ingestion job
  app.post<{ Body: { sourceId: string } }>('/ingestion/jobs', async (request, reply) => {
    const { sourceId } = request.body;

    if (!sourceId) {
      return reply.status(400).send({ error: 'Bad Request', message: 'sourceId is required' });
    }

    const jobId = await startIngestionJob({ sourceId });
    return reply.status(202).send({ data: { jobId } });
  });

  // Get job status
  app.get<{ Params: { id: string } }>('/ingestion/jobs/:id', async (request, reply) => {
    const { id } = request.params;

    const [job] = await db.select().from(ingestionJobs).where(eq(ingestionJobs.id, id)).limit(1);

    if (!job) return reply.status(404).send({ error: 'Not Found', message: 'Job not found' });

    return { data: job };
  });

  // List recent jobs
  app.get('/ingestion/jobs', async (request) => {
    const jobs = await db.select().from(ingestionJobs)
      .orderBy(desc(ingestionJobs.createdAt))
      .limit(50);

    return { data: jobs };
  });
};

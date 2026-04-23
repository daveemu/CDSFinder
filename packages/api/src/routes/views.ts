import type { FastifyPluginAsync } from 'fastify';
import { eq, sql, desc } from 'drizzle-orm';
import { db } from '../db/client.js';
import { cdsViews, cdsFields, cdsAnnotations, cdsAssociations } from '../db/schema/index.js';
import type { StatsResponse } from '@cdsfinder/shared';

export const viewsRoutes: FastifyPluginAsync = async (app) => {
  // Stats endpoint for homepage
  app.get('/stats', async (): Promise<{ data: StatsResponse }> => {
    const [stats] = await db.execute(sql`
      SELECT
        count(*)::int AS total_views,
        count(*) FILTER (WHERE extraction_enabled = true)::int AS extraction_enabled_views,
        count(*) FILTER (WHERE delta_enabled = true)::int AS delta_enabled_views,
        count(DISTINCT sap_module)::int AS module_count,
        max(updated_at) AS last_sync_at
      FROM cds_views
    `);

    const row = stats as {
      total_views: number;
      extraction_enabled_views: number;
      delta_enabled_views: number;
      module_count: number;
      last_sync_at: string | null;
    };

    return {
      data: {
        totalViews: row.total_views ?? 0,
        extractionEnabledViews: row.extraction_enabled_views ?? 0,
        deltaEnabledViews: row.delta_enabled_views ?? 0,
        moduleCount: row.module_count ?? 0,
        lastSyncAt: row.last_sync_at ?? null,
      },
    };
  });

  // Module breakdown
  app.get('/views/modules', async () => {
    const rows = await db.execute(sql`
      SELECT
        sap_module AS module,
        count(*)::int AS view_count,
        count(*) FILTER (WHERE extraction_enabled = true)::int AS extraction_enabled_count
      FROM cds_views
      WHERE sap_module IS NOT NULL
      GROUP BY sap_module
      ORDER BY view_count DESC
    `);

    return { data: rows };
  });

  // Get single view by name (with fields, annotations, associations)
  app.get<{ Params: { viewName: string } }>('/views/:viewName', async (request, reply) => {
    const { viewName } = request.params;

    const [view] = await db.select().from(cdsViews)
      .where(eq(cdsViews.viewName, viewName))
      .limit(1);

    if (!view) return reply.status(404).send({ error: 'Not Found', message: 'View not found' });

    const [fields, annotations, associations] = await Promise.all([
      db.select().from(cdsFields).where(eq(cdsFields.viewId, view.id)).orderBy(cdsFields.fieldName),
      db.select().from(cdsAnnotations).where(eq(cdsAnnotations.viewId, view.id)).orderBy(cdsAnnotations.annotation),
      db.select().from(cdsAssociations).where(eq(cdsAssociations.sourceViewId, view.id)),
    ]);

    return {
      data: {
        ...view,
        fields,
        annotations,
        associations,
      },
    };
  });

  // List recently added views
  app.get('/views/recent', async () => {
    const rows = await db.select({
      id: cdsViews.id,
      viewName: cdsViews.viewName,
      viewLabel: cdsViews.viewLabel,
      sapModule: cdsViews.sapModule,
      extractionEnabled: cdsViews.extractionEnabled,
      vdmViewType: cdsViews.vdmViewType,
      createdAt: cdsViews.createdAt,
    }).from(cdsViews)
      .orderBy(desc(cdsViews.createdAt))
      .limit(10);

    return { data: rows };
  });
};

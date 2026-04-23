import { sql, and, eq, inArray } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { cdsViews } from '../../db/schema/index.js';
import type { SearchQuery, SearchResponse, SearchResultItem } from '@cdsfinder/shared';

function buildFilterConditions(filters: SearchQuery['filters']) {
  const conditions = [];

  if (filters.extractionEnabled !== undefined) {
    conditions.push(eq(cdsViews.extractionEnabled, filters.extractionEnabled));
  }
  if (filters.deltaEnabled !== undefined) {
    conditions.push(eq(cdsViews.deltaEnabled, filters.deltaEnabled));
  }
  if (filters.odataPublished !== undefined) {
    conditions.push(eq(cdsViews.odataPublished, filters.odataPublished));
  }
  if (filters.vdmViewType !== undefined) {
    const types = Array.isArray(filters.vdmViewType) ? filters.vdmViewType : [filters.vdmViewType];
    conditions.push(inArray(cdsViews.vdmViewType, types));
  }
  if (filters.dataCategory !== undefined) {
    const cats = Array.isArray(filters.dataCategory) ? filters.dataCategory : [filters.dataCategory];
    conditions.push(inArray(cdsViews.dataCategory, cats));
  }
  if (filters.sapModule !== undefined) {
    const mods = Array.isArray(filters.sapModule) ? filters.sapModule : [filters.sapModule];
    conditions.push(inArray(cdsViews.sapModule, mods));
  }
  if (filters.releaseVersion !== undefined) {
    conditions.push(eq(cdsViews.releaseVersion, filters.releaseVersion));
  }

  return conditions;
}

export async function fulltextSearch(query: SearchQuery): Promise<SearchResponse> {
  const start = Date.now();
  const { q, filters, page, pageSize } = query;
  const offset = (page - 1) * pageSize;

  const filterConditions = buildFilterConditions(filters);

  let items: SearchResultItem[];
  let total: number;

  if (q && q.trim().length > 0) {
    const searchTerm = q.trim();
    // Use prefix matching for short single words, plainto_tsquery for phrases
    const tsQuery = searchTerm.includes(' ')
      ? sql`plainto_tsquery('english', ${searchTerm})`
      : sql`to_tsquery('english', ${searchTerm + ':*'})`;

    const whereCondition = filterConditions.length > 0
      ? and(sql`"search_vector" @@ ${tsQuery}`, ...filterConditions)
      : sql`"search_vector" @@ ${tsQuery}`;

    const rows = await db.execute(sql`
      SELECT
        id, view_name, view_label, description,
        vdm_view_type, data_category,
        extraction_enabled, delta_enabled, odata_published,
        sap_module, functional_area, release_version,
        ts_rank_cd("search_vector", ${tsQuery}) AS rank
      FROM cds_views
      WHERE ${whereCondition}
      ORDER BY rank DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `);

    const countRow = await db.execute(sql`
      SELECT count(*)::int AS total
      FROM cds_views
      WHERE ${whereCondition}
    `);

    items = (rows as Record<string, unknown>[]).map(mapRow);
    total = (countRow[0] as { total: number } | undefined)?.total ?? 0;
  } else {
    // Filter-only mode
    const whereCondition = filterConditions.length > 0 ? and(...filterConditions) : undefined;

    const rows = await db.select({
      id: cdsViews.id,
      viewName: cdsViews.viewName,
      viewLabel: cdsViews.viewLabel,
      description: cdsViews.description,
      vdmViewType: cdsViews.vdmViewType,
      dataCategory: cdsViews.dataCategory,
      extractionEnabled: cdsViews.extractionEnabled,
      deltaEnabled: cdsViews.deltaEnabled,
      odataPublished: cdsViews.odataPublished,
      sapModule: cdsViews.sapModule,
      functionalArea: cdsViews.functionalArea,
      releaseVersion: cdsViews.releaseVersion,
    }).from(cdsViews)
      .where(whereCondition)
      .limit(pageSize)
      .offset(offset)
      .orderBy(cdsViews.viewName);

    const countRows = await db.execute(
      whereCondition
        ? sql`SELECT count(*)::int AS total FROM cds_views WHERE ${whereCondition}`
        : sql`SELECT count(*)::int AS total FROM cds_views`
    );

    items = rows.map((r) => ({
      id: r.id,
      viewName: r.viewName,
      viewLabel: r.viewLabel,
      description: r.description,
      vdmViewType: r.vdmViewType as SearchResultItem['vdmViewType'],
      dataCategory: r.dataCategory as SearchResultItem['dataCategory'],
      extractionEnabled: r.extractionEnabled,
      deltaEnabled: r.deltaEnabled,
      odataPublished: r.odataPublished,
      sapModule: r.sapModule,
      functionalArea: r.functionalArea,
      releaseVersion: r.releaseVersion,
    }));

    total = (countRows[0] as { total: number } | undefined)?.total ?? 0;
  }

  return {
    items,
    total,
    page,
    pageSize,
    mode: q ? 'fulltext' : 'filter-only',
    durationMs: Date.now() - start,
  };
}

function mapRow(row: Record<string, unknown>): SearchResultItem {
  return {
    id: String(row['id'] ?? ''),
    viewName: String(row['view_name'] ?? ''),
    viewLabel: row['view_label'] ? String(row['view_label']) : null,
    description: row['description'] ? String(row['description']) : null,
    vdmViewType: row['vdm_view_type'] ? (String(row['vdm_view_type']) as SearchResultItem['vdmViewType']) : null,
    dataCategory: row['data_category'] ? (String(row['data_category']) as SearchResultItem['dataCategory']) : null,
    extractionEnabled: Boolean(row['extraction_enabled']),
    deltaEnabled: Boolean(row['delta_enabled']),
    odataPublished: Boolean(row['odata_published']),
    sapModule: row['sap_module'] ? String(row['sap_module']) : null,
    functionalArea: row['functional_area'] ? String(row['functional_area']) : null,
    releaseVersion: row['release_version'] ? String(row['release_version']) : null,
    rank: row['rank'] ? Number(row['rank']) : undefined,
  };
}

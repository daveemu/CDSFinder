import { pgTable, text, boolean, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { dataSources } from './sources.js';

export const cdsViews = pgTable('cds_views', {
  id: uuid('id').defaultRandom().primaryKey(),
  viewName: text('view_name').notNull().unique(),
  viewLabel: text('view_label'),
  sqlViewName: text('sql_view_name'),
  description: text('description'),
  packageName: text('package_name'),
  releaseVersion: text('release_version'),

  // VDM classification
  vdmViewType: text('vdm_view_type').$type<'BASIC' | 'COMPOSITE' | 'CONSUMPTION' | 'EXTENSION'>(),
  dataCategory: text('data_category').$type<'DIMENSION' | 'FACT' | 'CUBE' | 'HIERARCHY' | 'TEXT'>(),

  // Extraction suitability
  extractionEnabled: boolean('extraction_enabled').notNull().default(false),
  deltaEnabled: boolean('delta_enabled').notNull().default(false),
  deltaElementName: text('delta_element_name'),
  odataPublished: boolean('odata_published').notNull().default(false),
  odataEntitySet: text('odata_entity_set'),

  // Module / domain
  sapModule: text('sap_module'),
  functionalArea: text('functional_area'),

  // Source tracking
  sourceType: text('source_type').notNull().$type<'ODATA_LIVE' | 'API_HUB' | 'HELP_PORTAL' | 'MANUAL'>(),
  sourceSystemId: uuid('source_system_id').references(() => dataSources.id, { onDelete: 'set null' }),
  sourceUrl: text('source_url'),

  // search_vector (tsvector) is a generated column added via raw SQL migration
  // embedding (vector) will be added in Phase 3 migration

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  extractionIdx: index('cds_views_extraction_idx').on(table.extractionEnabled),
  vdmTypeIdx: index('cds_views_vdm_type_idx').on(table.vdmViewType),
  moduleIdx: index('cds_views_module_idx').on(table.sapModule),
  dataCategoryIdx: index('cds_views_data_category_idx').on(table.dataCategory),
}));

export type CdsViewRecord = typeof cdsViews.$inferSelect;
export type CdsViewInsertRecord = typeof cdsViews.$inferInsert;

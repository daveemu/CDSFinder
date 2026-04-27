import { pgTable, text, boolean, timestamp, uuid } from 'drizzle-orm/pg-core';

export const dataSources = pgTable('data_sources', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  sourceType: text('source_type').notNull().$type<'S4_ODATA' | 'API_HUB' | 'HELP_PORTAL'>(),
  baseUrl: text('base_url'),
  systemId: text('system_id'),
  client: text('client'),
  authType: text('auth_type').notNull().$type<'BASIC' | 'OAUTH2'>(),
  // credentials stored encrypted as JSON string
  credentialsEncrypted: text('credentials_encrypted'),
  // Optional entity set URLs for enrichment ingestion (fields and annotations).
  // Requires a custom SEGW service that exposes these entity sets.
  fieldsEntityUrl: text('fields_entity_url'),
  annotationsEntityUrl: text('annotations_entity_url'),
  isActive: boolean('is_active').notNull().default(true),
  lastConnected: timestamp('last_connected', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type DataSourceRecord = typeof dataSources.$inferSelect;
export type DataSourceInsertRecord = typeof dataSources.$inferInsert;

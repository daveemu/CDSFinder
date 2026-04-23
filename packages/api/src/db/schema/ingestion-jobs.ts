import { pgTable, text, integer, timestamp, uuid, jsonb, index } from 'drizzle-orm/pg-core';
import { dataSources } from './sources.js';

export const ingestionJobs = pgTable('ingestion_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  sourceId: uuid('source_id').references(() => dataSources.id, { onDelete: 'set null' }),
  status: text('status').notNull().default('PENDING').$type<'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'>(),
  sourceType: text('source_type').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  viewsFound: integer('views_found').notNull().default(0),
  viewsCreated: integer('views_created').notNull().default(0),
  viewsUpdated: integer('views_updated').notNull().default(0),
  errorMessage: text('error_message'),
  logEntries: jsonb('log_entries').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  statusIdx: index('ingestion_jobs_status_idx').on(table.status),
  sourceIdIdx: index('ingestion_jobs_source_id_idx').on(table.sourceId),
}));

export type IngestionJobRecord = typeof ingestionJobs.$inferSelect;
export type IngestionJobInsertRecord = typeof ingestionJobs.$inferInsert;

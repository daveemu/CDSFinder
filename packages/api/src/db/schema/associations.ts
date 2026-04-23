import { pgTable, text, boolean, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { cdsViews } from './cds-views.js';

export const cdsAssociations = pgTable('cds_associations', {
  id: uuid('id').defaultRandom().primaryKey(),
  sourceViewId: uuid('source_view_id').notNull().references(() => cdsViews.id, { onDelete: 'cascade' }),
  targetViewName: text('target_view_name').notNull(),
  associationName: text('association_name').notNull(),
  cardinality: text('cardinality'),
  isComposition: boolean('is_composition').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  sourceViewIdx: index('cds_associations_source_view_idx').on(table.sourceViewId),
}));

export type CdsAssociationRecord = typeof cdsAssociations.$inferSelect;
export type CdsAssociationInsertRecord = typeof cdsAssociations.$inferInsert;

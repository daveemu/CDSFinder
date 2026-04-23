import { pgTable, text, boolean, timestamp, uuid, index, jsonb } from 'drizzle-orm/pg-core';
import { cdsViews } from './cds-views.js';

export const cdsAnnotations = pgTable('cds_annotations', {
  id: uuid('id').defaultRandom().primaryKey(),
  viewId: uuid('view_id').notNull().references(() => cdsViews.id, { onDelete: 'cascade' }),
  annotation: text('annotation').notNull(),
  valueText: text('value_text'),
  valueBool: boolean('value_bool'),
  valueJson: jsonb('value_json'),
  target: text('target'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  viewIdIdx: index('cds_annotations_view_id_idx').on(table.viewId),
  annotationIdx: index('cds_annotations_annotation_idx').on(table.annotation),
  annotationValueIdx: index('cds_annotations_annotation_value_idx').on(table.annotation, table.valueText),
}));

export type CdsAnnotationRecord = typeof cdsAnnotations.$inferSelect;
export type CdsAnnotationInsertRecord = typeof cdsAnnotations.$inferInsert;

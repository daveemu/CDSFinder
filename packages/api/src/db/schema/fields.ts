import { pgTable, text, boolean, integer, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { cdsViews } from './cds-views.js';

export const cdsFields = pgTable('cds_fields', {
  id: uuid('id').defaultRandom().primaryKey(),
  viewId: uuid('view_id').notNull().references(() => cdsViews.id, { onDelete: 'cascade' }),
  fieldName: text('field_name').notNull(),
  aliasName: text('alias_name'),
  dataType: text('data_type'),
  length: integer('length'),
  decimals: integer('decimals'),
  isKey: boolean('is_key').notNull().default(false),
  description: text('description'),
  abapElement: text('abap_element'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  viewIdIdx: index('cds_fields_view_id_idx').on(table.viewId),
}));

export type CdsFieldRecord = typeof cdsFields.$inferSelect;
export type CdsFieldInsertRecord = typeof cdsFields.$inferInsert;

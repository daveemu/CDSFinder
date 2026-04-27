-- Add optional OData entity set URLs for field and annotation ingestion.
-- When set, the orchestrator will also fetch fields/annotations from these URLs.
ALTER TABLE "data_sources" ADD COLUMN IF NOT EXISTS "fields_entity_url" text;
ALTER TABLE "data_sources" ADD COLUMN IF NOT EXISTS "annotations_entity_url" text;

-- Store the SQL view name (ABAP DDIC name) alongside the CDS name.
-- Used to link field data imported from SE11/DD03L where TABNAME = sql_view_name.
ALTER TABLE "cds_views" ADD COLUMN IF NOT EXISTS "sql_view_name" text;

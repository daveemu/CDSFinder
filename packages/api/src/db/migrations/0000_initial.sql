-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- data_sources
CREATE TABLE IF NOT EXISTS "data_sources" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL UNIQUE,
  "source_type" text NOT NULL,
  "base_url" text,
  "system_id" text,
  "client" text,
  "auth_type" text NOT NULL,
  "credentials_encrypted" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "last_connected" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- cds_views
CREATE TABLE IF NOT EXISTS "cds_views" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "view_name" text NOT NULL UNIQUE,
  "view_label" text,
  "description" text,
  "package_name" text,
  "release_version" text,
  "vdm_view_type" text,
  "data_category" text,
  "extraction_enabled" boolean NOT NULL DEFAULT false,
  "delta_enabled" boolean NOT NULL DEFAULT false,
  "delta_element_name" text,
  "odata_published" boolean NOT NULL DEFAULT false,
  "odata_entity_set" text,
  "sap_module" text,
  "functional_area" text,
  "source_type" text NOT NULL,
  "source_system_id" uuid REFERENCES "data_sources"("id") ON DELETE SET NULL,
  "source_url" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Generated tsvector column for full-text search
ALTER TABLE "cds_views"
  ADD COLUMN IF NOT EXISTS "search_vector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce("view_name", '') || ' ' ||
      coalesce("view_label", '') || ' ' ||
      coalesce("description", '') || ' ' ||
      coalesce("sap_module", '') || ' ' ||
      coalesce("functional_area", '')
    )
  ) STORED;

-- GIN index for full-text search
CREATE INDEX IF NOT EXISTS "cds_views_search_vector_idx" ON "cds_views" USING GIN ("search_vector");

-- B-Tree indexes for filter queries
CREATE INDEX IF NOT EXISTS "cds_views_extraction_idx" ON "cds_views" ("extraction_enabled");
CREATE INDEX IF NOT EXISTS "cds_views_vdm_type_idx" ON "cds_views" ("vdm_view_type");
CREATE INDEX IF NOT EXISTS "cds_views_module_idx" ON "cds_views" ("sap_module");
CREATE INDEX IF NOT EXISTS "cds_views_data_category_idx" ON "cds_views" ("data_category");

-- cds_fields
CREATE TABLE IF NOT EXISTS "cds_fields" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "view_id" uuid NOT NULL REFERENCES "cds_views"("id") ON DELETE CASCADE,
  "field_name" text NOT NULL,
  "alias_name" text,
  "data_type" text,
  "length" integer,
  "decimals" integer,
  "is_key" boolean NOT NULL DEFAULT false,
  "description" text,
  "abap_element" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "cds_fields_view_id_idx" ON "cds_fields" ("view_id");

-- cds_annotations
CREATE TABLE IF NOT EXISTS "cds_annotations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "view_id" uuid NOT NULL REFERENCES "cds_views"("id") ON DELETE CASCADE,
  "annotation" text NOT NULL,
  "value_text" text,
  "value_bool" boolean,
  "value_json" jsonb,
  "target" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "cds_annotations_view_id_idx" ON "cds_annotations" ("view_id");
CREATE INDEX IF NOT EXISTS "cds_annotations_annotation_idx" ON "cds_annotations" ("annotation");

-- cds_associations
CREATE TABLE IF NOT EXISTS "cds_associations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "source_view_id" uuid NOT NULL REFERENCES "cds_views"("id") ON DELETE CASCADE,
  "target_view_name" text NOT NULL,
  "association_name" text NOT NULL,
  "cardinality" text,
  "is_composition" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "cds_associations_source_view_idx" ON "cds_associations" ("source_view_id");

-- ingestion_jobs
CREATE TABLE IF NOT EXISTS "ingestion_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "source_id" uuid REFERENCES "data_sources"("id") ON DELETE SET NULL,
  "status" text NOT NULL DEFAULT 'PENDING',
  "source_type" text NOT NULL,
  "started_at" timestamptz,
  "completed_at" timestamptz,
  "views_found" integer NOT NULL DEFAULT 0,
  "views_updated" integer NOT NULL DEFAULT 0,
  "views_created" integer NOT NULL DEFAULT 0,
  "error_message" text,
  "log_entries" jsonb NOT NULL DEFAULT '[]',
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ingestion_jobs_status_idx" ON "ingestion_jobs" ("status");
CREATE INDEX IF NOT EXISTS "ingestion_jobs_source_id_idx" ON "ingestion_jobs" ("source_id");

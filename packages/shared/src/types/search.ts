import type { VdmViewType, DataCategory } from './cds-view.js';

export type SearchMode = 'fulltext' | 'semantic' | 'filter-only';

export interface SearchFilters {
  extractionEnabled?: boolean;
  deltaEnabled?: boolean;
  odataPublished?: boolean;
  vdmViewType?: VdmViewType | VdmViewType[];
  dataCategory?: DataCategory | DataCategory[];
  sapModule?: string | string[];
  releaseVersion?: string;
}

export interface SearchQuery {
  q?: string;
  mode: SearchMode;
  filters: SearchFilters;
  page: number;
  pageSize: number;
}

export interface SearchResultItem {
  id: string;
  viewName: string;
  viewLabel: string | null;
  description: string | null;
  vdmViewType: VdmViewType | null;
  dataCategory: DataCategory | null;
  extractionEnabled: boolean;
  deltaEnabled: boolean;
  odataPublished: boolean;
  sapModule: string | null;
  functionalArea: string | null;
  releaseVersion: string | null;
  rank?: number;
  similarity?: number;
}

export interface SearchResponse {
  items: SearchResultItem[];
  total: number;
  page: number;
  pageSize: number;
  mode: SearchMode;
  durationMs: number;
}

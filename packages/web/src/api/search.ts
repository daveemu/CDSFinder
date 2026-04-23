import { apiFetch } from './client.js';
import type { SearchResponse } from '@cdsfinder/shared';

export interface SearchParams {
  q?: string;
  extractionEnabled?: boolean;
  deltaEnabled?: boolean;
  vdmViewType?: string | string[];
  dataCategory?: string | string[];
  sapModule?: string | string[];
  releaseVersion?: string;
  page?: number;
  pageSize?: number;
}

export async function searchViews(params: SearchParams): Promise<SearchResponse> {
  const qs = new URLSearchParams();

  if (params.q) qs.set('q', params.q);
  if (params.extractionEnabled !== undefined) qs.set('extractionEnabled', String(params.extractionEnabled));
  if (params.deltaEnabled !== undefined) qs.set('deltaEnabled', String(params.deltaEnabled));
  if (params.vdmViewType) {
    const v = Array.isArray(params.vdmViewType) ? params.vdmViewType.join(',') : params.vdmViewType;
    qs.set('vdmViewType', v);
  }
  if (params.dataCategory) {
    const v = Array.isArray(params.dataCategory) ? params.dataCategory.join(',') : params.dataCategory;
    qs.set('dataCategory', v);
  }
  if (params.sapModule) {
    const v = Array.isArray(params.sapModule) ? params.sapModule.join(',') : params.sapModule;
    qs.set('sapModule', v);
  }
  if (params.releaseVersion) qs.set('releaseVersion', params.releaseVersion);
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));

  return apiFetch<SearchResponse>(`/api/v1/search?${qs.toString()}`);
}

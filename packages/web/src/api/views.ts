import { apiFetch } from './client.js';
import type { CdsViewDetail, ModuleStats, StatsResponse } from '@cdsfinder/shared';

export async function fetchStats(): Promise<StatsResponse> {
  const res = await apiFetch<{ data: StatsResponse }>('/api/v1/stats');
  return res.data;
}

export async function fetchView(viewName: string): Promise<CdsViewDetail> {
  const res = await apiFetch<{ data: CdsViewDetail }>(`/api/v1/views/${viewName}`);
  return res.data;
}

export async function fetchModules(): Promise<ModuleStats[]> {
  const res = await apiFetch<{ data: ModuleStats[] }>('/api/v1/views/modules');
  return res.data;
}

export async function fetchRecentViews() {
  const res = await apiFetch<{ data: unknown[] }>('/api/v1/views/recent');
  return res.data;
}

import { apiFetch } from './client.js';
import type { IngestionJob, DataSource, DataSourceInsert, ConnectionTestResult } from '@cdsfinder/shared';

export async function fetchSources(): Promise<DataSource[]> {
  const res = await apiFetch<{ data: DataSource[] }>('/api/v1/sources');
  return res.data;
}

export async function createSource(data: DataSourceInsert): Promise<DataSource> {
  const res = await apiFetch<{ data: DataSource }>('/api/v1/sources', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateSource(id: string, data: Partial<DataSourceInsert>): Promise<DataSource> {
  const res = await apiFetch<{ data: DataSource }>(`/api/v1/sources/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteSource(id: string): Promise<void> {
  await apiFetch(`/api/v1/sources/${id}`, { method: 'DELETE' });
}

export async function testConnection(id: string): Promise<ConnectionTestResult> {
  const res = await apiFetch<{ data: ConnectionTestResult }>(`/api/v1/sources/${id}/test`, {
    method: 'POST',
  });
  return res.data;
}

export async function startJob(sourceId: string): Promise<{ jobId: string }> {
  const res = await apiFetch<{ data: { jobId: string } }>('/api/v1/ingestion/jobs', {
    method: 'POST',
    body: JSON.stringify({ sourceId }),
  });
  return res.data;
}

export async function fetchJob(jobId: string): Promise<IngestionJob> {
  const res = await apiFetch<{ data: IngestionJob }>(`/api/v1/ingestion/jobs/${jobId}`);
  return res.data;
}

export async function fetchJobs(): Promise<IngestionJob[]> {
  const res = await apiFetch<{ data: IngestionJob[] }>('/api/v1/ingestion/jobs');
  return res.data;
}

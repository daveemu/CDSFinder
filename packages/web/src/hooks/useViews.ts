import { useQuery } from '@tanstack/react-query';
import { fetchView, fetchStats, fetchModules, fetchRecentViews } from '../api/views.js';

export function useView(viewName: string | undefined) {
  return useQuery({
    queryKey: ['view', viewName],
    queryFn: () => fetchView(viewName!),
    enabled: Boolean(viewName),
  });
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });
}

export function useModules() {
  return useQuery({
    queryKey: ['modules'],
    queryFn: fetchModules,
  });
}

export function useRecentViews() {
  return useQuery({
    queryKey: ['recent-views'],
    queryFn: fetchRecentViews,
  });
}

import { useQuery } from '@tanstack/react-query';
import { searchViews, type SearchParams } from '../api/search.js';

export function useSearch(params: SearchParams, enabled = true) {
  return useQuery({
    queryKey: ['search', params],
    queryFn: () => searchViews(params),
    enabled,
    placeholderData: (prev) => prev,
  });
}

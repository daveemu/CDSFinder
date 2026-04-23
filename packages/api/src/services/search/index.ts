import { fulltextSearch } from './full-text.js';
import type { SearchQuery, SearchResponse } from '@cdsfinder/shared';

export async function search(query: SearchQuery): Promise<SearchResponse> {
  // Semantic search will be added in Phase 3
  return fulltextSearch(query);
}

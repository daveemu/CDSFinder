import { create } from 'zustand';
import type { SearchParams } from '../api/search.js';

interface SearchFiltersStore {
  filters: SearchParams;
  setFilters: (filters: SearchParams) => void;
  resetFilters: () => void;
}

export const useSearchFilters = create<SearchFiltersStore>((set) => ({
  filters: {},
  setFilters: (filters) => set({ filters }),
  resetFilters: () => set({ filters: {} }),
}));

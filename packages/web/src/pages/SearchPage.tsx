import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/search/SearchBar.js';
import SearchFilters from '../components/search/SearchFilters.js';
import SearchResults from '../components/search/SearchResults.js';
import { useSearch } from '../hooks/useSearch.js';
import { useModules } from '../hooks/useViews.js';
import type { SearchParams } from '../api/search.js';

function paramsFromURL(sp: URLSearchParams): SearchParams {
  const params: SearchParams = {};
  if (sp.get('q')) params.q = sp.get('q')!;
  if (sp.get('extractionEnabled')) params.extractionEnabled = sp.get('extractionEnabled') === 'true';
  if (sp.get('deltaEnabled')) params.deltaEnabled = sp.get('deltaEnabled') === 'true';
  if (sp.get('vdmViewType')) params.vdmViewType = sp.get('vdmViewType')!.split(',');
  if (sp.get('sapModule')) params.sapModule = sp.get('sapModule')!.split(',');
  if (sp.get('page')) params.page = parseInt(sp.get('page')!, 10);
  return params;
}

function paramsToURL(params: SearchParams): URLSearchParams {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.extractionEnabled !== undefined) sp.set('extractionEnabled', String(params.extractionEnabled));
  if (params.deltaEnabled !== undefined) sp.set('deltaEnabled', String(params.deltaEnabled));
  if (params.vdmViewType) sp.set('vdmViewType', Array.isArray(params.vdmViewType) ? params.vdmViewType.join(',') : params.vdmViewType);
  if (params.sapModule) sp.set('sapModule', Array.isArray(params.sapModule) ? params.sapModule.join(',') : params.sapModule);
  if (params.page && params.page > 1) sp.set('page', String(params.page));
  return sp;
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [params, setParams] = useState<SearchParams>(() => ({
    ...paramsFromURL(searchParams),
    pageSize: 25,
    page: parseInt(searchParams.get('page') ?? '1', 10),
  }));

  // Sync URL → state when URL changes externally
  useEffect(() => {
    setParams((prev) => ({ ...paramsFromURL(searchParams), pageSize: prev.pageSize, page: parseInt(searchParams.get('page') ?? '1', 10) }));
  }, [searchParams]);

  const { data, isFetching } = useSearch(params, true);
  const { data: modules = [] } = useModules();
  const moduleNames = modules.map((m) => m.module).filter(Boolean);

  const updateParams = (next: SearchParams) => {
    const merged = { ...next, pageSize: 25 };
    setParams(merged);
    setSearchParams(paramsToURL(merged), { replace: true });
  };

  const handleSearch = (q: string) => updateParams({ ...params, q: q || undefined, page: 1 });
  const handleFilters = (filters: SearchParams) => updateParams({ q: params.q, ...filters, page: 1 });
  const handlePage = (page: number) => updateParams({ ...params, page });

  return (
    <div className="flex h-full">
      {/* Filter sidebar */}
      <div className="w-60 p-4 border-r border-gray-200 overflow-y-auto shrink-0">
        <SearchFilters
          filters={params}
          modules={moduleNames}
          onChange={handleFilters}
        />
      </div>

      {/* Main area */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-5">
          <SearchBar
            initialValue={params.q ?? ''}
            onSearch={handleSearch}
          />
        </div>

        <SearchResults
          items={data?.items ?? []}
          total={data?.total ?? 0}
          page={params.page ?? 1}
          pageSize={params.pageSize ?? 25}
          isLoading={isFetching && !data}
          onPageChange={handlePage}
        />
      </div>
    </div>
  );
}

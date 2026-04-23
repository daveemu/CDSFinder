import { useState } from 'react';
import { useModules } from '../hooks/useViews.js';
import { useSearch } from '../hooks/useSearch.js';
import ViewCard from '../components/views/ViewCard.js';
import { getModuleLabel } from '@cdsfinder/shared';

export default function BrowsePage() {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data: modules = [], isLoading: modulesLoading } = useModules();

  const { data: searchResult, isFetching } = useSearch(
    { sapModule: selectedModule ?? undefined, page, pageSize: 25 },
    selectedModule !== null,
  );

  const handleModuleClick = (mod: string) => {
    setSelectedModule(mod === selectedModule ? null : mod);
    setPage(1);
  };

  return (
    <div className="flex h-full">
      {/* Module tree */}
      <div className="w-60 border-r border-gray-200 overflow-y-auto shrink-0">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">SAP Modules</h2>
        </div>
        {modulesLoading ? (
          <div className="p-4 text-sm text-gray-400">Loading…</div>
        ) : modules.length === 0 ? (
          <div className="p-4 text-sm text-gray-400">No modules yet. Run an ingestion first.</div>
        ) : (
          <div className="p-2">
            {modules.map((mod) => (
              <button
                key={mod.module}
                onClick={() => handleModuleClick(mod.module)}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  selectedModule === mod.module
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono font-semibold">{mod.module}</span>
                  <span className="text-xs text-gray-400">{mod.viewCount}</span>
                </div>
                <div className="text-xs text-gray-400 truncate">{getModuleLabel(mod.module)}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Views panel */}
      <div className="flex-1 p-6 overflow-y-auto">
        {!selectedModule ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">📂</div>
            <p className="text-gray-500">Select a module from the left to browse its CDS views.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedModule}</h2>
                <p className="text-sm text-gray-500">{getModuleLabel(selectedModule)}</p>
              </div>
              {searchResult && (
                <span className="text-sm text-gray-500">{searchResult.total.toLocaleString()} views</span>
              )}
            </div>

            {isFetching && !searchResult ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {(searchResult?.items ?? []).map((item) => (
                    <ViewCard key={item.id} view={item} />
                  ))}
                </div>

                {searchResult && searchResult.total > 25 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
                    >
                      ← Prev
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {page} of {Math.ceil(searchResult.total / 25)}
                    </span>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= Math.ceil(searchResult.total / 25)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

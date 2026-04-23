import type { SearchResultItem } from '@cdsfinder/shared';
import ViewCard from '../views/ViewCard.js';

interface SearchResultsProps {
  items: SearchResultItem[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

export default function SearchResults({ items, total, page, pageSize, isLoading, onPageChange }: SearchResultsProps) {
  const totalPages = Math.ceil(total / pageSize);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <div className="text-4xl mb-3">🔍</div>
        <p className="text-gray-500 text-sm">No views found. Try different search terms or adjust filters.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-xs text-gray-500 mb-3">
        {total.toLocaleString()} result{total !== 1 ? 's' : ''}
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <ViewCard key={item.id} view={item} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

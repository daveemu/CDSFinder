import { Link } from 'react-router-dom';
import type { SearchResultItem } from '@cdsfinder/shared';
import ExtractionBadge from './ExtractionBadge.js';
import Badge from '../common/Badge.js';
import CopyButton from '../common/CopyButton.js';

interface ViewCardProps {
  view: SearchResultItem;
}

const vdmColors: Record<string, 'blue' | 'purple' | 'green' | 'gray'> = {
  BASIC: 'gray',
  COMPOSITE: 'blue',
  CONSUMPTION: 'purple',
  EXTENSION: 'green',
};

export default function ViewCard({ view }: ViewCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/views/${view.viewName}`}
              className="font-mono text-sm font-semibold text-blue-700 hover:underline truncate"
            >
              {view.viewName}
            </Link>
            <CopyButton text={view.viewName} />
          </div>
          {view.viewLabel && (
            <div className="text-sm text-gray-700 mt-0.5">{view.viewLabel}</div>
          )}
          {view.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{view.description}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          {view.vdmViewType && (
            <Badge variant={vdmColors[view.vdmViewType] ?? 'gray'}>{view.vdmViewType}</Badge>
          )}
          {view.sapModule && <Badge variant="gray">{view.sapModule}</Badge>}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <ExtractionBadge
          extractionEnabled={view.extractionEnabled}
          deltaEnabled={view.deltaEnabled}
          odataPublished={view.odataPublished}
        />
        {view.releaseVersion && (
          <span className="text-xs text-gray-400">{view.releaseVersion}</span>
        )}
      </div>
    </div>
  );
}

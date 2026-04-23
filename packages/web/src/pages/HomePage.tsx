import { Link } from 'react-router-dom';
import SearchBar from '../components/search/SearchBar.js';
import { useStats, useModules } from '../hooks/useViews.js';
import { getModuleLabel } from '@cdsfinder/shared';

export default function HomePage() {
  const { data: stats } = useStats();
  const { data: modules = [] } = useModules();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SAP CDS View Finder</h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          Find and understand CDS Views suitable for data extraction into SAP Analytics Cloud and Datasphere.
        </p>
      </div>

      <div className="max-w-2xl mx-auto mb-10">
        <SearchBar autoNavigate placeholder="Search views, e.g. I_SalesOrder, Costcenter, Material…" />
        <div className="flex gap-4 mt-3 justify-center text-sm">
          <Link to="/search?extractionEnabled=true" className="text-blue-600 hover:underline">
            Extraction-ready views
          </Link>
          <span className="text-gray-300">·</span>
          <Link to="/search?deltaEnabled=true" className="text-blue-600 hover:underline">
            Delta-enabled views
          </Link>
          <span className="text-gray-300">·</span>
          <Link to="/browse" className="text-blue-600 hover:underline">
            Browse by module
          </Link>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: '📋' },
            { label: 'Extraction Ready', value: stats.extractionEnabledViews.toLocaleString(), icon: '✅' },
            { label: 'Delta Enabled', value: stats.deltaEnabledViews.toLocaleString(), icon: '⚡' },
            { label: 'SAP Modules', value: stats.moduleCount.toLocaleString(), icon: '📦' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {stats?.totalViews === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center mb-10">
          <p className="text-amber-800 text-sm font-medium">No views indexed yet.</p>
          <p className="text-amber-700 text-sm mt-1">
            Go to <Link to="/admin/sources" className="underline">Admin → SAP Sources</Link> to add your S/4HANA system,
            then run an <Link to="/admin/ingestion" className="underline">Ingestion</Link>.
          </p>
        </div>
      )}

      {/* Module tiles */}
      {modules.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Browse by Module</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {modules.slice(0, 12).map((mod) => (
              <Link
                key={mod.module}
                to={`/search?sapModule=${mod.module}`}
                className="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <div className="font-mono text-sm font-bold text-gray-800 group-hover:text-blue-700">
                  {mod.module}
                </div>
                <div className="text-xs text-gray-500 mt-0.5 truncate">{getModuleLabel(mod.module)}</div>
                <div className="text-xs text-gray-400 mt-2">
                  {mod.viewCount} views · {mod.extractionEnabledCount} ready
                </div>
              </Link>
            ))}
          </div>
          {modules.length > 12 && (
            <div className="text-center mt-4">
              <Link to="/browse" className="text-sm text-blue-600 hover:underline">
                View all {modules.length} modules →
              </Link>
            </div>
          )}
        </div>
      )}

      {stats?.lastSyncAt && (
        <p className="text-xs text-gray-400 text-center mt-8">
          Last updated: {new Date(stats.lastSyncAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}

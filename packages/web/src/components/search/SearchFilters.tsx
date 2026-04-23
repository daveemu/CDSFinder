import type { SearchParams } from '../../api/search.js';

interface SearchFiltersProps {
  filters: SearchParams;
  modules: string[];
  onChange: (filters: SearchParams) => void;
}

const VDM_TYPES = ['BASIC', 'COMPOSITE', 'CONSUMPTION', 'EXTENSION'];
const DATA_CATEGORIES = ['FACT', 'DIMENSION', 'CUBE', 'HIERARCHY', 'TEXT'];

function Toggle({ label, checked, onChange }: { label: string; checked: boolean | undefined; onChange: (v: boolean | undefined) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div
        onClick={() => onChange(checked === true ? undefined : true)}
        className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${checked === true ? 'bg-blue-600' : 'bg-gray-300'}`}
      >
        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${checked === true ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

export default function SearchFilters({ filters, modules, onChange }: SearchFiltersProps) {
  const selectedVdm = Array.isArray(filters.vdmViewType) ? filters.vdmViewType : (filters.vdmViewType ? [filters.vdmViewType] : []);
  const selectedModules = Array.isArray(filters.sapModule) ? filters.sapModule : (filters.sapModule ? [filters.sapModule] : []);

  const toggleVdm = (type: string) => {
    const next = selectedVdm.includes(type) ? selectedVdm.filter((t) => t !== type) : [...selectedVdm, type];
    onChange({ ...filters, vdmViewType: next.length ? next : undefined });
  };

  const toggleModule = (mod: string) => {
    const next = selectedModules.includes(mod) ? selectedModules.filter((m) => m !== mod) : [...selectedModules, mod];
    onChange({ ...filters, sapModule: next.length ? next : undefined });
  };

  const clearAll = () => onChange({});

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">Filters</h3>
        <button onClick={clearAll} className="text-xs text-blue-600 hover:underline">Clear all</button>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Extraction</div>
        <Toggle label="Extraction Ready" checked={filters.extractionEnabled} onChange={(v) => onChange({ ...filters, extractionEnabled: v })} />
        <Toggle label="Delta Enabled" checked={filters.deltaEnabled} onChange={(v) => onChange({ ...filters, deltaEnabled: v })} />
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">VDM Type</div>
        {VDM_TYPES.map((type) => (
          <label key={type} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedVdm.includes(type)}
              onChange={() => toggleVdm(type)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{type}</span>
          </label>
        ))}
      </div>

      {modules.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Module</div>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {modules.map((mod) => (
              <label key={mod} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedModules.includes(mod)}
                  onChange={() => toggleModule(mod)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{mod}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import type { CdsAnnotation } from '@cdsfinder/shared';

interface ViewAnnotationsProps {
  annotations: CdsAnnotation[];
}

function groupByNamespace(annotations: CdsAnnotation[]) {
  const groups: Record<string, CdsAnnotation[]> = {};
  for (const ann of annotations) {
    const ns = ann.annotation.split('.')[0] ?? 'Other';
    (groups[ns] ??= []).push(ann);
  }
  return groups;
}

function formatValue(ann: CdsAnnotation): string {
  if (ann.valueBool !== null) return ann.valueBool ? 'true' : 'false';
  if (ann.valueText !== null) return ann.valueText;
  if (ann.valueJson !== null) return JSON.stringify(ann.valueJson, null, 2);
  return '—';
}

export default function ViewAnnotations({ annotations }: ViewAnnotationsProps) {
  if (annotations.length === 0) {
    return <p className="text-sm text-gray-500">No annotations available.</p>;
  }

  const groups = groupByNamespace(annotations);

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([ns, anns]) => (
        <div key={ns}>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{ns}</h3>
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-2/5">Annotation</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-1/5">Target</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {anns.map((ann) => (
                  <tr key={ann.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs text-blue-800 break-all">{ann.annotation}</td>
                    <td className="px-4 py-2 text-xs text-gray-500">{ann.target ?? 'View'}</td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {ann.valueBool !== null ? (
                        <span className={ann.valueBool ? 'text-green-700' : 'text-red-600'}>
                          {ann.valueBool ? '✓ true' : '✗ false'}
                        </span>
                      ) : (
                        <span className="text-gray-700">{formatValue(ann)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

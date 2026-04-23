import type { CdsField } from '@cdsfinder/shared';

interface ViewFieldsProps {
  fields: CdsField[];
}

export default function ViewFields({ fields }: ViewFieldsProps) {
  if (fields.length === 0) {
    return <p className="text-sm text-gray-500">No field metadata available. Run ingestion to enrich field data.</p>;
  }

  return (
    <div className="overflow-hidden border border-gray-200 rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Field</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Alias</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Type</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Key</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {fields.map((field) => (
            <tr key={field.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 font-mono text-xs font-semibold text-gray-800">{field.fieldName}</td>
              <td className="px-4 py-2 font-mono text-xs text-gray-500">{field.aliasName ?? '—'}</td>
              <td className="px-4 py-2 text-xs text-gray-600">
                {field.dataType ?? '—'}
                {field.length ? `(${field.length}${field.decimals ? `,${field.decimals}` : ''})` : ''}
              </td>
              <td className="px-4 py-2 text-xs">
                {field.isKey && <span className="text-yellow-600 font-bold" title="Key field">🔑</span>}
              </td>
              <td className="px-4 py-2 text-xs text-gray-500">{field.description ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

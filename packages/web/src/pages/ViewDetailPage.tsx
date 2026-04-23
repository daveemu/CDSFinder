import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useView } from '../hooks/useViews.js';
import ExtractionBadge from '../components/views/ExtractionBadge.js';
import ViewAnnotations from '../components/views/ViewAnnotations.js';
import ViewFields from '../components/views/ViewFields.js';
import CopyButton from '../components/common/CopyButton.js';
import Badge from '../components/common/Badge.js';
import type { CdsAssociation } from '@cdsfinder/shared';

type Tab = 'overview' | 'fields' | 'annotations' | 'associations';

export default function ViewDetailPage() {
  const { viewName } = useParams<{ viewName: string }>();
  const { data: view, isLoading, isError } = useView(viewName);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-100 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (isError || !view) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <div className="text-4xl mb-3">🔍</div>
        <p className="text-gray-600">View not found: <code className="font-mono bg-gray-100 px-1">{viewName}</code></p>
        <Link to="/search" className="text-blue-600 text-sm hover:underline mt-2 inline-block">← Back to search</Link>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'fields', label: 'Fields', count: view.fields.length },
    { id: 'annotations', label: 'Annotations', count: view.annotations.length },
    { id: 'associations', label: 'Associations', count: view.associations.length },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link to="/search" className="text-sm text-gray-400 hover:text-gray-600">← Back to search</Link>
        <div className="flex items-start justify-between mt-2">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-mono text-2xl font-bold text-gray-900">{view.viewName}</h1>
              <CopyButton text={view.viewName} label="Copy view name" />
            </div>
            {view.viewLabel && (
              <p className="text-gray-600 mt-1">{view.viewLabel}</p>
            )}
            {view.description && (
              <p className="text-sm text-gray-500 mt-2 max-w-2xl">{view.description}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {view.vdmViewType && <Badge variant="blue">{view.vdmViewType}</Badge>}
            {view.dataCategory && <Badge variant="purple">{view.dataCategory}</Badge>}
          </div>
        </div>

        <div className="mt-3">
          <ExtractionBadge
            extractionEnabled={view.extractionEnabled}
            deltaEnabled={view.deltaEnabled}
            odataPublished={view.odataPublished}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-6">
          <InfoSection title="Technical">
            <InfoRow label="View Name" value={<code className="font-mono text-sm">{view.viewName}</code>} />
            <InfoRow label="Package" value={view.packageName} />
            <InfoRow label="Release" value={view.releaseVersion} />
            <InfoRow label="VDM Type" value={view.vdmViewType} />
            <InfoRow label="Data Category" value={view.dataCategory} />
          </InfoSection>
          <InfoSection title="Extraction">
            <InfoRow label="Extraction Enabled" value={view.extractionEnabled ? '✅ Yes' : '✗ No'} />
            <InfoRow label="Delta Enabled" value={view.deltaEnabled ? '✅ Yes' : '✗ No'} />
            <InfoRow label="Delta Field" value={view.deltaElementName} />
            <InfoRow label="OData Published" value={view.odataPublished ? '✅ Yes' : '✗ No'} />
            <InfoRow label="OData Entity Set" value={view.odataEntitySet} />
          </InfoSection>
          <InfoSection title="Classification">
            <InfoRow label="Module" value={view.sapModule} />
            <InfoRow label="Functional Area" value={view.functionalArea} />
          </InfoSection>
          <InfoSection title="Source">
            <InfoRow label="Source Type" value={view.sourceType} />
            <InfoRow label="Last Updated" value={new Date(view.updatedAt).toLocaleString()} />
          </InfoSection>
        </div>
      )}

      {activeTab === 'fields' && <ViewFields fields={view.fields} />}
      {activeTab === 'annotations' && <ViewAnnotations annotations={view.annotations} />}
      {activeTab === 'associations' && <AssociationsTab associations={view.associations} />}
    </div>
  );
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h3>
      <dl className="space-y-2">{children}</dl>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value || value === null) return null;
  return (
    <div className="flex gap-2">
      <dt className="text-xs text-gray-500 w-32 shrink-0">{label}</dt>
      <dd className="text-xs text-gray-800">{value}</dd>
    </div>
  );
}

function AssociationsTab({ associations }: { associations: CdsAssociation[] }) {
  if (associations.length === 0) {
    return <p className="text-sm text-gray-500">No associations available.</p>;
  }
  return (
    <div className="overflow-hidden border border-gray-200 rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Association</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Target View</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Cardinality</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {associations.map((assoc) => (
            <tr key={assoc.id}>
              <td className="px-4 py-2 font-mono text-xs">{assoc.associationName}</td>
              <td className="px-4 py-2">
                <Link to={`/views/${assoc.targetViewName}`} className="font-mono text-xs text-blue-700 hover:underline">
                  {assoc.targetViewName}
                </Link>
              </td>
              <td className="px-4 py-2 text-xs text-gray-500">{assoc.cardinality ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

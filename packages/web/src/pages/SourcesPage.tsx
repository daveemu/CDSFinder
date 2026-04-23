import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSources, createSource, deleteSource, testConnection } from '../api/ingestion.js';
import type { DataSourceInsert } from '@cdsfinder/shared';

const emptyForm: DataSourceInsert = {
  name: '',
  sourceType: 'S4_ODATA',
  baseUrl: '',
  systemId: '',
  client: '000',
  authType: 'BASIC',
  username: '',
  password: '',
};

export default function SourcesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<DataSourceInsert>(emptyForm);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ['sources'],
    queryFn: fetchSources,
  });

  const createMutation = useMutation({
    mutationFn: createSource,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['sources'] });
      setShowForm(false);
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSource,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['sources'] }),
  });

  const testMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => testConnection(id),
    onSuccess: (result, { id }) => {
      setTestResults((prev) => ({ ...prev, [id]: result }));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  const set = (key: keyof DataSourceInsert) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">OData Sources</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure custom OData endpoints for automated sync.{' '}
            <a href="/admin/ingestion" className="text-blue-600 hover:underline">
              To import via CSV paste, use Import Views instead.
            </a>
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Source
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-5 mb-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">New S/4HANA Connection</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Display Name *" value={form.name} onChange={set('name')} required placeholder="Production ERP" />
            <Field label="Base URL *" value={form.baseUrl ?? ''} onChange={set('baseUrl')} required placeholder="https://s4host:8000" />
            <Field label="System ID (SID)" value={form.systemId ?? ''} onChange={set('systemId')} placeholder="PRD" />
            <Field label="SAP Client" value={form.client ?? ''} onChange={set('client')} placeholder="100" />
            <Field label="Username" value={form.username ?? ''} onChange={set('username')} placeholder="RFC_USER" />
            <Field label="Password" value={form.password ?? ''} onChange={set('password')} type="password" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={createMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {createMutation.isPending ? 'Saving…' : 'Save Source'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
          {createMutation.isError && (
            <p className="text-sm text-red-600">{(createMutation.error as Error).message}</p>
          )}
        </form>
      )}

      {isLoading ? (
        <div className="text-sm text-gray-500">Loading sources…</div>
      ) : sources.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg p-12 text-center">
          <div className="text-4xl mb-3">🔗</div>
          <p className="text-gray-500 text-sm">No sources configured yet. Add your first S/4HANA connection above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map((src) => (
            <div key={src.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-gray-900">{src.name}</div>
                  <div className="text-sm text-gray-500 font-mono mt-0.5">{src.baseUrl}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    SID: {src.systemId ?? '—'} · Client: {src.client ?? '—'} · Auth: {src.authType}
                    {src.lastConnected && (
                      <> · Last connected: {new Date(src.lastConnected).toLocaleString()}</>
                    )}
                  </div>
                  {testResults[src.id] && (
                    <div className={`mt-2 text-xs ${testResults[src.id]!.success ? 'text-green-700' : 'text-red-700'}`}>
                      {testResults[src.id]!.success ? '✓' : '✗'} {testResults[src.id]!.message}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => testMutation.mutate({ id: src.id })}
                    disabled={testMutation.isPending}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    {testMutation.isPending ? '…' : 'Test'}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${src.name}"?`)) deleteMutation.mutate(src.id);
                    }}
                    className="px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, required, placeholder, type = 'text' }: {
  label: string; value: string; onChange: React.ChangeEventHandler<HTMLInputElement>;
  required?: boolean; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSources, startJob, fetchJobs } from '../api/ingestion.js';
import { apiFetch } from '../api/client.js';
import { useIngestionJob } from '../hooks/useIngestionJob.js';
import JobStatusCard from '../components/ingestion/JobStatusCard.js';

type ImportMethod = 'csv' | 'odata';

export default function IngestionPage() {
  const qc = useQueryClient();
  const [method, setMethod] = useState<ImportMethod>('csv');

  // CSV state
  const [csvText, setCsvText] = useState('');
  const [csvResult, setCsvResult] = useState<{ viewsFound: number; viewsCreated: number; viewsUpdated: number; warnings: string[] } | null>(null);

  // OData state
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const { data: sources = [] } = useQuery({ queryKey: ['sources'], queryFn: fetchSources });
  const { data: jobs = [], refetch: refetchJobs } = useQuery({ queryKey: ['ingestion-jobs'], queryFn: fetchJobs });
  const { data: activeJob } = useIngestionJob(activeJobId);

  const odataMutation = useMutation({
    mutationFn: () => startJob(selectedSourceId),
    onSuccess: ({ jobId }) => {
      setActiveJobId(jobId);
      void refetchJobs();
    },
  });

  const csvMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch<{ data: { viewsFound: number; viewsCreated: number; viewsUpdated: number; warnings: string[] } }>(
        '/api/v1/ingestion/csv',
        { method: 'POST', body: csvText, headers: { 'Content-Type': 'text/plain' } },
      );
      return res.data;
    },
    onSuccess: (data) => {
      setCsvResult(data);
      void refetchJobs();
      void qc.invalidateQueries({ queryKey: ['stats'] });
      void qc.invalidateQueries({ queryKey: ['modules'] });
    },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">CDS View Import</h1>
        <p className="text-sm text-gray-500 mt-1">
          Import CDS view metadata from your S/4HANA On-Premise system.
        </p>
      </div>

      {/* Method selector */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMethod('csv')}
          className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
            method === 'csv' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          SE16 CSV Export
        </button>
        <button
          onClick={() => setMethod('odata')}
          className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
            method === 'odata' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Custom OData Service
        </button>
      </div>

      {/* CSV Import */}
      {method === 'csv' && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-1">Import via SE16 CSV Export</h2>
          <p className="text-xs text-gray-500 mb-4">
            No SAP connection required. Export table <code className="bg-gray-100 px-1 rounded font-mono">IXTRCTNENBLDVW</code> from SE16
            and paste the contents below.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-sm text-blue-800 space-y-1">
            <p className="font-medium">How to export from SE16:</p>
            <ol className="list-decimal list-inside space-y-0.5 text-xs">
              <li>Open transaction <strong>SE16</strong> in your S/4HANA system</li>
              <li>Table name: <code className="bg-blue-100 px-1 rounded font-mono">IXTRCTNENBLDVW</code></li>
              <li>Press <strong>F8</strong> (Execute)</li>
              <li>Menu: <strong>System → List → Save → Local File → Spreadsheet</strong></li>
              <li>Save as <code>.csv</code> or <code>.txt</code>, then paste the content below</li>
            </ol>
            <p className="text-xs mt-2 text-blue-700">
              Alternative: Use the Fiori <strong>View Browser</strong> app → Export button.
            </p>
          </div>

          <textarea
            value={csvText}
            onChange={(e) => { setCsvText(e.target.value); setCsvResult(null); }}
            placeholder={"DDLNAME\tDDTEXT\tIS_RELEASED\tIS_CDC_ENABLED\n" +
              "I_SalesOrder\tSales Order\tX\tX\n..."}
            rows={10}
            className="w-full font-mono text-xs border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />

          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={() => csvMutation.mutate()}
              disabled={!csvText.trim() || csvMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {csvMutation.isPending ? 'Importing…' : 'Import CSV'}
            </button>
            {csvText && (
              <button onClick={() => { setCsvText(''); setCsvResult(null); }}
                className="text-sm text-gray-500 hover:text-gray-700">
                Clear
              </button>
            )}
          </div>

          {csvMutation.isError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {(csvMutation.error as Error).message}
            </div>
          )}

          {csvResult && (
            <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-sm font-medium text-green-800">
                ✓ Import successful: {csvResult.viewsFound} views found,{' '}
                {csvResult.viewsCreated} created, {csvResult.viewsUpdated} updated.
              </p>
              {csvResult.warnings.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {csvResult.warnings.map((w, i) => (
                    <li key={i} className="text-xs text-amber-700">⚠ {w}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* OData Import */}
      {method === 'odata' && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-1">Import via Custom OData Service</h2>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-sm text-amber-800">
            <p className="font-medium mb-1">Prerequisites</p>
            <p className="text-xs">
              SAP does <strong>not</strong> ship a standard OData service for{' '}
              <code className="bg-amber-100 px-1 rounded font-mono">I_DataExtractionEnabledView</code> on S/4HANA On-Premise.
              You must first create a custom service in <strong>SEGW</strong> (or via CDS annotation{' '}
              <code className="bg-amber-100 px-1 rounded font-mono">@OData.publish: true</code>) that exposes this CDS view,
              then activate it in SICF. Configure the resulting service URL under{' '}
              <a href="/admin/sources" className="underline">Admin → SAP Sources</a>.
            </p>
          </div>

          {sources.length === 0 ? (
            <p className="text-sm text-gray-500">
              No OData sources configured.{' '}
              <a href="/admin/sources" className="text-blue-600 underline">Add a source</a> first.
            </p>
          ) : (
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">OData Source</label>
                <select
                  value={selectedSourceId}
                  onChange={(e) => setSelectedSourceId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a source…</option>
                  {sources.map((src) => (
                    <option key={src.id} value={src.id}>{src.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => odataMutation.mutate()}
                disabled={!selectedSourceId || odataMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {odataMutation.isPending ? 'Starting…' : 'Start Import'}
              </button>
            </div>
          )}

          {odataMutation.isError && (
            <p className="mt-3 text-sm text-red-600">{(odataMutation.error as Error).message}</p>
          )}
        </div>
      )}

      {activeJob && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Active Job</h2>
          <JobStatusCard job={activeJob} />
        </div>
      )}

      {jobs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Jobs</h2>
          <div className="space-y-2">
            {jobs.slice(0, 10).map((job) => (
              <div
                key={job.id}
                className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between cursor-pointer hover:border-blue-300"
                onClick={() => setActiveJobId(job.id === activeJobId ? null : job.id)}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    job.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    job.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                    job.status === 'RUNNING' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{job.status}</span>
                  <span className="text-xs text-gray-500">{job.sourceType}</span>
                  <span className="text-xs text-gray-400">{new Date(job.createdAt).toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-500 space-x-2">
                  <span>{job.viewsFound} found</span>
                  <span>{job.viewsCreated} new</span>
                  <span>{job.viewsUpdated} updated</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

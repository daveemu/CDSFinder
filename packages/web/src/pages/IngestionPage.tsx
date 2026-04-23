import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSources, startJob, fetchJobs } from '../api/ingestion.js';
import { useIngestionJob } from '../hooks/useIngestionJob.js';
import JobStatusCard from '../components/ingestion/JobStatusCard.js';

export default function IngestionPage() {
  const qc = useQueryClient();
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const { data: sources = [] } = useQuery({ queryKey: ['sources'], queryFn: fetchSources });
  const { data: jobs = [], refetch: refetchJobs } = useQuery({ queryKey: ['ingestion-jobs'], queryFn: fetchJobs });
  const { data: activeJob } = useIngestionJob(activeJobId);

  const startMutation = useMutation({
    mutationFn: () => startJob(selectedSourceId),
    onSuccess: ({ jobId }) => {
      setActiveJobId(jobId);
      void refetchJobs();
    },
  });

  // Refresh job list when active job completes
  if (activeJob && (activeJob.status === 'COMPLETED' || activeJob.status === 'FAILED')) {
    void qc.invalidateQueries({ queryKey: ['ingestion-jobs'] });
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">CDS View Ingestion</h1>
        <p className="text-sm text-gray-500 mt-1">
          Import CDS view metadata from your S/4HANA system via OData.
          Reads <code className="bg-gray-100 px-1 rounded font-mono text-xs">I_DataExtractionEnabledView</code>.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Start New Import</h2>

        {sources.length === 0 ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
            No data sources configured. <a href="/admin/sources" className="underline">Add a source</a> first.
          </p>
        ) : (
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Source System</label>
              <select
                value={selectedSourceId}
                onChange={(e) => setSelectedSourceId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a source…</option>
                {sources.map((src) => (
                  <option key={src.id} value={src.id}>{src.name} ({src.baseUrl})</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => startMutation.mutate()}
              disabled={!selectedSourceId || startMutation.isPending}
              className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {startMutation.isPending ? 'Starting…' : 'Start Import'}
            </button>
          </div>
        )}

        {startMutation.isError && (
          <p className="mt-3 text-sm text-red-600">{(startMutation.error as Error).message}</p>
        )}
      </div>

      {activeJob && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Active Job</h2>
          <JobStatusCard job={activeJob} />
        </div>
      )}

      {jobs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Jobs</h2>
          <div className="space-y-3">
            {jobs.slice(0, 10).map((job) => (
              <div
                key={job.id}
                className="cursor-pointer"
                onClick={() => setActiveJobId(job.id === activeJobId ? null : job.id)}
              >
                <div className={`bg-white border rounded-lg p-4 hover:border-blue-300 transition-colors ${job.id === activeJobId ? 'border-blue-400' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        job.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        job.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                        job.status === 'RUNNING' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{job.status}</span>
                      <span className="text-sm text-gray-700">{new Date(job.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-gray-500 space-x-3">
                      <span>{job.viewsFound} found</span>
                      <span>{job.viewsCreated} new</span>
                      <span>{job.viewsUpdated} updated</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

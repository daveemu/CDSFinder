import type { IngestionJob, IngestionJobLog } from '@cdsfinder/shared';

interface JobStatusCardProps {
  job: IngestionJob;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  RUNNING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
};

const logLevelColors: Record<string, string> = {
  INFO: 'text-gray-600',
  WARN: 'text-yellow-700',
  ERROR: 'text-red-700',
};

export default function JobStatusCard({ job }: JobStatusCardProps) {
  const logs = (job.logEntries as IngestionJobLog[]) ?? [];

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[job.status] ?? statusColors['PENDING']}`}>
            {job.status === 'RUNNING' && (
              <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {job.status}
          </span>
          <span className="ml-3 text-xs text-gray-400">{new Date(job.createdAt).toLocaleString()}</span>
        </div>
        <div className="text-right text-xs text-gray-500 space-x-3">
          <span><strong>{job.viewsFound}</strong> found</span>
          <span><strong>{job.viewsCreated}</strong> new</span>
          <span><strong>{job.viewsUpdated}</strong> updated</span>
        </div>
      </div>

      {job.errorMessage && (
        <div className="px-4 py-3 bg-red-50 border-b border-red-100 text-sm text-red-700">
          {job.errorMessage}
        </div>
      )}

      {logs.length > 0 && (
        <div className="p-4 max-h-48 overflow-y-auto font-mono text-xs space-y-0.5 bg-gray-50">
          {logs.map((entry, i) => (
            <div key={i} className={`flex gap-2 ${logLevelColors[entry.level] ?? ''}`}>
              <span className="text-gray-400 shrink-0">{new Date(entry.ts).toLocaleTimeString()}</span>
              <span>[{entry.level}]</span>
              <span>{entry.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

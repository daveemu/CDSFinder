import { useQuery } from '@tanstack/react-query';
import { fetchJob } from '../api/ingestion.js';

export function useIngestionJob(jobId: string | null) {
  return useQuery({
    queryKey: ['ingestion-job', jobId],
    queryFn: () => fetchJob(jobId!),
    enabled: jobId !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'RUNNING' || status === 'PENDING' ? 3000 : false;
    },
  });
}

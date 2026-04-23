export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface StatsResponse {
  totalViews: number;
  extractionEnabledViews: number;
  deltaEnabledViews: number;
  lastSyncAt: string | null;
  moduleCount: number;
}

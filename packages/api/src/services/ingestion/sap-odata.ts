import type { SapODataConfig, RawExtractionViewRecord, ConnectionTestResult } from '@cdsfinder/shared';

interface ODataResponse<T> {
  d: {
    results?: T[];
    __next?: string;
  } | T[];
}

interface ODataError {
  error?: {
    code: string;
    message: { value: string };
  };
}

const EXTRACTION_VIEW_SERVICE = 'IXTRCTNENBLDVW_SRV';
const EXTRACTION_VIEW_ENTITY = 'I_DataExtractionEnabledViewSet';

async function fetchWithRetry(
  url: string,
  headers: Record<string, string>,
  timeoutMs: number,
  attempt = 0,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    return response;
  } catch (err) {
    clearTimeout(timeout);
    if (attempt >= 2) throw err;
    const delay = 500 * Math.pow(2, attempt);
    await new Promise((r) => setTimeout(r, delay));
    return fetchWithRetry(url, headers, timeoutMs, attempt + 1);
  } finally {
    clearTimeout(timeout);
  }
}

export class SapODataClient {
  private readonly config: SapODataConfig;
  private readonly headers: Record<string, string>;

  constructor(config: SapODataConfig) {
    this.config = config;
    this.headers = this.buildAuthHeaders();
  }

  private buildAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'sap-client': this.config.client,
    };

    if (this.config.authType === 'BASIC' && this.config.username && this.config.password) {
      const credentials = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    }

    return headers;
  }

  private buildServiceUrl(service: string): string {
    return `${this.config.baseUrl}/sap/opu/odata/sap/${service}`;
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const url = `${this.buildServiceUrl(EXTRACTION_VIEW_SERVICE)}/?$format=json&$top=1`;

    try {
      const response = await fetchWithRetry(url, this.headers, this.config.timeoutMs);

      if (response.status === 401) {
        return { success: false, message: 'Authentication failed. Check username and password.' };
      }
      if (response.status === 403) {
        return { success: false, message: 'Access denied. User lacks required authorizations.' };
      }
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        return { success: false, message: `HTTP ${response.status}: ${body.slice(0, 200)}` };
      }

      return {
        success: true,
        message: 'Connection successful.',
        systemInfo: {
          systemId: this.config.systemId,
          client: this.config.client,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, message: `Connection error: ${message}` };
    }
  }

  async *streamExtractionViews(): AsyncGenerator<RawExtractionViewRecord[]> {
    const pageSize = Math.min(this.config.maxPageSize, 500);
    let url: string | null =
      `${this.buildServiceUrl(EXTRACTION_VIEW_SERVICE)}/${EXTRACTION_VIEW_ENTITY}` +
      `?$format=json&$top=${pageSize}`;

    while (url) {
      const response = await fetchWithRetry(url, this.headers, this.config.timeoutMs);

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`OData request failed: HTTP ${response.status} — ${body.slice(0, 300)}`);
      }

      const json = (await response.json()) as ODataResponse<RawExtractionViewRecord> & ODataError;

      if (json.error) {
        throw new Error(`SAP OData error: ${json.error.message.value}`);
      }

      const results: RawExtractionViewRecord[] = Array.isArray(json.d)
        ? json.d
        : (json.d.results ?? []);

      if (results.length > 0) {
        yield results;
      }

      // SAP uses __next for server-side paging
      const nextLink = !Array.isArray(json.d) ? json.d.__next : undefined;
      url = nextLink ?? null;
    }
  }
}

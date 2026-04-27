import type { SapODataConfig, RawExtractionViewRecord, ConnectionTestResult } from '@cdsfinder/shared';

/**
 * Generic SAP OData client for reading CDS view metadata.
 *
 * SAP does NOT ship a standard OData service for I_DataExtractionEnabledView
 * on S/4HANA On-Premise. To use this connector, the customer must first create
 * a custom OData service in SEGW (or annotate the CDS view with @OData.publish)
 * that exposes I_DataExtractionEnabledView, then supply that service URL here.
 *
 * Alternative (recommended): use the CSV import via SE16 export of IXTRCTNENBLDVW.
 *
 * Example custom service URL:
 *   https://s4host:8000/sap/opu/odata/sap/ZCDS_EXTRACTOR_SRV/ExtractionViewSet
 */

interface ODataV2Response<T> {
  d: {
    results?: T[];
    __next?: string;
  };
}

interface ODataError {
  error?: { code: string; message: { value: string } };
}

async function fetchWithRetry(
  url: string,
  headers: Record<string, string>,
  timeoutMs: number,
  attempt = 0,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { headers, signal: controller.signal });
  } catch (err) {
    clearTimeout(timeout);
    if (attempt >= 2) throw err;
    await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
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
      const b64 = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
      headers['Authorization'] = `Basic ${b64}`;
    }
    return headers;
  }

  /**
   * Tests connectivity to the configured custom OData service URL.
   * The URL should be the service root (e.g. .../ZCDS_EXTRACTOR_SRV/).
   */
  async testConnection(): Promise<ConnectionTestResult> {
    const url = `${this.config.baseUrl}?$format=json&$top=1`;
    try {
      const response = await fetchWithRetry(url, this.headers, this.config.timeoutMs);
      if (response.status === 401)
        return { success: false, message: 'Authentication failed. Check username and password.' };
      if (response.status === 403)
        return { success: false, message: 'Access denied. Check user authorizations (S_RS_CDS_X).' };
      if (response.status === 404)
        return { success: false, message: 'Service not found (HTTP 404). Verify the OData service URL and that the service is activated in SICF.' };
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        return { success: false, message: `HTTP ${response.status}: ${body.slice(0, 200)}` };
      }
      return {
        success: true,
        message: 'Connection successful.',
        systemInfo: { systemId: this.config.systemId, client: this.config.client },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, message: `Connection error: ${message}` };
    }
  }

  /**
   * Generic paginated entity stream. Works with any OData V2 entity set URL.
   * The entity set URL is taken from the client's config.baseUrl unless
   * overrideUrl is supplied (used for fields/annotations entity sets).
   */
  async *streamEntities<T>(overrideUrl?: string): AsyncGenerator<T[]> {
    const pageSize = Math.min(this.config.maxPageSize, 500);
    let url: string | null = `${overrideUrl ?? this.config.baseUrl}?$format=json&$top=${pageSize}`;

    while (url) {
      const response = await fetchWithRetry(url, this.headers, this.config.timeoutMs);

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`OData request failed: HTTP ${response.status} — ${body.slice(0, 300)}`);
      }

      const json = (await response.json()) as ODataV2Response<T> & ODataError;

      if (json.error) {
        throw new Error(`SAP OData error: ${json.error.message.value}`);
      }

      const results: T[] = json.d?.results ?? [];
      if (results.length > 0) yield results;

      url = json.d?.__next ?? null;
    }
  }

  streamExtractionViews(): AsyncGenerator<RawExtractionViewRecord[]> {
    return this.streamEntities<RawExtractionViewRecord>();
  }
}

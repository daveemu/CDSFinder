export type IngestionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export type AuthType = 'BASIC' | 'OAUTH2';
export type DataSourceType = 'S4_ODATA' | 'API_HUB' | 'HELP_PORTAL';

export interface SapODataConfig {
  baseUrl: string;
  systemId: string;
  client: string;
  authType: AuthType;
  username?: string;
  password?: string;
  maxPageSize: number;
  timeoutMs: number;
}

export interface RawExtractionViewRecord {
  ViewName: string;
  ViewLabel: string;
  ReleaseVersion: string;
  PackageName: string;
  ExtractionEnabled: boolean;
  DeltaEnabled: boolean;
  DeltaElementName: string | null;
  VDMViewType: string;
  DataCategory: string;
  ODataEntitySet: string | null;
  FunctionalArea: string;
}

export interface RawAnnotation {
  annotation: string;
  valueText: string | null;
  valueBool: boolean | null;
  valueJson: unknown;
  target: string | null;
}

export interface RawField {
  fieldName: string;
  aliasName: string | null;
  dataType: string | null;
  length: number | null;
  decimals: number | null;
  isKey: boolean;
  description: string | null;
  abapElement: string | null;
}

export interface IngestionJobLog {
  ts: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
}

export interface IngestionJob {
  id: string;
  sourceId: string | null;
  status: IngestionStatus;
  sourceType: string;
  startedAt: string | null;
  completedAt: string | null;
  viewsFound: number;
  viewsCreated: number;
  viewsUpdated: number;
  errorMessage: string | null;
  logEntries: IngestionJobLog[];
  createdAt: string;
}

export interface DataSource {
  id: string;
  name: string;
  sourceType: DataSourceType;
  baseUrl: string | null;
  systemId: string | null;
  client: string | null;
  authType: AuthType;
  isActive: boolean;
  lastConnected: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DataSourceInsert {
  name: string;
  sourceType: DataSourceType;
  baseUrl: string | null;
  systemId: string | null;
  client: string | null;
  authType: AuthType;
  username: string | null;
  password: string | null;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  systemInfo?: {
    release?: string;
    systemId?: string;
    client?: string;
  };
}

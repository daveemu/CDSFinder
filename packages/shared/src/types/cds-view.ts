export type VdmViewType = 'BASIC' | 'COMPOSITE' | 'CONSUMPTION' | 'EXTENSION';
export type DataCategory = 'DIMENSION' | 'FACT' | 'CUBE' | 'HIERARCHY' | 'TEXT';
export type SourceType = 'ODATA_LIVE' | 'API_HUB' | 'HELP_PORTAL' | 'MANUAL';

export interface CdsView {
  id: string;
  viewName: string;
  viewLabel: string | null;
  sqlViewName: string | null;
  description: string | null;
  packageName: string | null;
  releaseVersion: string | null;
  vdmViewType: VdmViewType | null;
  dataCategory: DataCategory | null;
  extractionEnabled: boolean;
  deltaEnabled: boolean;
  deltaElementName: string | null;
  odataPublished: boolean;
  odataEntitySet: string | null;
  sapModule: string | null;
  functionalArea: string | null;
  sourceType: SourceType;
  sourceSystemId: string | null;
  sourceUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CdsViewDetail extends CdsView {
  fields: CdsField[];
  annotations: CdsAnnotation[];
  associations: CdsAssociation[];
}

export interface CdsField {
  id: string;
  viewId: string;
  fieldName: string;
  aliasName: string | null;
  dataType: string | null;
  length: number | null;
  decimals: number | null;
  isKey: boolean;
  description: string | null;
  abapElement: string | null;
}

export interface CdsAnnotation {
  id: string;
  viewId: string;
  annotation: string;
  valueText: string | null;
  valueBool: boolean | null;
  valueJson: unknown;
  target: string | null;
}

export interface CdsAssociation {
  id: string;
  sourceViewId: string;
  targetViewName: string;
  associationName: string;
  cardinality: string | null;
  isComposition: boolean;
}

export interface CdsViewInsert {
  viewName: string;
  viewLabel: string | null;
  sqlViewName?: string | null;
  description: string | null;
  packageName: string | null;
  releaseVersion: string | null;
  vdmViewType: VdmViewType | null;
  dataCategory: DataCategory | null;
  extractionEnabled: boolean;
  deltaEnabled: boolean;
  deltaElementName: string | null;
  odataPublished: boolean;
  odataEntitySet: string | null;
  sapModule: string | null;
  functionalArea: string | null;
  sourceType: SourceType;
  sourceSystemId: string | null;
  sourceUrl: string | null;
}

export interface ModuleStats {
  module: string;
  viewCount: number;
  extractionEnabledCount: number;
}

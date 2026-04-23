export const EXTRACTION_ANNOTATIONS = [
  'Analytics.dataExtraction.enabled',
  'Analytics.dataExtraction.delta.byElement.name',
  'Analytics.dataExtraction.delta.changeDataCapture.automatic',
] as const;

export const VDM_ANNOTATIONS = [
  'VDM.viewType',
  'VDM.lifecycle.contract.type',
] as const;

export const ANALYTICS_ANNOTATIONS = [
  'Analytics.dataCategory',
  'Analytics.query',
  'Analytics.internalName',
] as const;

export const ODATA_ANNOTATIONS = [
  'OData.publish',
  'OData.entitySet.name',
] as const;

export const ALL_KEY_ANNOTATIONS = [
  ...EXTRACTION_ANNOTATIONS,
  ...VDM_ANNOTATIONS,
  ...ANALYTICS_ANNOTATIONS,
  ...ODATA_ANNOTATIONS,
] as const;

export type KeyAnnotation = (typeof ALL_KEY_ANNOTATIONS)[number];

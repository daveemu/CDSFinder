import type { RawExtractionViewRecord, RawAnnotation, RawField } from '@cdsfinder/shared';
import type { VdmViewType, DataCategory, CdsViewInsert } from '@cdsfinder/shared';
import { FUNCTIONAL_AREA_TO_MODULE } from '@cdsfinder/shared';

function stripSapHash<T extends string>(value: string | undefined | null): T | null {
  if (!value || value.trim() === '') return null;
  return value.replace(/^#/, '') as T;
}

function nullifyEmpty(value: string | null | undefined): string | null {
  if (value == null || value.trim() === '') return null;
  return value.trim();
}

function inferModule(functionalArea: string | null, viewName: string): string | null {
  if (functionalArea) {
    // Try direct lookup first (e.g. "FI-GL" → "FI")
    const mapped = FUNCTIONAL_AREA_TO_MODULE[functionalArea];
    if (mapped) return mapped;

    // Try prefix (take first segment before "-")
    const prefix = functionalArea.split('-')[0];
    if (prefix && prefix.length >= 2 && prefix.length <= 5) return prefix.toUpperCase();
  }

  // Infer from view name prefix convention: I_FI*, C_SD*, A_CO* etc.
  const match = /^[ICAP]_([A-Z]{2,5})/i.exec(viewName);
  if (match?.[1]) return match[1].toUpperCase();

  return null;
}

export function normalizeExtractionView(
  raw: RawExtractionViewRecord,
  sourceSystemId: string,
): CdsViewInsert {
  const functionalArea = nullifyEmpty(raw.FunctionalArea);
  const sapModule = inferModule(functionalArea, raw.ViewName);

  return {
    viewName: raw.ViewName.trim(),
    viewLabel: nullifyEmpty(raw.ViewLabel),
    description: null,
    packageName: nullifyEmpty(raw.PackageName),
    releaseVersion: nullifyEmpty(raw.ReleaseVersion),
    vdmViewType: stripSapHash<VdmViewType>(raw.VDMViewType),
    dataCategory: stripSapHash<DataCategory>(raw.DataCategory),
    extractionEnabled: Boolean(raw.ExtractionEnabled),
    deltaEnabled: Boolean(raw.DeltaEnabled),
    deltaElementName: nullifyEmpty(raw.DeltaElementName),
    odataPublished: Boolean(raw.ODataEntitySet),
    odataEntitySet: nullifyEmpty(raw.ODataEntitySet),
    sapModule,
    functionalArea,
    sourceType: 'ODATA_LIVE',
    sourceSystemId,
    sourceUrl: null,
  };
}

export function normalizeAnnotation(raw: RawAnnotation) {
  return {
    annotation: raw.annotation,
    valueText: raw.valueText,
    valueBool: raw.valueBool,
    valueJson: raw.valueJson ?? null,
    target: raw.target,
  };
}

export function normalizeField(raw: RawField) {
  return {
    fieldName: raw.fieldName.trim(),
    aliasName: nullifyEmpty(raw.aliasName),
    dataType: nullifyEmpty(raw.dataType),
    length: raw.length,
    decimals: raw.decimals,
    isKey: Boolean(raw.isKey),
    description: nullifyEmpty(raw.description),
    abapElement: nullifyEmpty(raw.abapElement),
  };
}

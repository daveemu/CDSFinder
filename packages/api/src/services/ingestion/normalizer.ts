import type { RawExtractionViewRecord, RawAnnotation, RawField, RawODataFieldRecord, RawODataAnnotationRecord } from '@cdsfinder/shared';
import type { VdmViewType, DataCategory, CdsViewInsert } from '@cdsfinder/shared';
import { FUNCTIONAL_AREA_TO_MODULE } from '@cdsfinder/shared';

const VDM_TYPES = ['BASIC', 'COMPOSITE', 'CONSUMPTION', 'EXTENSION'] as const;
const DATA_CATEGORIES = ['DIMENSION', 'FACT', 'CUBE', 'HIERARCHY', 'TEXT'] as const;

function stripSapHash(value: string | undefined | null): string | null {
  if (!value || value.trim() === '') return null;
  return value.replace(/^#/, '').trim();
}

function validateEnum<T extends string>(val: string | null, allowed: readonly T[]): T | null {
  return allowed.includes(val as T) ? (val as T) : null;
}

function nullifyEmpty(value: string | null | undefined): string | null {
  if (value == null || value.trim() === '') return null;
  return value.trim();
}

// Handles SAP ABAP boolean convention ("X"/"") as well as JSON booleans.
export function parseSapBool(val: unknown): boolean {
  if (typeof val === 'boolean') return val;
  if (val === 'X' || val === 'true' || val === '1' || val === 'Yes') return true;
  return false;
}

function inferModule(functionalArea: string | null, viewName: string): string | null {
  if (functionalArea) {
    const mapped = FUNCTIONAL_AREA_TO_MODULE[functionalArea];
    if (mapped) return mapped;
    const prefix = functionalArea.split('-')[0];
    if (prefix && prefix.length >= 2 && prefix.length <= 5) return prefix.toUpperCase();
  }
  const baseName = viewName.replace(/^\/[^/]+\//, '');
  const match = /^[ICAP]_([A-Z]{2,5})/i.exec(baseName);
  if (match?.[1]) return match[1].toUpperCase();
  return null;
}

export function normalizeExtractionView(
  raw: RawExtractionViewRecord,
  sourceSystemId: string,
): CdsViewInsert {
  const functionalArea = nullifyEmpty(raw.FunctionalArea);
  const sapModule = inferModule(functionalArea, raw.ViewName);
  const vdmRaw = validateEnum(stripSapHash(raw.VDMViewType), VDM_TYPES);
  const dataCatRaw = validateEnum(stripSapHash(raw.DataCategory), DATA_CATEGORIES);

  return {
    viewName: raw.ViewName.trim(),
    viewLabel: nullifyEmpty(raw.ViewLabel),
    sqlViewName: nullifyEmpty(raw.SqlViewName),
    description: null,
    packageName: nullifyEmpty(raw.PackageName),
    releaseVersion: nullifyEmpty(raw.ReleaseVersion),
    vdmViewType: vdmRaw as VdmViewType | null,
    dataCategory: dataCatRaw as DataCategory | null,
    extractionEnabled: parseSapBool(raw.ExtractionEnabled),
    deltaEnabled: parseSapBool(raw.DeltaEnabled),
    deltaElementName: nullifyEmpty(raw.DeltaElementName),
    odataPublished: Boolean(nullifyEmpty(raw.ODataEntitySet)),
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

export function normalizeODataField(raw: RawODataFieldRecord) {
  return {
    fieldName: raw.FieldName.trim(),
    aliasName: nullifyEmpty(raw.AliasName),
    dataType: nullifyEmpty(raw.DataType),
    length: raw.Length ?? null,
    decimals: raw.Decimals ?? null,
    isKey: parseSapBool(raw.IsKey),
    description: nullifyEmpty(raw.Description),
    abapElement: nullifyEmpty(raw.AbapElement),
  };
}

export function normalizeODataAnnotation(raw: RawODataAnnotationRecord) {
  const valueBool = raw.ValueBool != null ? parseSapBool(raw.ValueBool) : null;
  return {
    annotation: raw.Annotation,
    valueText: nullifyEmpty(raw.ValueText),
    valueBool,
    valueJson: null,
    target: nullifyEmpty(raw.Target),
  };
}

import type { CdsViewInsert } from '@cdsfinder/shared';
import { FUNCTIONAL_AREA_TO_MODULE } from '@cdsfinder/shared';

/**
 * Parses a CSV export of the IXTRCTNENBLDVW table from SE16.
 *
 * How to get this file from your S/4HANA system:
 *   1. Open transaction SE16
 *   2. Table name: IXTRCTNENBLDVW
 *   3. Execute (F8) — optionally filter by DDLNAME or release state
 *   4. Menu: System → List → Save → Local File → Spreadsheet (.csv)
 *
 * Alternatively, from the Fiori "View Browser" app:
 *   1. Search / filter views as needed
 *   2. Export button → download as spreadsheet
 *
 * The parser is column-name agnostic and maps common SAP field name variants.
 */

// Known column name mappings (lowercase SAP field name → our field)
const COL_MAP: Record<string, string> = {
  // View / CDS name
  ddlname: 'viewName',
  cdsname: 'viewName',
  viewname: 'viewName',
  cds_name: 'viewName',
  cdsviewname: 'viewName',
  // SQL view name
  sqlviewname: 'sqlViewName',
  sqltab: 'sqlViewName',
  // Label / description
  ddtext: 'viewLabel',
  viewlabel: 'viewLabel',
  externalname: 'viewLabel',
  label: 'viewLabel',
  description: 'description',
  // Package
  devclass: 'packageName',
  packagename: 'packageName',
  package: 'packageName',
  // Release state
  releasestate: 'releaseVersion',
  releasedstate: 'releaseVersion',
  release_state: 'releaseVersion',
  abapgeneratedrelease: 'releaseVersion',
  // Extraction / delta flags
  is_extraction_enabled: 'extractionEnabled',
  isextractionenabled: 'extractionEnabled',
  extraction_enabled: 'extractionEnabled',
  extractionenabled: 'extractionEnabled',
  is_released: 'extractionEnabled',
  isreleased: 'extractionEnabled',
  is_cdc_enabled: 'deltaEnabled',
  iscdcenabled: 'deltaEnabled',
  cdc_enabled: 'deltaEnabled',
  delta_enabled: 'deltaEnabled',
  deltaenabled: 'deltaEnabled',
  // Delta field
  delta_field: 'deltaElementName',
  deltafield: 'deltaElementName',
  deltaelementname: 'deltaElementName',
  // VDM type
  vdmviewtype: 'vdmViewType',
  vdm_view_type: 'vdmViewType',
  viewtype: 'vdmViewType',
  // Data category
  datacategory: 'dataCategory',
  data_category: 'dataCategory',
  // Module / functional area
  functionalarea: 'functionalArea',
  functional_area: 'functionalArea',
  facherreich: 'functionalArea',
  modul: 'sapModule',
  module: 'sapModule',
  sapmodul: 'sapModule',
};

function parseBool(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.trim().toUpperCase();
  return v === 'X' || v === 'TRUE' || v === '1' || v === 'YES';
}

function stripHash(value: string | undefined): string | null {
  if (!value || value.trim() === '' || value.trim() === '-') return null;
  return value.trim().replace(/^#/, '');
}

function inferModule(functionalArea: string | null, viewName: string): string | null {
  if (functionalArea) {
    const mapped = FUNCTIONAL_AREA_TO_MODULE[functionalArea];
    if (mapped) return mapped;
    const prefix = functionalArea.split('-')[0];
    if (prefix && prefix.length >= 2 && prefix.length <= 5) return prefix.toUpperCase();
  }
  const match = /^[ICAP]_([A-Z]{2,5})/i.exec(viewName);
  if (match?.[1]) return match[1].toUpperCase();
  return null;
}

export interface CsvParseResult {
  views: CdsViewInsert[];
  skipped: number;
  warnings: string[];
}

export function parseIxtrctnenbldvwCsv(
  csvContent: string,
  sourceSystemId: string | null,
): CsvParseResult {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return { views: [], skipped: 0, warnings: ['CSV has no data rows.'] };
  }

  // Detect delimiter (tab or semicolon or comma)
  const firstLine = lines[0]!;
  const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';

  const parseLine = (line: string): string[] =>
    line.split(delimiter).map((cell) => cell.replace(/^["']|["']$/g, '').trim());

  const headers = parseLine(firstLine).map((h) => h.toLowerCase().replace(/\s+/g, ''));

  // Build index: our field name → column index
  const colIdx: Record<string, number> = {};
  for (let i = 0; i < headers.length; i++) {
    const mapped = COL_MAP[headers[i]!];
    if (mapped && !(mapped in colIdx)) {
      colIdx[mapped] = i;
    }
  }

  const warnings: string[] = [];

  if (!('viewName' in colIdx)) {
    warnings.push(
      `Could not detect a CDS view name column. Found headers: ${headers.join(', ')}. ` +
      `Expected a column like DDLNAME, CDSNAME, or VIEWNAME.`,
    );
    return { views: [], skipped: 0, warnings };
  }

  const get = (row: string[], field: string): string | undefined =>
    colIdx[field] !== undefined ? row[colIdx[field]!] : undefined;

  const views: CdsViewInsert[] = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const row = parseLine(lines[i]!);
    const viewName = get(row, 'viewName')?.trim();

    if (!viewName || viewName === '' || viewName === '-') {
      skipped++;
      continue;
    }

    // Skip non-CDS rows (e.g. summary/footer lines in SAP list exports)
    if (!/^[A-Z][A-Z0-9_]{1,29}$/i.test(viewName)) {
      skipped++;
      continue;
    }

    const functionalArea = stripHash(get(row, 'functionalArea'));
    const explicitModule = stripHash(get(row, 'sapModule'));
    const sapModule = explicitModule ?? inferModule(functionalArea, viewName);
    const extractionEnabled = parseBool(get(row, 'extractionEnabled'));
    const deltaEnabled = parseBool(get(row, 'deltaEnabled'));

    views.push({
      viewName,
      viewLabel: stripHash(get(row, 'viewLabel')),
      description: stripHash(get(row, 'description')),
      packageName: stripHash(get(row, 'packageName')),
      releaseVersion: stripHash(get(row, 'releaseVersion')),
      vdmViewType: stripHash(get(row, 'vdmViewType')) as CdsViewInsert['vdmViewType'],
      dataCategory: stripHash(get(row, 'dataCategory')) as CdsViewInsert['dataCategory'],
      extractionEnabled,
      deltaEnabled,
      deltaElementName: stripHash(get(row, 'deltaElementName')),
      odataPublished: false,
      odataEntitySet: null,
      sapModule,
      functionalArea,
      sourceType: 'MANUAL',
      sourceSystemId,
      sourceUrl: null,
    });
  }

  return { views, skipped, warnings };
}

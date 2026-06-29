import { XMLParser } from 'fast-xml-parser';

export interface KMLPoint {
  lat: number;
  lon: number;
  ele?: number;
}

export interface ParseKMLResult {
  name?: string;
  description?: string;
  points: KMLPoint[];
  warning?: string;
}

interface LineStringCandidate {
  coordinates: string;
  description?: string;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseCoordinatesString(coordinatesText: string): KMLPoint[] {
  const tokens = coordinatesText.trim().split(/\s+/).filter(Boolean);
  const points: KMLPoint[] = [];

  for (const token of tokens) {
    const parts = token.split(',').map((part) => part.trim());
    if (parts.length < 2) {
      continue;
    }

    const lon = Number.parseFloat(parts[0]);
    const lat = Number.parseFloat(parts[1]);
    const ele = parts.length > 2 ? Number.parseFloat(parts[2]) : undefined;

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      continue;
    }

    points.push({
      lat,
      lon,
      ele: ele !== undefined && Number.isFinite(ele) ? ele : undefined,
    });
  }

  return points;
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function readText(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value.trim() || undefined;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return undefined;
}

function collectLineStringCandidates(node: unknown, candidates: LineStringCandidate[]): void {
  if (node === null || node === undefined) {
    return;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      collectLineStringCandidates(item, candidates);
    }
    return;
  }

  if (typeof node !== 'object') {
    return;
  }

  const record = node as Record<string, unknown>;

  if ('LineString' in record) {
    for (const lineString of asArray(record.LineString)) {
      if (typeof lineString !== 'object' || lineString === null) {
        continue;
      }
      const lineRecord = lineString as Record<string, unknown>;
      const coordinates = readText(lineRecord.coordinates);
      if (coordinates) {
        candidates.push({
          coordinates,
          description: readText(record.description),
        });
      }
    }
  }

  for (const value of Object.values(record)) {
    if (value !== record.LineString) {
      collectLineStringCandidates(value, candidates);
    }
  }
}

function buildDescription(
  documentDescription?: string,
  pathDescription?: string
): string | undefined {
  const parts: string[] = [];

  if (documentDescription) {
    parts.push(documentDescription);
  }

  if (pathDescription) {
    const plainPathDescription = stripHtml(pathDescription);
    if (plainPathDescription && plainPathDescription !== documentDescription) {
      parts.push(plainPathDescription);
    }
  }

  if (parts.length === 0) {
    return undefined;
  }

  return parts.join('\n\n');
}

function selectLongestLineString(candidates: LineStringCandidate[]): {
  selected: LineStringCandidate;
  warning?: string;
} {
  if (candidates.length === 0) {
    throw new Error(
      'No course path found in KML file. Draw a route line in Google Maps and export again.'
    );
  }

  let selected = candidates[0];
  let selectedPointCount = parseCoordinatesString(selected.coordinates).length;

  for (const candidate of candidates.slice(1)) {
    const pointCount = parseCoordinatesString(candidate.coordinates).length;
    if (pointCount > selectedPointCount) {
      selected = candidate;
      selectedPointCount = pointCount;
    }
  }

  const warning = candidates.length > 1 ? 'Multiple routes found; using the longest.' : undefined;

  return { selected, warning };
}

export function parseKMLContent(xmlContent: string): ParseKMLResult {
  const parser = new XMLParser({
    attributeNamePrefix: '',
    ignoreAttributes: false,
    removeNSPrefix: true,
    isArray: (name) => name === 'Placemark' || name === 'Folder',
  });

  let parsed: unknown;
  try {
    parsed = parser.parse(xmlContent);
  } catch (error) {
    throw new Error(
      `Invalid KML file: ${error instanceof Error ? error.message : 'Unable to parse XML'}`,
      { cause: error }
    );
  }

  const document = (parsed as { kml?: { Document?: Record<string, unknown> } })?.kml?.Document;
  if (!document) {
    throw new Error('Invalid KML format: missing Document element.');
  }

  const candidates: LineStringCandidate[] = [];
  collectLineStringCandidates(document, candidates);

  const { selected, warning } = selectLongestLineString(candidates);
  const points = parseCoordinatesString(selected.coordinates);

  if (points.length < 2) {
    throw new Error('Invalid course data: course path must contain at least 2 GPS points.');
  }

  const name = readText(document.name);
  const documentDescription = readText(document.description);

  return {
    name,
    description: buildDescription(documentDescription, selected.description),
    points,
    warning,
  };
}

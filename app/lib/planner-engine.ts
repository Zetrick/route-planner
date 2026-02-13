
export type LatLng = {
  lat: number;
  lon: number;
};

export type StreetSegment = {
  id: string;
  name: string;
  path: LatLng[];
  startNodeId?: string;
  endNodeId?: string;
  completed: boolean;
  source: "osm" | "manual";
};

export type RouteNode = {
  id: string;
  point: LatLng;
};

export type CityBounds = {
  south: number;
  north: number;
  west: number;
  east: number;
};

type CityBoundaryPolygon = {
  outer: LatLng[];
  holes: LatLng[][];
};

type CityBoundary = {
  polygons: CityBoundaryPolygon[];
};

export type SuggestedRoute = {
  id: string;
  name: string;
  points: LatLng[];
  streetIds: string[];
  streetNames: string[];
  distanceKm: number;
  strategy: string;
  nodeIdsCovered: string[];
  nodePoints: LatLng[];
  availableNodes: RouteNode[];
};

export type IntegrationKey =
  | "google_maps"
  | "apple_maps"
  | "strava"
  | "runkeeper"
  | "garmin"
  | "komoot";

export type Integration = {
  key: IntegrationKey;
  label: string;
  launchUrl: string;
  supportsDirectRoute: boolean;
};

export type StoredUser = {
  pinHash: string;
  preferredApp: IntegrationKey;
  createdAt: string;
};

export type PlannerState = {
  streets: StreetSegment[];
  preferredApp: IntegrationKey;
  home: LatLng;
  cityQuery: string;
  cityBounds: CityBounds | null;
};

export type MessageTone = "info" | "success" | "error";

export type Message = {
  tone: MessageTone;
  text: string;
};

export type OverpassWayTags = {
  name?: string;
  ref?: string;
  alt_name?: string;
  official_name?: string;
  highway?: string;
  access?: string;
  foot?: string;
  area?: string;
  service?: string;
};

export type OverpassPayload = {
  elements?: Array<{
    type: "node" | "way";
    id: number;
    lat?: number;
    lon?: number;
    nodes?: number[];
    tags?: OverpassWayTags;
  }>;
};

export type GraphNode = {
  id: string;
  point: LatLng;
  edgeIds: string[];
};

export type GraphEdge = {
  id: string;
  streetId: string;
  streetName: string;
  from: string;
  to: string;
  path: LatLng[];
  distanceKm: number;
};

export type GraphNeighbor = {
  edgeId: string;
  neighbor: string;
};

export type StreetGraph = {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
  adjacency: Map<string, GraphNeighbor[]>;
};

export type DijkstraResult = {
  dist: Map<string, number>;
  prev: Map<string, { nodeId: string; edgeId: string }>;
};

export type Bounds = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};

export const NODE_CAPTURE_RADIUS_METERS = 6.096;

export const USERS_KEY = "streetsprint-users-v1";
export const SESSION_COOKIE = "streetsprint-session";
export const plannerKey = (username: string) => `streetsprint-planner-${username}`;

export const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
] as const;

export const INTEGRATIONS: Integration[] = [
  {
    key: "google_maps",
    label: "Google Maps",
    launchUrl: "https://maps.google.com",
    supportsDirectRoute: true,
  },
  {
    key: "apple_maps",
    label: "Apple Maps",
    launchUrl: "https://maps.apple.com",
    supportsDirectRoute: true,
  },
  {
    key: "strava",
    label: "Strava",
    launchUrl: "https://www.strava.com/routes/new",
    supportsDirectRoute: false,
  },
  {
    key: "runkeeper",
    label: "Runkeeper",
    launchUrl: "https://runkeeper.com",
    supportsDirectRoute: false,
  },
  {
    key: "garmin",
    label: "Garmin Connect",
    launchUrl: "https://connect.garmin.com/modern/courses",
    supportsDirectRoute: false,
  },
  {
    key: "komoot",
    label: "Komoot",
    launchUrl: "https://www.komoot.com/plan",
    supportsDirectRoute: false,
  },
];

export const DEFAULT_HOME: LatLng = {
  lat: 40.7128,
  lon: -74.006,
};

export const DEFAULT_PLANNER: PlannerState = {
  streets: [],
  preferredApp: "google_maps",
  home: DEFAULT_HOME,
  cityQuery: "",
  cityBounds: null,
};

export function normalizeStreetName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ");
}

export function parseCoordinate(value: string | number | undefined): number | null {
  if (value === undefined) {
    return null;
  }
  const numeric = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return numeric;
}

export function hashPin(pin: string): string {
  const trimmed = pin.trim();
  let hash = 0;
  for (let i = 0; i < trimmed.length; i += 1) {
    hash = (hash << 5) - hash + trimmed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

export function getUsers(): Record<string, StoredUser> {
  if (typeof window === "undefined") {
    return {};
  }
  const raw = window.localStorage.getItem(USERS_KEY);
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw) as Record<string, StoredUser>;
  } catch {
    return {};
  }
}

export function saveUsers(users: Record<string, StoredUser>): void {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const pairs = document.cookie ? document.cookie.split("; ") : [];
  for (const pair of pairs) {
    const [key, ...rest] = pair.split("=");
    if (key === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

export function setCookie(name: string, value: string, days: number): void {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function clearCookie(name: string): void {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const c =
    sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  return 6371 * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
}

export function polylineDistanceKm(path: LatLng[]): number {
  if (path.length < 2) {
    return 0;
  }
  let total = 0;
  for (let i = 1; i < path.length; i += 1) {
    total += haversineKm(path[i - 1], path[i]);
  }
  return total;
}

export function compactNumber(value: number): string {
  return Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 100 ? 0 : 1,
  }).format(value);
}

export function parseCsvRows(input: string): string[][] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.split(",").map((cell) => cell.trim()));
}

export function parseStreetDataset(text: string, filename: string): StreetSegment[] {
  const lower = filename.toLowerCase();

  if (lower.endsWith(".json") || lower.endsWith(".geojson")) {
    const parsed: unknown = JSON.parse(text);

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "type" in parsed &&
      (parsed as { type?: string }).type === "FeatureCollection"
    ) {
      const geo = parsed as {
        features?: Array<{
          properties?: { name?: string };
          geometry?: { type?: string; coordinates?: number[][] };
        }>;
      };

      const segments: StreetSegment[] = [];
      for (const feature of geo.features ?? []) {
        if (feature.geometry?.type !== "LineString") {
          continue;
        }
        const name = feature.properties?.name?.trim();
        if (!name) {
          continue;
        }
        const path = (feature.geometry.coordinates ?? [])
          .map((coord) => {
            if (!Array.isArray(coord) || coord.length < 2) {
              return null;
            }
            const lon = parseCoordinate(coord[0]);
            const lat = parseCoordinate(coord[1]);
            if (lat === null || lon === null) {
              return null;
            }
            return { lat, lon };
          })
          .filter((point): point is LatLng => point !== null);

        if (path.length < 2) {
          continue;
        }
        segments.push({
          id: `manual-${crypto.randomUUID()}`,
          name,
          path,
          completed: false,
          source: "manual",
        });
      }
      return segments;
    }

    if (Array.isArray(parsed)) {
      const entries = parsed as Array<{
        name?: string;
        points?: Array<[number, number]>;
        path?: Array<[number, number]>;
        start_lat?: number;
        start_lon?: number;
        end_lat?: number;
        end_lon?: number;
      }>;

      const segments: StreetSegment[] = [];
      for (const entry of entries) {
        const name = entry.name?.trim();
        if (!name) {
          continue;
        }

        const rawPath = entry.points ?? entry.path;
        let path: LatLng[] = [];

        if (rawPath && rawPath.length >= 2) {
          path = rawPath
            .map((coord) => {
              const lat = parseCoordinate(coord[0]);
              const lon = parseCoordinate(coord[1]);
              if (lat === null || lon === null) {
                return null;
              }
              return { lat, lon };
            })
            .filter((point): point is LatLng => point !== null);
        } else {
          const startLat = parseCoordinate(entry.start_lat);
          const startLon = parseCoordinate(entry.start_lon);
          const endLat = parseCoordinate(entry.end_lat);
          const endLon = parseCoordinate(entry.end_lon);
          if (
            startLat !== null &&
            startLon !== null &&
            endLat !== null &&
            endLon !== null
          ) {
            path = [
              { lat: startLat, lon: startLon },
              { lat: endLat, lon: endLon },
            ];
          }
        }

        if (path.length >= 2) {
          segments.push({
            id: `manual-${crypto.randomUUID()}`,
            name,
            path,
            completed: false,
            source: "manual",
          });
        }
      }
      return segments;
    }

    throw new Error("Unsupported JSON structure for street import.");
  }

  if (lower.endsWith(".csv") || lower.endsWith(".txt")) {
    const rows = parseCsvRows(text);
    if (rows.length < 2) {
      return [];
    }

    const headers = rows[0].map((header) => header.toLowerCase());
    const getIndex = (...keys: string[]) =>
      headers.findIndex((header) => keys.includes(header));

    const nameIdx = getIndex("name", "street", "street_name");
    const startLatIdx = getIndex("start_lat", "lat1", "from_lat");
    const startLonIdx = getIndex("start_lon", "lon1", "lng1", "from_lon");
    const endLatIdx = getIndex("end_lat", "lat2", "to_lat");
    const endLonIdx = getIndex("end_lon", "lon2", "lng2", "to_lon");

    if (
      nameIdx < 0 ||
      startLatIdx < 0 ||
      startLonIdx < 0 ||
      endLatIdx < 0 ||
      endLonIdx < 0
    ) {
      throw new Error(
        "CSV requires headers: name,start_lat,start_lon,end_lat,end_lon",
      );
    }

    const segments: StreetSegment[] = [];
    for (let i = 1; i < rows.length; i += 1) {
      const row = rows[i];
      const name = (row[nameIdx] ?? "").trim();
      const startLat = parseCoordinate(row[startLatIdx]);
      const startLon = parseCoordinate(row[startLonIdx]);
      const endLat = parseCoordinate(row[endLatIdx]);
      const endLon = parseCoordinate(row[endLonIdx]);

      if (
        !name ||
        startLat === null ||
        startLon === null ||
        endLat === null ||
        endLon === null
      ) {
        continue;
      }

      segments.push({
        id: `manual-${crypto.randomUUID()}`,
        name,
        path: [
          { lat: startLat, lon: startLon },
          { lat: endLat, lon: endLon },
        ],
        completed: false,
        source: "manual",
      });
    }
    return segments;
  }

  throw new Error("Unsupported street file type. Use CSV, JSON, or GeoJSON.");
}

export function parseActivityPoints(text: string, filename: string): LatLng[] {
  const lower = filename.toLowerCase();

  if (
    lower.endsWith(".gpx") ||
    lower.endsWith(".xml") ||
    lower.endsWith(".tcx")
  ) {
    const xml = new DOMParser().parseFromString(text, "application/xml");
    const gpxPoints = Array.from(xml.querySelectorAll("trkpt"))
      .map((node) => {
        const lat = parseCoordinate(node.getAttribute("lat") ?? undefined);
        const lon = parseCoordinate(node.getAttribute("lon") ?? undefined);
        if (lat === null || lon === null) {
          return null;
        }
        return { lat, lon };
      })
      .filter((point): point is LatLng => point !== null);

    if (gpxPoints.length > 1) {
      return gpxPoints;
    }

    const tcxPoints = Array.from(xml.querySelectorAll("Trackpoint"))
      .map((node) => {
        const latText = node.querySelector("LatitudeDegrees")?.textContent;
        const lonText = node.querySelector("LongitudeDegrees")?.textContent;
        const lat = parseCoordinate(latText ?? undefined);
        const lon = parseCoordinate(lonText ?? undefined);
        if (lat === null || lon === null) {
          return null;
        }
        return { lat, lon };
      })
      .filter((point): point is LatLng => point !== null);

    if (tcxPoints.length > 1) {
      return tcxPoints;
    }
  }

  if (lower.endsWith(".json") || lower.endsWith(".geojson")) {
    const parsed: unknown = JSON.parse(text);

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "type" in parsed &&
      (parsed as { type?: string }).type === "FeatureCollection"
    ) {
      const geo = parsed as {
        features?: Array<{
          geometry?: { type?: string; coordinates?: number[][] };
        }>;
      };

      const points: LatLng[] = [];
      for (const feature of geo.features ?? []) {
        if (feature.geometry?.type !== "LineString") {
          continue;
        }
        for (const coordinate of feature.geometry.coordinates ?? []) {
          if (!Array.isArray(coordinate) || coordinate.length < 2) {
            continue;
          }
          const lon = parseCoordinate(coordinate[0]);
          const lat = parseCoordinate(coordinate[1]);
          if (lat === null || lon === null) {
            continue;
          }
          points.push({ lat, lon });
        }
      }
      if (points.length > 1) {
        return points;
      }
    }

    if (Array.isArray(parsed)) {
      const points = parsed
        .map((entry) => {
          if (Array.isArray(entry) && entry.length >= 2) {
            const lat = parseCoordinate(entry[0]);
            const lon = parseCoordinate(entry[1]);
            if (lat === null || lon === null) {
              return null;
            }
            return { lat, lon };
          }

          if (typeof entry === "object" && entry !== null) {
            const lat = parseCoordinate((entry as { lat?: number }).lat);
            const lon = parseCoordinate(
              (entry as { lon?: number; lng?: number }).lon ??
                (entry as { lon?: number; lng?: number }).lng,
            );
            if (lat === null || lon === null) {
              return null;
            }
            return { lat, lon };
          }

          return null;
        })
        .filter((point): point is LatLng => point !== null);

      if (points.length > 1) {
        return points;
      }
    }
  }

  if (lower.endsWith(".csv") || lower.endsWith(".txt")) {
    const rows = parseCsvRows(text);
    if (rows.length < 2) {
      return [];
    }
    const headers = rows[0].map((header) => header.toLowerCase());
    const latIdx = headers.findIndex((header) =>
      ["lat", "latitude"].includes(header),
    );
    const lonIdx = headers.findIndex((header) =>
      ["lon", "lng", "longitude"].includes(header),
    );

    if (latIdx >= 0 && lonIdx >= 0) {
      const points: LatLng[] = [];
      for (let i = 1; i < rows.length; i += 1) {
        const row = rows[i];
        const lat = parseCoordinate(row[latIdx]);
        const lon = parseCoordinate(row[lonIdx]);
        if (lat === null || lon === null) {
          continue;
        }
        points.push({ lat, lon });
      }
      if (points.length > 1) {
        return points;
      }
    }
  }

  return [];
}

export function toMeters(
  lat: number,
  lon: number,
  originLat: number,
): { x: number; y: number } {
  const metersPerLat = 111_320;
  const metersPerLon = Math.cos((originLat * Math.PI) / 180) * 111_320;
  return {
    x: lon * metersPerLon,
    y: lat * metersPerLat,
  };
}

export function distancePointToSegmentMeters(p: LatLng, a: LatLng, b: LatLng): number {
  const originLat = (p.lat + a.lat + b.lat) / 3;
  const pp = toMeters(p.lat, p.lon, originLat);
  const ap = toMeters(a.lat, a.lon, originLat);
  const bp = toMeters(b.lat, b.lon, originLat);

  const abx = bp.x - ap.x;
  const aby = bp.y - ap.y;
  const apx = pp.x - ap.x;
  const apy = pp.y - ap.y;

  const ab2 = abx * abx + aby * aby;
  if (ab2 === 0) {
    const dx = pp.x - ap.x;
    const dy = pp.y - ap.y;
    return Math.hypot(dx, dy);
  }

  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
  const closestX = ap.x + abx * t;
  const closestY = ap.y + aby * t;
  return Math.hypot(pp.x - closestX, pp.y - closestY);
}

export function distancePointToPathMeters(point: LatLng, path: LatLng[]): number {
  if (path.length < 2) {
    return Number.POSITIVE_INFINITY;
  }
  let minDistance = Number.POSITIVE_INFINITY;
  for (let i = 1; i < path.length; i += 1) {
    const distance = distancePointToSegmentMeters(point, path[i - 1], path[i]);
    if (distance < minDistance) {
      minDistance = distance;
    }
  }
  return minDistance;
}

export function calculateBoundingBox(path: LatLng[]): Bounds {
  let minLat = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  let minLon = Number.POSITIVE_INFINITY;
  let maxLon = Number.NEGATIVE_INFINITY;

  for (const point of path) {
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
    minLon = Math.min(minLon, point.lon);
    maxLon = Math.max(maxLon, point.lon);
  }

  return { minLat, maxLat, minLon, maxLon };
}

export function isPointInCityBounds(
  point: LatLng,
  bounds: CityBounds,
  paddingMeters = 40,
): boolean {
  const midLat = (bounds.south + bounds.north) / 2;
  const latPadding = paddingMeters / 111_320;
  const lonScale = Math.max(0.15, Math.cos((midLat * Math.PI) / 180));
  const lonPadding = paddingMeters / (111_320 * lonScale);

  return (
    point.lat >= bounds.south - latPadding &&
    point.lat <= bounds.north + latPadding &&
    point.lon >= bounds.west - lonPadding &&
    point.lon <= bounds.east + lonPadding
  );
}

export function isStreetInsideCityBounds(
  street: StreetSegment,
  bounds: CityBounds,
): boolean {
  if (street.path.length < 2) {
    return false;
  }

  const start = street.path[0];
  const end = street.path[street.path.length - 1];
  if (!isPointInCityBounds(start, bounds) || !isPointInCityBounds(end, bounds)) {
    return false;
  }

  let insideCount = 0;
  for (const point of street.path) {
    if (isPointInCityBounds(point, bounds)) {
      insideCount += 1;
    }
  }

  return insideCount / street.path.length >= 0.72;
}

export function filterStreetsToCityBounds(
  streets: StreetSegment[],
  bounds: CityBounds,
): StreetSegment[] {
  return streets.filter((street) => isStreetInsideCityBounds(street, bounds));
}

function normalizeBoundaryRing(points: LatLng[]): LatLng[] {
  const cleaned = points.filter(
    (point) => Number.isFinite(point.lat) && Number.isFinite(point.lon),
  );

  if (cleaned.length < 3) {
    return [];
  }

  const first = cleaned[0];
  const last = cleaned[cleaned.length - 1];
  if (first.lat === last.lat && first.lon === last.lon) {
    cleaned.pop();
  }

  return cleaned.length >= 3 ? cleaned : [];
}

function parseCoordinatePair(raw: unknown): LatLng | null {
  if (!Array.isArray(raw) || raw.length < 2) {
    return null;
  }

  const lon = parseCoordinate(raw[0] as string | number | undefined);
  const lat = parseCoordinate(raw[1] as string | number | undefined);
  if (lat === null || lon === null) {
    return null;
  }

  return { lat, lon };
}

function parseBoundaryRing(rawRing: unknown): LatLng[] {
  if (!Array.isArray(rawRing)) {
    return [];
  }

  const ring = rawRing
    .map((pair) => parseCoordinatePair(pair))
    .filter((point): point is LatLng => point !== null);

  return normalizeBoundaryRing(ring);
}

function parseCityBoundaryGeoJson(geojson: unknown): CityBoundary | null {
  if (!geojson || typeof geojson !== "object") {
    return null;
  }

  const payload = geojson as {
    type?: string;
    coordinates?: unknown;
  };
  if (!payload.type || !payload.coordinates) {
    return null;
  }

  const polygons: CityBoundaryPolygon[] = [];

  if (payload.type === "Polygon" && Array.isArray(payload.coordinates)) {
    const rings = payload.coordinates as unknown[];
    const outer = parseBoundaryRing(rings[0]);
    if (outer.length >= 3) {
      const holes = rings
        .slice(1)
        .map((ring) => parseBoundaryRing(ring))
        .filter((ring) => ring.length >= 3);
      polygons.push({ outer, holes });
    }
  }

  if (payload.type === "MultiPolygon" && Array.isArray(payload.coordinates)) {
    for (const polygon of payload.coordinates as unknown[]) {
      if (!Array.isArray(polygon) || polygon.length === 0) {
        continue;
      }

      const outer = parseBoundaryRing(polygon[0]);
      if (outer.length < 3) {
        continue;
      }

      const holes = polygon
        .slice(1)
        .map((ring) => parseBoundaryRing(ring))
        .filter((ring) => ring.length >= 3);
      polygons.push({ outer, holes });
    }
  }

  if (polygons.length === 0) {
    return null;
  }

  return { polygons };
}

function isPointOnSegment(point: LatLng, a: LatLng, b: LatLng): boolean {
  const cross =
    (point.lat - a.lat) * (b.lon - a.lon) - (point.lon - a.lon) * (b.lat - a.lat);
  if (Math.abs(cross) > 1e-10) {
    return false;
  }

  const minLat = Math.min(a.lat, b.lat) - 1e-10;
  const maxLat = Math.max(a.lat, b.lat) + 1e-10;
  const minLon = Math.min(a.lon, b.lon) - 1e-10;
  const maxLon = Math.max(a.lon, b.lon) + 1e-10;

  return (
    point.lat >= minLat &&
    point.lat <= maxLat &&
    point.lon >= minLon &&
    point.lon <= maxLon
  );
}

function isPointInRing(point: LatLng, ring: LatLng[]): boolean {
  if (ring.length < 3) {
    return false;
  }

  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const a = ring[j];
    const b = ring[i];

    if (isPointOnSegment(point, a, b)) {
      return true;
    }

    const intersects =
      (a.lat > point.lat) !== (b.lat > point.lat) &&
      point.lon <
        ((b.lon - a.lon) * (point.lat - a.lat)) / (b.lat - a.lat) + a.lon;
    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function isPointInCityBoundary(point: LatLng, boundary: CityBoundary): boolean {
  for (const polygon of boundary.polygons) {
    if (!isPointInRing(point, polygon.outer)) {
      continue;
    }

    const inHole = polygon.holes.some((hole) => isPointInRing(point, hole));
    if (!inHole) {
      return true;
    }
  }

  return false;
}

function isPointNearCityBoundary(
  point: LatLng,
  boundary: CityBoundary,
  paddingMeters: number,
): boolean {
  const closedRing = (ring: LatLng[]) => {
    if (ring.length === 0) {
      return ring;
    }
    return [...ring, ring[0]];
  };

  for (const polygon of boundary.polygons) {
    if (distancePointToPathMeters(point, closedRing(polygon.outer)) <= paddingMeters) {
      return true;
    }
    for (const hole of polygon.holes) {
      if (distancePointToPathMeters(point, closedRing(hole)) <= paddingMeters) {
        return true;
      }
    }
  }

  return false;
}

function isPointInCityBoundaryWithPadding(
  point: LatLng,
  boundary: CityBoundary,
  paddingMeters = 30,
): boolean {
  if (isPointInCityBoundary(point, boundary)) {
    return true;
  }
  if (paddingMeters <= 0) {
    return false;
  }
  return isPointNearCityBoundary(point, boundary, paddingMeters);
}

function isStreetInsideCityBoundary(
  street: StreetSegment,
  boundary: CityBoundary,
): boolean {
  if (street.path.length < 2) {
    return false;
  }

  const start = street.path[0];
  const end = street.path[street.path.length - 1];
  if (
    !isPointInCityBoundaryWithPadding(start, boundary, 40) ||
    !isPointInCityBoundaryWithPadding(end, boundary, 40)
  ) {
    return false;
  }

  let insideCount = 0;
  for (const point of street.path) {
    if (isPointInCityBoundaryWithPadding(point, boundary, 22)) {
      insideCount += 1;
    }
  }

  return insideCount / street.path.length >= 0.72;
}

function filterStreetsToCityBoundary(
  streets: StreetSegment[],
  boundary: CityBoundary,
): StreetSegment[] {
  return streets.filter((street) => isStreetInsideCityBoundary(street, boundary));
}


export function matchActivityToStreets(
  activity: LatLng[],
  streets: StreetSegment[],
): Set<string> {
  const matched = new Set<string>();
  const candidates = streets
    .filter((street) => !street.completed && street.path.length >= 2)
    .map((street) => ({
      street,
      box: calculateBoundingBox(street.path),
    }));

  if (candidates.length === 0 || activity.length < 2) {
    return matched;
  }

  const expandedDegrees = 0.00045;
  const thresholdMeters = 40;
  const sampleStep = Math.max(1, Math.floor(activity.length / 700));

  for (let i = 0; i < activity.length; i += sampleStep) {
    const point = activity[i];

    for (const candidate of candidates) {
      if (matched.has(candidate.street.id)) {
        continue;
      }

      const { minLat, maxLat, minLon, maxLon } = candidate.box;
      if (
        point.lat < minLat - expandedDegrees ||
        point.lat > maxLat + expandedDegrees ||
        point.lon < minLon - expandedDegrees ||
        point.lon > maxLon + expandedDegrees
      ) {
        continue;
      }

      const distance = distancePointToPathMeters(point, candidate.street.path);
      if (distance <= thresholdMeters) {
        matched.add(candidate.street.id);
      }
    }
  }

  return matched;
}

export function buildOverpassAreaQuery(rawCity: string): string {
  const city = rawCity.replace(/"/g, "").trim();
  return `
[out:json][timeout:120];
(
  area["name"="${city}"]["boundary"="administrative"]["admin_level"~"5|6|7|8|9"];
  relation["name"="${city}"]["boundary"="administrative"];
)->.searchArea;
(
  way["highway"](area.searchArea);
);
out body;
>;
out skel qt;
`;
}

export function buildOverpassBboxQuery(bounds: {
  south: number;
  north: number;
  west: number;
  east: number;
}): string {
  return `
[out:json][timeout:120];
(
  way["highway"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
);
out body;
>;
out skel qt;
`;
}

export function buildOverpassAroundQuery(center: LatLng, radiusKm: number): string {
  const radiusMeters = Math.round(Math.max(1000, radiusKm * 1000));
  return `
[out:json][timeout:120];
(
  way["highway"](around:${radiusMeters},${center.lat},${center.lon});
);
out body;
>;
out skel qt;
`;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function isRunnableCityStreet(tags: OverpassWayTags | undefined): boolean {
  if (!tags) {
    return false;
  }

  const highway = tags.highway?.trim().toLowerCase();
  if (!highway) {
    return false;
  }

  const allowedRoadTypes = new Set([
    "residential",
    "unclassified",
    "tertiary",
    "secondary",
    "primary",
    "living_street",
  ]);

  if (!allowedRoadTypes.has(highway)) {
    return false;
  }

  const access = tags.access?.trim().toLowerCase();
  if (access === "private" || access === "no") {
    return false;
  }

  const foot = tags.foot?.trim().toLowerCase();
  if (foot === "private" || foot === "no") {
    return false;
  }

  if (tags.area?.trim().toLowerCase() === "yes") {
    return false;
  }

  return Boolean(tags.name?.trim());
}

export function parseOverpassResponse(payload: OverpassPayload): StreetSegment[] {
  const nodeMap = new Map<number, LatLng>();
  const ways: Array<{
    id: number;
    name: string;
    nodes: number[];
  }> = [];
  const segments: StreetSegment[] = [];

  for (const element of payload.elements ?? []) {
    if (
      element.type === "node" &&
      typeof element.lat === "number" &&
      typeof element.lon === "number"
    ) {
      nodeMap.set(element.id, { lat: element.lat, lon: element.lon });
    }
  }

  for (const element of payload.elements ?? []) {
    if (element.type !== "way") {
      continue;
    }
    if (!isRunnableCityStreet(element.tags)) {
      continue;
    }
    if (!element.nodes || element.nodes.length < 2) {
      continue;
    }

    const name = element.tags?.name?.trim();
    if (!name) {
      continue;
    }

    ways.push({
      id: element.id,
      name,
      nodes: element.nodes,
    });
  }

  if (ways.length === 0) {
    return segments;
  }

  const nodeUsage = new Map<number, number>();
  for (const way of ways) {
    for (const nodeId of way.nodes) {
      nodeUsage.set(nodeId, (nodeUsage.get(nodeId) ?? 0) + 1);
    }
  }

  for (const way of ways) {
    const splitIndices = new Set<number>([0, way.nodes.length - 1]);

    for (let i = 1; i < way.nodes.length - 1; i += 1) {
      if ((nodeUsage.get(way.nodes[i]) ?? 0) > 1) {
        splitIndices.add(i);
      }
    }

    const orderedSplits = Array.from(splitIndices).sort((a, b) => a - b);

    for (let i = 1; i < orderedSplits.length; i += 1) {
      const fromIndex = orderedSplits[i - 1];
      const toIndex = orderedSplits[i];
      if (toIndex <= fromIndex) {
        continue;
      }

      const segmentNodeIds = way.nodes.slice(fromIndex, toIndex + 1);
      if (segmentNodeIds.length < 2) {
        continue;
      }

      const path: LatLng[] = [];
      let hasMissingNode = false;
      for (const nodeId of segmentNodeIds) {
        const node = nodeMap.get(nodeId);
        if (!node) {
          hasMissingNode = true;
          break;
        }
        path.push(node);
      }

      if (hasMissingNode || path.length < 2) {
        continue;
      }

      const startNodeRaw = segmentNodeIds[0];
      const endNodeRaw = segmentNodeIds[segmentNodeIds.length - 1];

      segments.push({
        id: `osm-${way.id}-${startNodeRaw}-${endNodeRaw}-${i}`,
        name: way.name,
        path,
        startNodeId: `osm-node-${startNodeRaw}`,
        endNodeId: `osm-node-${endNodeRaw}`,
        completed: false,
        source: "osm",
      });
    }
  }

  if (segments.length === 0) {
    for (const way of ways) {
      const path: LatLng[] = [];
      let hasMissingNode = false;
      for (const nodeId of way.nodes) {
        const node = nodeMap.get(nodeId);
        if (!node) {
          hasMissingNode = true;
          break;
        }
        path.push(node);
      }
      if (hasMissingNode || path.length < 2) {
        continue;
      }

      const startNodeRaw = way.nodes[0];
      const endNodeRaw = way.nodes[way.nodes.length - 1];

      segments.push({
        id: `osm-${way.id}`,
        name: way.name,
        path,
        startNodeId: `osm-node-${startNodeRaw}`,
        endNodeId: `osm-node-${endNodeRaw}`,
        completed: false,
        source: "osm",
      });
    }
  }

  return segments;
}

export function buildCityVariants(city: string): string[] {
  const raw = city.trim();
  if (!raw) {
    return [];
  }

  const variants = new Set<string>([raw]);
  const commaParts = raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (commaParts.length > 0) {
    variants.add(commaParts[0]);
    if (commaParts.length > 1) {
      variants.add(`${commaParts[0]}, ${commaParts[1]}`);
    }
  }

  variants.add(`${raw}, USA`);
  return Array.from(variants);
}

async function fetchNominatimGeo(city: string): Promise<{
  bounds: CityBounds;
  center: LatLng;
  label: string;
  boundary: CityBoundary | null;
} | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&polygon_geojson=1&q=${encodeURIComponent(city)}`;
  const response = await fetchWithTimeout(
    url,
    {
      headers: {
        Accept: "application/json",
      },
    },
    20_000,
  );
  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as Array<{
    lat?: string;
    lon?: string;
    display_name?: string;
    boundingbox?: [string, string, string, string];
    geojson?: unknown;
    addresstype?: string;
    type?: string;
    place_rank?: number;
  }>;

  if (!Array.isArray(payload) || payload.length === 0) {
    return null;
  }

  const normalizedQuery = city.trim().toLowerCase();
  const cityToken = normalizedQuery.split(",")[0]?.trim() ?? normalizedQuery;

  const ranked = payload
    .map((entry) => {
      const addresstype = entry.addresstype?.toLowerCase() ?? "";
      const type = entry.type?.toLowerCase() ?? "";
      const label = entry.display_name?.toLowerCase() ?? "";
      const placeRank =
        typeof entry.place_rank === "number" ? entry.place_rank : Number.POSITIVE_INFINITY;

      let score = 0;
      if (label.startsWith(cityToken)) {
        score += 42;
      }
      if (label.includes(cityToken)) {
        score += 12;
      }

      if (["city", "town", "municipality"].includes(addresstype)) {
        score += 120;
      } else if (["village", "borough", "suburb", "hamlet"].includes(addresstype)) {
        score += 72;
      } else if (["county", "state", "region", "country"].includes(addresstype)) {
        score -= 130;
      }

      if (["city", "town", "municipality"].includes(type)) {
        score += 55;
      } else if (type === "administrative") {
        score += 8;
      }

      if (Number.isFinite(placeRank)) {
        score += Math.max(-24, 22 - Math.abs(16 - placeRank) * 4);
      }

      return {
        entry,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);

  let chosen:
    | {
        lat?: string;
        lon?: string;
        display_name?: string;
        boundingbox?: [string, string, string, string];
        geojson?: unknown;
      }
    | null = null;

  for (const candidate of ranked) {
    const bbox = candidate.entry.boundingbox;
    if (!bbox || bbox.length < 4) {
      continue;
    }

    const south = parseCoordinate(bbox[0]);
    const north = parseCoordinate(bbox[1]);
    const west = parseCoordinate(bbox[2]);
    const east = parseCoordinate(bbox[3]);
    const centerLat = parseCoordinate(candidate.entry.lat);
    const centerLon = parseCoordinate(candidate.entry.lon);

    if (
      south === null ||
      north === null ||
      west === null ||
      east === null ||
      centerLat === null ||
      centerLon === null ||
      south >= north ||
      west >= east
    ) {
      continue;
    }

    chosen = candidate.entry;
    break;
  }

  if (!chosen?.boundingbox || chosen.boundingbox.length < 4) {
    return null;
  }

  const south = parseCoordinate(chosen.boundingbox[0]);
  const north = parseCoordinate(chosen.boundingbox[1]);
  const west = parseCoordinate(chosen.boundingbox[2]);
  const east = parseCoordinate(chosen.boundingbox[3]);
  const centerLat = parseCoordinate(chosen.lat);
  const centerLon = parseCoordinate(chosen.lon);
  if (centerLat === null || centerLon === null) {
    return null;
  }
  if (
    south === null ||
    north === null ||
    west === null ||
    east === null ||
    south >= north ||
    west >= east
  ) {
    return null;
  }

  return {
    bounds: {
      south,
      north,
      west,
      east,
    },
    center: {
      lat: centerLat,
      lon: centerLon,
    },
    label: chosen.display_name?.trim() || city,
    boundary: parseCityBoundaryGeoJson(chosen.geojson),
  };
}

async function requestOverpass(query: string): Promise<OverpassPayload> {
  const failures: string[] = [];

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetchWithTimeout(
        endpoint,
        {
          method: "POST",
          body: query,
          headers: {
            "Content-Type": "text/plain;charset=UTF-8",
            Accept: "application/json",
          },
        },
        55_000,
      );

      if (!response.ok) {
        failures.push(`${new URL(endpoint).host} (${response.status})`);
        continue;
      }

      return (await response.json()) as OverpassPayload;
    } catch (error) {
      const text = error instanceof Error ? error.message : "request failed";
      failures.push(`${new URL(endpoint).host} (${text})`);
    }
  }

  throw new Error(`All Overpass endpoints failed: ${failures.join("; ")}`);
}

export async function loadStreetsFromOSM(city: string): Promise<{
  streets: StreetSegment[];
  sourceLabel: string;
  cityBounds: CityBounds | null;
}> {
  const variants = buildCityVariants(city);
  const areaResults: Array<{
    variant: string;
    streets: StreetSegment[];
  }> = [];

  for (const variant of variants) {
    try {
      const areaPayload = await requestOverpass(buildOverpassAreaQuery(variant));
      const areaStreets = parseOverpassResponse(areaPayload);
      areaResults.push({
        variant,
        streets: areaStreets,
      });
    } catch {
      continue;
    }
  }

  const bestAreaResult = areaResults
    .slice()
    .sort((a, b) => b.streets.length - a.streets.length)[0];
  const bestAreaStreets = bestAreaResult?.streets ?? [];
  const bestAreaLabel = bestAreaResult
    ? `OpenStreetMap area (${bestAreaResult.variant})`
    : `OpenStreetMap area (${city})`;

  let nominatimGeo: Awaited<ReturnType<typeof fetchNominatimGeo>> = null;
  for (const variant of variants) {
    nominatimGeo = await fetchNominatimGeo(variant);
    if (nominatimGeo) {
      break;
    }
  }

  if (!nominatimGeo) {
    if (bestAreaStreets.length > 0) {
      return {
        streets: bestAreaStreets,
        sourceLabel: bestAreaLabel,
        cityBounds: null,
      };
    }
    throw new Error(
      "Could not resolve city bounds. Try entering city + state (example: San Luis Obispo, CA).",
    );
  }

  let bboxStreets: StreetSegment[] = [];
  let aroundStreets: StreetSegment[] = [];

  try {
    const bboxPayload = await requestOverpass(
      buildOverpassBboxQuery(nominatimGeo.bounds),
    );
    bboxStreets = parseOverpassResponse(bboxPayload);
  } catch {
    bboxStreets = [];
  }

  const diagonalKm = haversineKm(
    { lat: nominatimGeo.bounds.south, lon: nominatimGeo.bounds.west },
    { lat: nominatimGeo.bounds.north, lon: nominatimGeo.bounds.east },
  );
  const aroundRadiusKm = Math.max(5, Math.min(24, diagonalKm * 0.32));

  try {
    const aroundPayload = await requestOverpass(
      buildOverpassAroundQuery(nominatimGeo.center, aroundRadiusKm),
    );
    aroundStreets = parseOverpassResponse(aroundPayload);
  } catch {
    aroundStreets = [];
  }

  const constrainToCityLimits = (input: StreetSegment[]): StreetSegment[] => {
    if (nominatimGeo.boundary) {
      const polygonFiltered = filterStreetsToCityBoundary(input, nominatimGeo.boundary);
      if (polygonFiltered.length > 0) {
        return polygonFiltered;
      }
    }
    return filterStreetsToCityBounds(input, nominatimGeo.bounds);
  };

  const boundaryLabel = nominatimGeo.boundary
    ? "administrative boundary"
    : "city bounds fallback";

  const winners = [
    {
      streets: constrainToCityLimits(bestAreaStreets),
      label: `${bestAreaLabel} constrained to ${boundaryLabel}`,
    },
    {
      streets: constrainToCityLimits(bboxStreets),
      label: `OpenStreetMap bbox fallback (${nominatimGeo.label}) constrained to ${boundaryLabel}`,
    },
    {
      streets: constrainToCityLimits(aroundStreets),
      label: `OpenStreetMap center-radius fallback (${nominatimGeo.label}) constrained to ${boundaryLabel}`,
    },
  ].sort((a, b) => b.streets.length - a.streets.length);

  const best = winners[0];
  if (best.streets.length > 0) {
    return {
      streets: best.streets,
      sourceLabel: best.label,
      cityBounds: nominatimGeo.bounds,
    };
  }

  throw new Error(
    "No runnable streets found within city limits. Try a nearby city query or check your location spelling.",
  );
}

export function dedupeByName(streets: StreetSegment[]): StreetSegment[] {
  const seen = new Set<string>();
  const result: StreetSegment[] = [];

  for (const street of streets) {
    let left: string;
    let right: string;

    if (street.startNodeId && street.endNodeId) {
      [left, right] =
        street.startNodeId <= street.endNodeId
          ? [street.startNodeId, street.endNodeId]
          : [street.endNodeId, street.startNodeId];
    } else {
      const start = street.path[0];
      const end = street.path[street.path.length - 1];
      const startKey = `${start.lat.toFixed(5)},${start.lon.toFixed(5)}`;
      const endKey = `${end.lat.toFixed(5)},${end.lon.toFixed(5)}`;
      [left, right] = startKey <= endKey ? [startKey, endKey] : [endKey, startKey];
    }

    const key = `${normalizeStreetName(street.name)}:${left}:${right}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(street);
  }

  return result;
}

export function quantizePoint(point: LatLng): string {
  return `${point.lat.toFixed(5)},${point.lon.toFixed(5)}`;
}

export function nodeIdForStreetEndpoint(
  street: StreetSegment,
  endpoint: "start" | "end",
): string {
  if (endpoint === "start") {
    return street.startNodeId ?? quantizePoint(street.path[0]);
  }

  return street.endNodeId ?? quantizePoint(street.path[street.path.length - 1]);
}

export function buildStreetGraph(streets: StreetSegment[]): StreetGraph {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();
  const adjacency = new Map<string, GraphNeighbor[]>();

  for (const street of streets) {
    if (street.path.length < 2) {
      continue;
    }

    const startPoint = street.path[0];
    const endPoint = street.path[street.path.length - 1];
    const from = nodeIdForStreetEndpoint(street, "start");
    const to = nodeIdForStreetEndpoint(street, "end");
    const edgeId = street.id;

    if (!nodes.has(from)) {
      nodes.set(from, {
        id: from,
        point: startPoint,
        edgeIds: [],
      });
    }

    if (!nodes.has(to)) {
      nodes.set(to, {
        id: to,
        point: endPoint,
        edgeIds: [],
      });
    }

    const edge: GraphEdge = {
      id: edgeId,
      streetId: street.id,
      streetName: street.name,
      from,
      to,
      path: street.path,
      distanceKm: polylineDistanceKm(street.path),
    };

    edges.set(edgeId, edge);

    nodes.get(from)?.edgeIds.push(edgeId);
    nodes.get(to)?.edgeIds.push(edgeId);

    if (!adjacency.has(from)) {
      adjacency.set(from, []);
    }
    if (!adjacency.has(to)) {
      adjacency.set(to, []);
    }

    adjacency.get(from)?.push({ edgeId, neighbor: to });
    adjacency.get(to)?.push({ edgeId, neighbor: from });
  }

  return { nodes, edges, adjacency };
}

export class MinHeap<T> {
  private data: T[] = [];

  constructor(private compare: (a: T, b: T) => number) {}

  push(value: T): void {
    this.data.push(value);
    this.bubbleUp(this.data.length - 1);
  }

  pop(): T | undefined {
    if (this.data.length === 0) {
      return undefined;
    }
    const top = this.data[0];
    const end = this.data.pop();
    if (this.data.length > 0 && end !== undefined) {
      this.data[0] = end;
      this.bubbleDown(0);
    }
    return top;
  }

  get size(): number {
    return this.data.length;
  }

  private bubbleUp(index: number): void {
    let current = index;
    while (current > 0) {
      const parent = Math.floor((current - 1) / 2);
      if (this.compare(this.data[current], this.data[parent]) >= 0) {
        break;
      }
      [this.data[current], this.data[parent]] = [
        this.data[parent],
        this.data[current],
      ];
      current = parent;
    }
  }

  private bubbleDown(index: number): void {
    let current = index;
    const length = this.data.length;
    while (true) {
      const left = current * 2 + 1;
      const right = left + 1;
      let smallest = current;

      if (
        left < length &&
        this.compare(this.data[left], this.data[smallest]) < 0
      ) {
        smallest = left;
      }

      if (
        right < length &&
        this.compare(this.data[right], this.data[smallest]) < 0
      ) {
        smallest = right;
      }

      if (smallest === current) {
        break;
      }

      [this.data[current], this.data[smallest]] = [
        this.data[smallest],
        this.data[current],
      ];
      current = smallest;
    }
  }
}

export function runDijkstra(graph: StreetGraph, startNodeId: string): DijkstraResult {
  const dist = new Map<string, number>();
  const prev = new Map<string, { nodeId: string; edgeId: string }>();

  for (const nodeId of graph.nodes.keys()) {
    dist.set(nodeId, Number.POSITIVE_INFINITY);
  }
  dist.set(startNodeId, 0);

  const heap = new MinHeap<{ nodeId: string; distance: number }>(
    (a, b) => a.distance - b.distance,
  );
  heap.push({ nodeId: startNodeId, distance: 0 });

  while (heap.size > 0) {
    const current = heap.pop();
    if (!current) {
      break;
    }

    const best = dist.get(current.nodeId) ?? Number.POSITIVE_INFINITY;
    if (current.distance > best) {
      continue;
    }

    const neighbors = graph.adjacency.get(current.nodeId) ?? [];
    for (const neighbor of neighbors) {
      const edge = graph.edges.get(neighbor.edgeId);
      if (!edge) {
        continue;
      }
      const nextDistance = current.distance + edge.distanceKm;
      const known = dist.get(neighbor.neighbor) ?? Number.POSITIVE_INFINITY;
      if (nextDistance < known) {
        dist.set(neighbor.neighbor, nextDistance);
        prev.set(neighbor.neighbor, {
          nodeId: current.nodeId,
          edgeId: neighbor.edgeId,
        });
        heap.push({ nodeId: neighbor.neighbor, distance: nextDistance });
      }
    }
  }

  return { dist, prev };
}

export function getDijkstraCached(
  cache: Map<string, DijkstraResult>,
  graph: StreetGraph,
  startNodeId: string,
): DijkstraResult {
  const cached = cache.get(startNodeId);
  if (cached) {
    return cached;
  }
  const computed = runDijkstra(graph, startNodeId);
  cache.set(startNodeId, computed);
  return computed;
}

export function reconstructPathEdges(
  result: DijkstraResult,
  startNodeId: string,
  endNodeId: string,
): string[] {
  if (startNodeId === endNodeId) {
    return [];
  }

  const edges: string[] = [];
  let cursor = endNodeId;

  while (cursor !== startNodeId) {
    const step = result.prev.get(cursor);
    if (!step) {
      return [];
    }
    edges.push(step.edgeId);
    cursor = step.nodeId;
  }

  return edges.reverse();
}

export function shortestPathEdges(
  graph: StreetGraph,
  cache: Map<string, DijkstraResult>,
  fromNodeId: string,
  toNodeId: string,
): { distanceKm: number; edgeIds: string[] } {
  const result = getDijkstraCached(cache, graph, fromNodeId);
  const distanceKm = result.dist.get(toNodeId) ?? Number.POSITIVE_INFINITY;
  if (!Number.isFinite(distanceKm)) {
    return {
      distanceKm: Number.POSITIVE_INFINITY,
      edgeIds: [],
    };
  }

  const edgeIds = reconstructPathEdges(result, fromNodeId, toNodeId);
  return {
    distanceKm,
    edgeIds,
  };
}

export function findNearestNodeId(
  nodes: Map<string, GraphNode>,
  target: LatLng,
): string | null {
  let bestId: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const node of nodes.values()) {
    const distance = haversineKm(node.point, target);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestId = node.id;
    }
  }

  return bestId;
}

export function selectCandidateStreets(
  streets: StreetSegment[],
  home: LatLng,
  targetKm: number,
): StreetSegment[] {
  const normalizedTargetKm = Math.max(0.8, targetKm);
  const scored = streets
    .filter((street) => street.path.length >= 2)
    .map((street) => {
      const start = street.path[0];
      const end = street.path[street.path.length - 1];
      const entry = Math.min(haversineKm(home, start), haversineKm(home, end));
      return {
        street,
        entry,
      };
    })
    .sort((a, b) => a.entry - b.entry);

  if (scored.length === 0) {
    return [];
  }

  const radius = Math.max(2.2, Math.min(32, normalizedTargetKm * 1.45 + 1.3));
  const maxByRadius = Math.min(
    4200,
    Math.max(320, Math.round(normalizedTargetKm * 168)),
  );
  const byRadius = scored
    .filter((entry) => entry.entry <= radius)
    .slice(0, maxByRadius)
    .map((entry) => entry.street);

  if (byRadius.length >= Math.max(120, Math.round(normalizedTargetKm * 22))) {
    return byRadius;
  }

  const fallbackCount = Math.min(
    scored.length,
    Math.max(320, Math.round(normalizedTargetKm * 72)),
  );
  return scored.slice(0, fallbackCount).map((entry) => entry.street);
}

export type EdgeSelectionOptions = {
  selectionBudgetKm?: number;
  maxSelectedEdges?: number;
  connectorPenaltyScale?: number;
  overshootFactor?: number;
};

export function selectEdgesForCoverage(
  graph: StreetGraph,
  startNodeId: string,
  targetKm: number,
  cache: Map<string, DijkstraResult>,
  options: EdgeSelectionOptions = {},
): Set<string> {
  const selected = new Set<string>();
  const visitedNodes = new Set<string>([startNodeId]);

  const fromStart = getDijkstraCached(cache, graph, startNodeId);
  const normalizedTargetKm = Math.max(0.8, targetKm);
  const selectionBudget = Math.max(
    0.95,
    options.selectionBudgetKm ?? normalizedTargetKm * 0.74,
  );
  const maxSelectedEdges = Math.max(
    50,
    options.maxSelectedEdges ?? Math.round(normalizedTargetKm * 18 + 60),
  );
  const connectorPenaltyScale = Math.max(
    0.18,
    options.connectorPenaltyScale ?? 0.5,
  );
  const overshootFactor = Math.max(1.02, options.overshootFactor ?? 1.1);

  const candidates = Array.from(graph.edges.values())
    .map((edge) => {
      const toFrom = fromStart.dist.get(edge.from) ?? Number.POSITIVE_INFINITY;
      const toTo = fromStart.dist.get(edge.to) ?? Number.POSITIVE_INFINITY;
      const connectorNode = toFrom <= toTo ? edge.from : edge.to;
      const connectorCost = Math.min(toFrom, toTo);
      const effectiveCost =
        edge.distanceKm + connectorCost * (0.34 + connectorPenaltyScale * 0.48) + 0.05;
      const localBonus = Math.max(0, 1.25 - connectorCost) * 0.09;
      const shortEdgeBonus = edge.distanceKm <= 0.24 ? 0.04 : 0;
      const score =
        1.9 / effectiveCost + localBonus + shortEdgeBonus;
      return {
        edgeId: edge.id,
        connectorNode,
        connectorCost,
        score,
      };
    })
    .filter((item) => Number.isFinite(item.connectorCost))
    .sort((a, b) => b.score - a.score);

  let selectedDistance = 0;

  for (const candidate of candidates) {
    if (selectedDistance >= selectionBudget) {
      break;
    }
    if (selected.size >= maxSelectedEdges) {
      break;
    }

    const edge = graph.edges.get(candidate.edgeId);
    if (!edge) {
      continue;
    }

    const gain =
      (visitedNodes.has(edge.from) ? 0 : 1) + (visitedNodes.has(edge.to) ? 0 : 1);
    if (gain === 0 && selectedDistance > selectionBudget * 0.58) {
      continue;
    }

    const connectors = reconstructPathEdges(
      fromStart,
      startNodeId,
      candidate.connectorNode,
    );
    const proposedIds = [...connectors, edge.id];

    let additionalDistance = 0;
    const toAdd: string[] = [];
    for (const edgeId of proposedIds) {
      if (selected.has(edgeId)) {
        continue;
      }
      const segment = graph.edges.get(edgeId);
      if (!segment) {
        continue;
      }
      toAdd.push(edgeId);
      additionalDistance += segment.distanceKm;
    }

    if (toAdd.length === 0) {
      continue;
    }

    if (
      selectedDistance + additionalDistance > selectionBudget * overshootFactor &&
      selected.size > 0
    ) {
      continue;
    }

    for (const edgeId of toAdd) {
      selected.add(edgeId);
    }
    selectedDistance += additionalDistance;
    visitedNodes.add(edge.from);
    visitedNodes.add(edge.to);
  }

  if (selected.size === 0) {
    let fallback: { edgeId: string; connectorNode: string; connectorCost: number } | null =
      null;

    for (const edge of graph.edges.values()) {
      const toFrom = fromStart.dist.get(edge.from) ?? Number.POSITIVE_INFINITY;
      const toTo = fromStart.dist.get(edge.to) ?? Number.POSITIVE_INFINITY;
      const connectorNode = toFrom <= toTo ? edge.from : edge.to;
      const connectorCost = Math.min(toFrom, toTo);
      if (!Number.isFinite(connectorCost)) {
        continue;
      }

      if (!fallback || connectorCost < fallback.connectorCost) {
        fallback = {
          edgeId: edge.id,
          connectorNode,
          connectorCost,
        };
      }
    }

    if (fallback) {
      const connectors = reconstructPathEdges(
        fromStart,
        startNodeId,
        fallback.connectorNode,
      );
      for (const edgeId of connectors) {
        selected.add(edgeId);
      }
      selected.add(fallback.edgeId);
    }
  }

  return selected;
}

export function oddDegreeNodes(multiset: Map<string, number>, graph: StreetGraph): string[] {
  const degree = new Map<string, number>();

  for (const nodeId of graph.nodes.keys()) {
    degree.set(nodeId, 0);
  }

  for (const [edgeId, count] of multiset.entries()) {
    const edge = graph.edges.get(edgeId);
    if (!edge || count <= 0) {
      continue;
    }
    degree.set(edge.from, (degree.get(edge.from) ?? 0) + count);
    degree.set(edge.to, (degree.get(edge.to) ?? 0) + count);
  }

  return Array.from(degree.entries())
    .filter((entry) => entry[1] % 2 === 1)
    .map((entry) => entry[0]);
}

export function eulerizeEdgeSet(
  edgeIds: Set<string>,
  graph: StreetGraph,
  cache: Map<string, DijkstraResult>,
): Map<string, number> {
  const multiset = new Map<string, number>();
  for (const edgeId of edgeIds) {
    multiset.set(edgeId, 1);
  }

  const oddNodes = oddDegreeNodes(multiset, graph);

  while (oddNodes.length > 0) {
    const nodeA = oddNodes.shift();
    if (!nodeA) {
      break;
    }

    let bestIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;
    let bestPath: string[] = [];

    for (let i = 0; i < oddNodes.length; i += 1) {
      const nodeB = oddNodes[i];
      const path = shortestPathEdges(graph, cache, nodeA, nodeB);
      if (path.edgeIds.length === 0) {
        continue;
      }

      if (path.distanceKm < bestDistance) {
        bestDistance = path.distanceKm;
        bestIndex = i;
        bestPath = path.edgeIds;
      }
    }

    if (bestIndex < 0) {
      break;
    }

    oddNodes.splice(bestIndex, 1);
    for (const edgeId of bestPath) {
      multiset.set(edgeId, (multiset.get(edgeId) ?? 0) + 1);
    }
  }

  return multiset;
}

export function buildEulerTraversal(
  graph: StreetGraph,
  multiset: Map<string, number>,
  startNodeId: string,
): Array<{ edgeId: string; from: string; to: string }> {
  const tokens: Array<{ edgeId: string; from: string; to: string }> = [];

  for (const [edgeId, count] of multiset.entries()) {
    const edge = graph.edges.get(edgeId);
    if (!edge) {
      continue;
    }
    for (let i = 0; i < count; i += 1) {
      tokens.push({
        edgeId,
        from: edge.from,
        to: edge.to,
      });
    }
  }

  if (tokens.length === 0) {
    return [];
  }

  const adjacency = new Map<string, number[]>();
  for (let tokenId = 0; tokenId < tokens.length; tokenId += 1) {
    const token = tokens[tokenId];
    if (!adjacency.has(token.from)) {
      adjacency.set(token.from, []);
    }
    if (!adjacency.has(token.to)) {
      adjacency.set(token.to, []);
    }
    adjacency.get(token.from)?.push(tokenId);
    adjacency.get(token.to)?.push(tokenId);
  }

  const used = new Array<boolean>(tokens.length).fill(false);
  const cursor = new Map<string, number>();

  const takeToken = (nodeId: string): number | null => {
    const list = adjacency.get(nodeId) ?? [];
    let index = cursor.get(nodeId) ?? 0;
    while (index < list.length && used[list[index]]) {
      index += 1;
    }
    cursor.set(nodeId, index);
    if (index >= list.length) {
      return null;
    }
    return list[index];
  };

  const stack: Array<{
    nodeId: string;
    incoming?: { edgeId: string; from: string; to: string };
  }> = [{ nodeId: startNodeId }];
  const reverse: Array<{ edgeId: string; from: string; to: string }> = [];

  while (stack.length > 0) {
    const top = stack[stack.length - 1];
    const tokenId = takeToken(top.nodeId);

    if (tokenId !== null) {
      used[tokenId] = true;
      const token = tokens[tokenId];
      const neighbor = token.from === top.nodeId ? token.to : token.from;
      stack.push({
        nodeId: neighbor,
        incoming: {
          edgeId: token.edgeId,
          from: top.nodeId,
          to: neighbor,
        },
      });
      continue;
    }

    const popped = stack.pop();
    if (popped?.incoming) {
      reverse.push(popped.incoming);
    }
  }

  return reverse.reverse();
}

export function coveredNodeIdsForPath(points: LatLng[], nodes: RouteNode[]): string[] {
  const covered: string[] = [];
  const thresholdMeters = NODE_CAPTURE_RADIUS_METERS;

  for (const node of nodes) {
    const distance = distancePointToPathMeters(node.point, points);
    if (distance <= thresholdMeters) {
      covered.push(node.id);
    }
  }

  return covered;
}

type RouteTraversalStep = {
  edgeId: string;
  from: string;
  to: string;
};

type PlannedMove = {
  connectorSteps: RouteTraversalStep[];
  targetStep: RouteTraversalStep;
  additionalDistanceKm: number;
  score: number;
};

type SpurPlan = {
  steps: RouteTraversalStep[];
  totalDistanceKm: number;
  score: number;
};

function orientPathEdges(
  graph: StreetGraph,
  startNodeId: string,
  edgeIds: string[],
): RouteTraversalStep[] | null {
  if (edgeIds.length === 0) {
    return [];
  }

  let cursor = startNodeId;
  const steps: RouteTraversalStep[] = [];

  for (const edgeId of edgeIds) {
    const edge = graph.edges.get(edgeId);
    if (!edge) {
      return null;
    }

    if (edge.from === cursor) {
      steps.push({
        edgeId,
        from: edge.from,
        to: edge.to,
      });
      cursor = edge.to;
      continue;
    }

    if (edge.to === cursor) {
      steps.push({
        edgeId,
        from: edge.to,
        to: edge.from,
      });
      cursor = edge.from;
      continue;
    }

    return null;
  }

  return steps;
}

function appendRouteStep(
  graph: StreetGraph,
  step: RouteTraversalStep,
  routePoints: LatLng[],
): { distanceKm: number; edge: GraphEdge } | null {
  const edge = graph.edges.get(step.edgeId);
  if (!edge) {
    return null;
  }

  const orientedPath =
    edge.from === step.from && edge.to === step.to
      ? edge.path
      : [...edge.path].reverse();

  if (orientedPath.length < 2) {
    return null;
  }

  if (routePoints.length === 0) {
    routePoints.push(orientedPath[0]);
  } else if (
    haversineKm(routePoints[routePoints.length - 1], orientedPath[0]) > 0.018
  ) {
    routePoints.push(orientedPath[0]);
  }

  for (let i = 1; i < orientedPath.length; i += 1) {
    routePoints.push(orientedPath[i]);
  }

  return {
    distanceKm: edge.distanceKm,
    edge,
  };
}

function applyTraversalStep(
  graph: StreetGraph,
  step: RouteTraversalStep,
  routePoints: LatLng[],
  completedByStreetId: Map<string, boolean>,
  coveredStreetIds: Set<string>,
  coveredStreetNames: Set<string>,
  rewardedStreetIds: Set<string>,
  coveredNodes: Set<string>,
  traversedEdgeCount: Map<string, number>,
): { nextNodeId: string; distanceKm: number } | null {
  const append = appendRouteStep(graph, step, routePoints);
  if (!append) {
    return null;
  }

  coveredStreetIds.add(append.edge.streetId);
  coveredStreetNames.add(append.edge.streetName);
  coveredNodes.add(step.from);
  coveredNodes.add(step.to);
  traversedEdgeCount.set(
    append.edge.id,
    (traversedEdgeCount.get(append.edge.id) ?? 0) + 1,
  );
  if (!(completedByStreetId.get(append.edge.streetId) ?? false)) {
    rewardedStreetIds.add(append.edge.streetId);
  }

  return {
    nextNodeId: step.to,
    distanceKm: append.distanceKm,
  };
}

function buildDeadEndForwardChainFromNode(
  graph: StreetGraph,
  anchorNodeId: string,
  firstEdgeId: string,
  completedByStreetId: Map<string, boolean>,
  rewardedStreetIds: Set<string>,
): RouteTraversalStep[] {
  const forward: RouteTraversalStep[] = [];
  let currentNodeId = anchorNodeId;
  let incomingEdgeId: string | null = null;
  let nextEdgeId: string | null = firstEdgeId;
  const maxDepth = 12;

  for (let depth = 0; depth < maxDepth && nextEdgeId; depth += 1) {
    const edge = graph.edges.get(nextEdgeId);
    if (!edge) {
      break;
    }
    if ((completedByStreetId.get(edge.streetId) ?? false) || rewardedStreetIds.has(edge.streetId)) {
      if (depth === 0) {
        return [];
      }
      break;
    }

    const toNodeId =
      edge.from === currentNodeId
        ? edge.to
        : edge.to === currentNodeId
          ? edge.from
          : null;
    if (!toNodeId) {
      break;
    }

    forward.push({
      edgeId: edge.id,
      from: currentNodeId,
      to: toNodeId,
    });

    incomingEdgeId = edge.id;
    currentNodeId = toNodeId;
    const outgoing = (graph.adjacency.get(currentNodeId) ?? []).filter(
      (entry) => entry.edgeId !== incomingEdgeId,
    );
    if (outgoing.length !== 1) {
      break;
    }

    const candidateEdge = graph.edges.get(outgoing[0].edgeId);
    if (!candidateEdge) {
      break;
    }
    if (
      (completedByStreetId.get(candidateEdge.streetId) ?? false) ||
      rewardedStreetIds.has(candidateEdge.streetId)
    ) {
      break;
    }
    nextEdgeId = outgoing[0].edgeId;
  }

  if (forward.length === 0) {
    return [];
  }

  const terminalNodeId = forward[forward.length - 1].to;
  const terminalDegree = graph.adjacency.get(terminalNodeId)?.length ?? 0;
  if (terminalDegree !== 1) {
    return [];
  }

  return forward;
}

function findBestDeadEndSpurAtNode(
  graph: StreetGraph,
  currentNodeId: string,
  targetKm: number,
  currentDistanceKm: number,
  hardMaxKm: number,
  completedByStreetId: Map<string, boolean>,
  rewardedStreetIds: Set<string>,
  coveredStreetIds: Set<string>,
  coveredNodes: Set<string>,
): SpurPlan | null {
  const neighbors = graph.adjacency.get(currentNodeId) ?? [];
  let best: SpurPlan | null = null;

  for (const neighbor of neighbors) {
    const forward = buildDeadEndForwardChainFromNode(
      graph,
      currentNodeId,
      neighbor.edgeId,
      completedByStreetId,
      rewardedStreetIds,
    );
    if (forward.length === 0) {
      continue;
    }

    let oneWayDistanceKm = 0;
    const forwardStreetIds = new Set<string>();
    const forwardNodeIds = new Set<string>();
    for (const step of forward) {
      const edge = graph.edges.get(step.edgeId);
      if (!edge) {
        continue;
      }
      oneWayDistanceKm += edge.distanceKm;
      forwardStreetIds.add(edge.streetId);
      forwardNodeIds.add(step.from);
      forwardNodeIds.add(step.to);
    }

    const totalDistanceKm = oneWayDistanceKm * 2;
    const nextDistanceKm = currentDistanceKm + totalDistanceKm;
    if (nextDistanceKm > hardMaxKm && currentDistanceKm >= targetKm * 0.5) {
      continue;
    }

    const newStreetGain = Array.from(forwardStreetIds).filter(
      (streetId) => !coveredStreetIds.has(streetId),
    ).length;
    const newNodeGain = Array.from(forwardNodeIds).filter(
      (nodeId) => !coveredNodes.has(nodeId),
    ).length;
    const branchLengthBonus = Math.min(1.4, oneWayDistanceKm * 1.8);
    const budgetFit =
      1 -
      Math.min(
        1.5,
        Math.abs(targetKm - nextDistanceKm) / Math.max(0.85, targetKm * 0.55),
      );
    const score =
      (newStreetGain * 4.6 + newNodeGain * 2.5 + branchLengthBonus) /
        (totalDistanceKm + 0.07) +
      budgetFit * 1.1;

    const reverse = [...forward]
      .reverse()
      .map((step) => ({
        edgeId: step.edgeId,
        from: step.to,
        to: step.from,
      }));

    const candidate: SpurPlan = {
      steps: [...forward, ...reverse],
      totalDistanceKm,
      score,
    };

    if (!best || candidate.score > best.score) {
      best = candidate;
    }
  }

  return best;
}

function findBestCoverageMove(
  graph: StreetGraph,
  currentNodeId: string,
  targetKm: number,
  currentDistanceKm: number,
  hardMaxKm: number,
  cache: Map<string, DijkstraResult>,
  completedByStreetId: Map<string, boolean>,
  rewardedStreetIds: Set<string>,
  coveredStreetIds: Set<string>,
  coveredNodes: Set<string>,
  traversedEdgeCount: Map<string, number>,
): PlannedMove | null {
  const fromCurrent = getDijkstraCached(cache, graph, currentNodeId);
  const pendingBranchEdgeIds = new Set<string>(
    (graph.adjacency.get(currentNodeId) ?? [])
      .filter((entry) => {
        const edge = graph.edges.get(entry.edgeId);
        if (!edge) {
          return false;
        }
        if (completedByStreetId.get(edge.streetId) ?? false) {
          return false;
        }
        if (rewardedStreetIds.has(edge.streetId)) {
          return false;
        }
        const neighborDegree = graph.adjacency.get(entry.neighbor)?.length ?? 0;
        return neighborDegree <= 2;
      })
      .map((entry) => entry.edgeId),
  );
  let best: PlannedMove | null = null;

  for (const edge of graph.edges.values()) {
    if (completedByStreetId.get(edge.streetId) ?? false) {
      continue;
    }
    if (rewardedStreetIds.has(edge.streetId)) {
      continue;
    }

    const toFrom = fromCurrent.dist.get(edge.from) ?? Number.POSITIVE_INFINITY;
    const toTo = fromCurrent.dist.get(edge.to) ?? Number.POSITIVE_INFINITY;
    if (!Number.isFinite(toFrom) && !Number.isFinite(toTo)) {
      continue;
    }

    const approachFrom = toFrom <= toTo;
    const connectorNode = approachFrom ? edge.from : edge.to;
    const connectorDistanceKm = approachFrom ? toFrom : toTo;
    const targetStep: RouteTraversalStep = approachFrom
      ? {
          edgeId: edge.id,
          from: edge.from,
          to: edge.to,
        }
      : {
          edgeId: edge.id,
          from: edge.to,
          to: edge.from,
        };

    const additionalDistanceKm = connectorDistanceKm + edge.distanceKm;
    const nextDistanceKm = currentDistanceKm + additionalDistanceKm;
    if (nextDistanceKm > hardMaxKm && currentDistanceKm >= targetKm * 0.45) {
      continue;
    }

    const connectorEdgeIds = reconstructPathEdges(
      fromCurrent,
      currentNodeId,
      connectorNode,
    );
    const connectorSteps = orientPathEdges(graph, currentNodeId, connectorEdgeIds);
    if (!connectorSteps) {
      continue;
    }

    let connectorRepeatPenalty = 0;
    for (const connectorEdgeId of connectorEdgeIds) {
      const connectorEdge = graph.edges.get(connectorEdgeId);
      if (!connectorEdge) {
        continue;
      }
      const repeatCount = traversedEdgeCount.get(connectorEdgeId) ?? 0;
      if (repeatCount > 0) {
        connectorRepeatPenalty += connectorEdge.distanceKm * Math.min(2.4, repeatCount);
      }
    }

    const firstTravelEdgeId = connectorSteps[0]?.edgeId ?? targetStep.edgeId;
    const skipNearbyBranchPenalty =
      pendingBranchEdgeIds.size > 0 &&
      !pendingBranchEdgeIds.has(firstTravelEdgeId) &&
      currentDistanceKm <= targetKm * 0.95
        ? Math.min(3.6, pendingBranchEdgeIds.size * 1.18)
        : 0;

    const remainingKm = Math.max(0, targetKm - currentDistanceKm);
    const newStreetGain = coveredStreetIds.has(edge.streetId) ? 0 : 1;
    const newNodeGain =
      (coveredNodes.has(targetStep.from) ? 0 : 1) +
      (coveredNodes.has(targetStep.to) ? 0 : 1);
    const fromDegree = graph.adjacency.get(edge.from)?.length ?? 0;
    const toDegree = graph.adjacency.get(edge.to)?.length ?? 0;
    const leafBonus = fromDegree === 1 || toDegree === 1 ? 1.75 : 0;
    const branchTailBonus = fromDegree <= 2 || toDegree <= 2 ? 0.35 : 0;
    const proximityBonus = Math.max(0, 1.35 - connectorDistanceKm) * 0.7;
    const usefulDistanceBonus = Math.min(1.5, edge.distanceKm * 1.35);
    const budgetFit =
      1 -
      Math.min(1.4, Math.abs(remainingKm - additionalDistanceKm) / Math.max(0.7, targetKm * 0.5));
    const overshootPenalty =
      nextDistanceKm > targetKm * 1.08 ? (nextDistanceKm - targetKm * 1.08) * 1.9 : 0;

    const score =
      (newStreetGain * 3.8 +
        newNodeGain * 2.0 +
        leafBonus +
        branchTailBonus +
        proximityBonus +
        usefulDistanceBonus) /
        (additionalDistanceKm + 0.08) +
      budgetFit * 1.45 -
      overshootPenalty -
      connectorRepeatPenalty * 2.1 -
      skipNearbyBranchPenalty;

    const candidate: PlannedMove = {
      connectorSteps,
      targetStep,
      additionalDistanceKm,
      score,
    };

    if (!best || candidate.score > best.score) {
      best = candidate;
    }
  }

  return best;
}

function findBestImmediateBranchStep(
  graph: StreetGraph,
  currentNodeId: string,
  targetKm: number,
  currentDistanceKm: number,
  hardMaxKm: number,
  completedByStreetId: Map<string, boolean>,
  traversedEdgeCount: Map<string, number>,
  rewardedStreetIds: Set<string>,
  coveredNodes: Set<string>,
): RouteTraversalStep | null {
  const neighbors = graph.adjacency.get(currentNodeId) ?? [];
  const currentDegree = neighbors.length;
  let best: { step: RouteTraversalStep; score: number } | null = null;

  for (const neighbor of neighbors) {
    const edge = graph.edges.get(neighbor.edgeId);
    if (!edge) {
      continue;
    }

    const isCompleted = completedByStreetId.get(edge.streetId) ?? false;
    const isNewReward = !isCompleted && !rewardedStreetIds.has(edge.streetId);
    if (!isNewReward) {
      continue;
    }

    const repeatCount = traversedEdgeCount.get(edge.id) ?? 0;
    if (repeatCount > 0) {
      continue;
    }

    const neighborDegree = graph.adjacency.get(neighbor.neighbor)?.length ?? 0;
    if (neighborDegree > 2) {
      continue;
    }

    if (edge.distanceKm > 1.2) {
      continue;
    }

    const nextDistanceKm = currentDistanceKm + edge.distanceKm;
    if (nextDistanceKm > hardMaxKm && currentDistanceKm >= targetKm * 0.52) {
      continue;
    }

    const nodeGain = coveredNodes.has(neighbor.neighbor) ? 0 : 1;
    const culdesacBonus = neighborDegree === 1 ? 4.0 : 2.25;
    const branchExitBonus = currentDegree >= 3 ? 1.45 : 0.35;
    const shortEdgeBonus = Math.max(0, 0.95 - edge.distanceKm) * 1.25;
    const budgetFit =
      1 -
      Math.min(
        1.25,
        Math.abs(targetKm - nextDistanceKm) / Math.max(0.8, targetKm * 0.55),
      );
    const score =
      culdesacBonus + branchExitBonus + shortEdgeBonus + nodeGain * 1.2 + budgetFit;

    const candidate: RouteTraversalStep = {
      edgeId: edge.id,
      from: currentNodeId,
      to: neighbor.neighbor,
    };

    if (!best || score > best.score) {
      best = { step: candidate, score };
    }
  }

  return best?.step ?? null;
}

function findBestLocalExtension(
  graph: StreetGraph,
  currentNodeId: string,
  targetKm: number,
  currentDistanceKm: number,
  hardMaxKm: number,
  completedByStreetId: Map<string, boolean>,
  traversedEdgeCount: Map<string, number>,
  rewardedStreetIds: Set<string>,
  coveredNodes: Set<string>,
): RouteTraversalStep | null {
  const neighbors = graph.adjacency.get(currentNodeId) ?? [];
  let best: { step: RouteTraversalStep; score: number } | null = null;

  for (const neighbor of neighbors) {
    const edge = graph.edges.get(neighbor.edgeId);
    if (!edge) {
      continue;
    }

    const nextDistanceKm = currentDistanceKm + edge.distanceKm;
    if (nextDistanceKm > hardMaxKm && currentDistanceKm >= targetKm * 0.55) {
      continue;
    }

    const repeatCount = traversedEdgeCount.get(edge.id) ?? 0;
    const isCompleted = completedByStreetId.get(edge.streetId) ?? false;
    const isNewReward = !isCompleted && !rewardedStreetIds.has(edge.streetId);
    const nodeGain = coveredNodes.has(neighbor.neighbor) ? 0 : 1;
    const neighborDegree = graph.adjacency.get(neighbor.neighbor)?.length ?? 0;
    const culdesacBonus = neighborDegree === 1 ? 3.1 : neighborDegree === 2 ? 0.8 : 0;
    const score =
      (isNewReward ? 2.7 : 0.55) +
      nodeGain * 1.0 +
      culdesacBonus -
      repeatCount * 0.92 -
      (isCompleted ? 0.3 : 0) -
      Math.abs(targetKm - nextDistanceKm) * 0.12;

    const candidate: RouteTraversalStep = {
      edgeId: edge.id,
      from: currentNodeId,
      to: neighbor.neighbor,
    };

    if (!best || score > best.score) {
      best = {
        step: candidate,
        score,
      };
    }
  }

  return best?.step ?? null;
}

export function buildEfficientCoverageRoute(
  streets: StreetSegment[],
  home: LatLng,
  targetKm: number,
  cityBounds: CityBounds | null = null,
): SuggestedRoute | null {
  const normalizedTargetKm = Math.max(0.8, targetKm);
  const inCityStreets = cityBounds
    ? filterStreetsToCityBounds(streets, cityBounds)
    : streets;
  const candidates = selectCandidateStreets(inCityStreets, home, normalizedTargetKm);
  if (candidates.length === 0) {
    return null;
  }

  const graph = buildStreetGraph(candidates);
  if (graph.edges.size === 0 || graph.nodes.size === 0) {
    return null;
  }

  const startNodeId = findNearestNodeId(graph.nodes, home);
  if (!startNodeId) {
    return null;
  }

  const completedByStreetId = new Map<string, boolean>(
    candidates.map((street) => [street.id, street.completed]),
  );
  const unfinishedCount = candidates.filter((street) => !street.completed).length;
  if (unfinishedCount === 0) {
    return null;
  }

  const dijkstraCache = new Map<string, DijkstraResult>();
  const routePoints: LatLng[] = [];
  const coveredStreetIds = new Set<string>();
  const coveredStreetNames = new Set<string>();
  const rewardedStreetIds = new Set<string>();
  const coveredNodes = new Set<string>([startNodeId]);
  const traversedEdgeCount = new Map<string, number>();

  let currentNodeId = startNodeId;
  let distanceKm = 0;
  const hardMaxKm = Math.max(1.2, normalizedTargetKm * 1.1 + 0.35);
  const maxIterations = Math.max(140, Math.round(normalizedTargetKm * 95));
  let iterations = 0;

  const runDeadEndSpurSweeps = (maxSweeps: number) => {
    let spurSweeps = 0;
    while (spurSweeps < maxSweeps && distanceKm < hardMaxKm) {
      const anchorNodeId = currentNodeId;
      const spur = findBestDeadEndSpurAtNode(
        graph,
        currentNodeId,
        normalizedTargetKm,
        distanceKm,
        hardMaxKm,
        completedByStreetId,
        rewardedStreetIds,
        coveredStreetIds,
        coveredNodes,
      );
      if (!spur) {
        break;
      }
      if (
        distanceKm + spur.totalDistanceKm > hardMaxKm &&
        distanceKm >= normalizedTargetKm * 0.48
      ) {
        break;
      }

      let failedSpur = false;
      for (const spurStep of spur.steps) {
        const applied = applyTraversalStep(
          graph,
          spurStep,
          routePoints,
          completedByStreetId,
          coveredStreetIds,
          coveredStreetNames,
          rewardedStreetIds,
          coveredNodes,
          traversedEdgeCount,
        );
        if (!applied) {
          failedSpur = true;
          break;
        }
        distanceKm += applied.distanceKm;
        currentNodeId = applied.nextNodeId;
      }

      if (failedSpur || currentNodeId !== anchorNodeId) {
        break;
      }

      spurSweeps += 1;
      if (distanceKm >= hardMaxKm || distanceKm >= normalizedTargetKm * 1.02) {
        break;
      }
    }
  };

  const runImmediateBranchSweep = (maxSteps: number) => {
    let stepCount = 0;
    while (stepCount < maxSteps && distanceKm < hardMaxKm) {
      const branchStep = findBestImmediateBranchStep(
        graph,
        currentNodeId,
        normalizedTargetKm,
        distanceKm,
        hardMaxKm,
        completedByStreetId,
        traversedEdgeCount,
        rewardedStreetIds,
        coveredNodes,
      );
      if (!branchStep) {
        break;
      }

      const applied = applyTraversalStep(
        graph,
        branchStep,
        routePoints,
        completedByStreetId,
        coveredStreetIds,
        coveredStreetNames,
        rewardedStreetIds,
        coveredNodes,
        traversedEdgeCount,
      );
      if (!applied) {
        break;
      }

      distanceKm += applied.distanceKm;
      currentNodeId = applied.nextNodeId;
      stepCount += 1;

      runDeadEndSpurSweeps(2);
      if (distanceKm >= hardMaxKm || distanceKm >= normalizedTargetKm * 1.03) {
        break;
      }
    }
  };

  while (distanceKm < hardMaxKm && iterations < maxIterations) {
    iterations += 1;

    runDeadEndSpurSweeps(5);
    runImmediateBranchSweep(6);

    if (distanceKm >= hardMaxKm) {
      break;
    }

    const move = findBestCoverageMove(
      graph,
      currentNodeId,
      normalizedTargetKm,
      distanceKm,
      hardMaxKm,
      dijkstraCache,
      completedByStreetId,
      rewardedStreetIds,
      coveredStreetIds,
      coveredNodes,
      traversedEdgeCount,
    );

    if (!move) {
      if (distanceKm >= normalizedTargetKm * 0.72 && rewardedStreetIds.size > 0) {
        break;
      }

      const localStep = findBestLocalExtension(
        graph,
        currentNodeId,
        normalizedTargetKm,
        distanceKm,
        hardMaxKm,
        completedByStreetId,
        traversedEdgeCount,
        rewardedStreetIds,
        coveredNodes,
      );
      if (!localStep) {
        break;
      }

      const localAppend = applyTraversalStep(
        graph,
        localStep,
        routePoints,
        completedByStreetId,
        coveredStreetIds,
        coveredStreetNames,
        rewardedStreetIds,
        coveredNodes,
        traversedEdgeCount,
      );
      if (!localAppend) {
        break;
      }
      distanceKm += localAppend.distanceKm;
      currentNodeId = localAppend.nextNodeId;
      continue;
    }

    let aborted = false;
    for (const connectorStep of move.connectorSteps) {
      const connectorEdge = graph.edges.get(connectorStep.edgeId);
      if (!connectorEdge) {
        aborted = true;
        break;
      }
      if (
        distanceKm + connectorEdge.distanceKm > hardMaxKm &&
        distanceKm >= normalizedTargetKm * 0.55
      ) {
        aborted = true;
        break;
      }

      const connectorAppend = applyTraversalStep(
        graph,
        connectorStep,
        routePoints,
        completedByStreetId,
        coveredStreetIds,
        coveredStreetNames,
        rewardedStreetIds,
        coveredNodes,
        traversedEdgeCount,
      );
      if (!connectorAppend) {
        aborted = true;
        break;
      }
      distanceKm += connectorAppend.distanceKm;
      currentNodeId = connectorAppend.nextNodeId;

      runDeadEndSpurSweeps(3);
      runImmediateBranchSweep(2);
      if (distanceKm >= hardMaxKm || distanceKm >= normalizedTargetKm * 1.04) {
        break;
      }
    }
    if (aborted) {
      break;
    }

    const targetEdge = graph.edges.get(move.targetStep.edgeId);
    if (!targetEdge) {
      break;
    }
    if (
      distanceKm + targetEdge.distanceKm > hardMaxKm &&
      distanceKm >= normalizedTargetKm * 0.55
    ) {
      break;
    }

    const targetAppend = applyTraversalStep(
      graph,
      move.targetStep,
      routePoints,
      completedByStreetId,
      coveredStreetIds,
      coveredStreetNames,
      rewardedStreetIds,
      coveredNodes,
      traversedEdgeCount,
    );
    if (!targetAppend) {
      break;
    }
    distanceKm += targetAppend.distanceKm;
    currentNodeId = targetAppend.nextNodeId;

    runDeadEndSpurSweeps(3);
    runImmediateBranchSweep(2);

    if (distanceKm >= normalizedTargetKm * 1.03 && rewardedStreetIds.size > 0) {
      break;
    }
  }

  if (routePoints.length < 2 || coveredStreetIds.size === 0) {
    return null;
  }

  const availableNodes = Array.from(graph.nodes.values()).map((node) => ({
    id: node.id,
    point: node.point,
  }));
  const coveredNodeIds = coveredNodeIdsForPath(routePoints, availableNodes);
  const coveredNodePoints = coveredNodeIds
    .map((id) => graph.nodes.get(id)?.point)
    .filter((point): point is LatLng => point !== undefined);

  const miles = distanceKm * 0.621371;
  return {
    id: `route-${crypto.randomUUID()}`,
    name: `Efficient Coverage Plan (${miles.toFixed(1)} mi)`,
    points: routePoints,
    streetIds: Array.from(coveredStreetIds),
    streetNames: Array.from(coveredStreetNames),
    distanceKm,
    strategy: "efficient_coverage",
    nodeIdsCovered: coveredNodeIds,
    nodePoints: coveredNodePoints,
    availableNodes,
  };
}

export function buildEulerianRoute(
  streets: StreetSegment[],
  home: LatLng,
  targetKm: number,
  cityBounds: CityBounds | null = null,
): SuggestedRoute | null {
  return buildEfficientCoverageRoute(streets, home, targetKm, cityBounds);
}

export function routeToGPX(route: SuggestedRoute): string {
  const trkpts = route.points
    .map(
      (point) =>
        `<trkpt lat="${point.lat.toFixed(6)}" lon="${point.lon.toFixed(6)}"></trkpt>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="StreetSprint Planner" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(route.name)}</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>${escapeXml(route.name)}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
}

export function routeToAML(route: SuggestedRoute): string {
  const points = route.points
    .map(
      (point, index) =>
        `    <point idx="${index + 1}" lat="${point.lat.toFixed(6)}" lon="${point.lon.toFixed(6)}" />`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<aml version="1.0">
  <metadata>
    <name>${escapeXml(route.name)}</name>
    <created>${new Date().toISOString()}</created>
    <distance_km>${route.distanceKm.toFixed(3)}</distance_km>
    <nodes_completed>${route.nodeIdsCovered.length}</nodes_completed>
  </metadata>
  <route>
${points}
  </route>
</aml>`;
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function buildDirectAppRouteUrl(
  route: SuggestedRoute,
  app: IntegrationKey,
): string | null {
  if (route.points.length < 2) {
    return null;
  }

  if (app === "google_maps") {
    const origin = route.points[0];
    const destination = route.points[route.points.length - 1];
    const middle = route.points
      .slice(1, route.points.length - 1)
      .filter(
        (_, index) =>
          index % Math.max(1, Math.ceil(route.points.length / 10)) === 0,
      )
      .slice(0, 10)
      .map((point) => `${point.lat},${point.lon}`)
      .join("|");

    const waypoints = middle.length > 0 ? `&waypoints=${encodeURIComponent(middle)}` : "";

    return `https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=${origin.lat},${origin.lon}&destination=${destination.lat},${destination.lon}${waypoints}`;
  }

  if (app === "apple_maps") {
    const origin = route.points[0];
    const destination = route.points[route.points.length - 1];
    return `https://maps.apple.com/?saddr=${origin.lat},${origin.lon}&daddr=${destination.lat},${destination.lon}&dirflg=w`;
  }

  return null;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function boundsFromPoints(points: LatLng[]): Bounds {
  return calculateBoundingBox(points);
}

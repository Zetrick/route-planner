"use client";

import { useEffect, useMemo, useState } from "react";
import L, { type DivIcon } from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import { NODE_CAPTURE_RADIUS_METERS } from "@/app/lib/planner-engine";

type LatLng = {
  lat: number;
  lon: number;
};

type StreetSegment = {
  id: string;
  name: string;
  path: LatLng[];
  startNodeId?: string;
  endNodeId?: string;
  completed: boolean;
  source: "osm" | "manual";
};

type CityBounds = {
  south: number;
  north: number;
  west: number;
  east: number;
};

type RouteNode = {
  id: string;
  point: LatLng;
};

type SuggestedRoute = {
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

type StreetNode = {
  id: string;
  point: LatLng;
  totalEdges: number;
  completedEdges: number;
  streetNames: string[];
  sourceTypes: Array<StreetSegment["source"]>;
};

const SATELLITE_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const LABEL_TILE_URL =
  "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
const TILE_ATTRIBUTION =
  "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS community";

function compactNumber(value: number): string {
  return Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 100 ? 0 : 1,
  }).format(value);
}

function sampleEvery<T>(list: T[], maxItems: number): T[] {
  if (list.length <= maxItems) {
    return list;
  }
  const stride = Math.ceil(list.length / maxItems);
  return list.filter((_, index) => index % stride === 0);
}

function haversineKm(a: LatLng, b: LatLng): number {
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

function polylineDistanceKm(path: LatLng[]): number {
  if (path.length < 2) {
    return 0;
  }
  let total = 0;
  for (let i = 1; i < path.length; i += 1) {
    total += haversineKm(path[i - 1], path[i]);
  }
  return total;
}

function toMeters(
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

function distancePointToSegmentMeters(p: LatLng, a: LatLng, b: LatLng): number {
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

function distancePointToPathMeters(point: LatLng, path: LatLng[]): number {
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

function coveredNodeIdsForPath(points: LatLng[], nodes: RouteNode[]): string[] {
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

function updateRouteAfterDrag(route: SuggestedRoute, nextPoints: LatLng[]): SuggestedRoute {
  const distanceKm = polylineDistanceKm(nextPoints);
  const coveredNodeIds = coveredNodeIdsForPath(nextPoints, route.availableNodes);
  const availableNodeMap = new Map(route.availableNodes.map((node) => [node.id, node]));
  const nodePoints = coveredNodeIds
    .map((id) => availableNodeMap.get(id)?.point)
    .filter((point): point is LatLng => point !== undefined);

  return {
    ...route,
    points: nextPoints,
    distanceKm,
    nodeIdsCovered: coveredNodeIds,
    nodePoints,
    name: `Efficient Coverage Plan (${(distanceKm * 0.621371).toFixed(1)} mi)`,
  };
}

function latLngTuple(point: LatLng): [number, number] {
  return [point.lat, point.lon];
}

function nodeIdForStreetEndpoint(
  street: StreetSegment,
  endpoint: "start" | "end",
): string {
  if (endpoint === "start") {
    return street.startNodeId ?? `${street.path[0].lat.toFixed(5)},${street.path[0].lon.toFixed(5)}`;
  }

  return (
    street.endNodeId ??
    `${street.path[street.path.length - 1].lat.toFixed(5)},${street.path[street.path.length - 1].lon.toFixed(5)}`
  );
}

function isRunnableStreetForNodes(street: StreetSegment): boolean {
  if (street.path.length < 2) {
    return false;
  }

  const name = street.name.trim();
  if (!name) {
    return false;
  }

  const normalizedName = name.toLowerCase();
  if (normalizedName === "unnamed road" || normalizedName === "unnamed street") {
    return false;
  }

  return true;
}

function isPointInsideBounds(point: LatLng, bounds: CityBounds): boolean {
  const latPadding = 40 / 111_320;
  const midLat = (bounds.south + bounds.north) / 2;
  const lonScale = Math.max(0.15, Math.cos((midLat * Math.PI) / 180));
  const lonPadding = 40 / (111_320 * lonScale);
  return (
    point.lat >= bounds.south - latPadding &&
    point.lat <= bounds.north + latPadding &&
    point.lon >= bounds.west - lonPadding &&
    point.lon <= bounds.east + lonPadding
  );
}

function isStreetInsideBounds(street: StreetSegment, bounds: CityBounds): boolean {
  if (street.path.length < 2) {
    return false;
  }

  const start = street.path[0];
  const end = street.path[street.path.length - 1];
  return isPointInsideBounds(start, bounds) && isPointInsideBounds(end, bounds);
}

function buildStreetNodeSummary(streets: StreetSegment[]): StreetNode[] {
  const nodes = new Map<
    string,
    {
      id: string;
      point: LatLng;
      totalEdges: number;
      completedEdges: number;
      streetNames: Set<string>;
      sourceTypes: Set<StreetSegment["source"]>;
    }
  >();

  for (const street of streets) {
    if (!isRunnableStreetForNodes(street)) {
      continue;
    }

    const endpoints: Array<{ id: string; point: LatLng }> = [
      {
        id: nodeIdForStreetEndpoint(street, "start"),
        point: street.path[0],
      },
      {
        id: nodeIdForStreetEndpoint(street, "end"),
        point: street.path[street.path.length - 1],
      },
    ];

    for (const endpoint of endpoints) {
      const existing = nodes.get(endpoint.id);
      if (existing) {
        existing.totalEdges += 1;
        if (street.completed) {
          existing.completedEdges += 1;
        }
        existing.streetNames.add(street.name);
        existing.sourceTypes.add(street.source);
        continue;
      }

      nodes.set(endpoint.id, {
        id: endpoint.id,
        point: endpoint.point,
        totalEdges: 1,
        completedEdges: street.completed ? 1 : 0,
        streetNames: new Set([street.name]),
        sourceTypes: new Set([street.source]),
      });
    }
  }

  return Array.from(nodes.values()).map((node) => ({
    id: node.id,
    point: node.point,
    totalEdges: node.totalEdges,
    completedEdges: node.completedEdges,
    streetNames: Array.from(node.streetNames).sort(),
    sourceTypes: Array.from(node.sourceTypes),
  }));
}

function formatNodeId(nodeId: string): string {
  return nodeId.startsWith("osm-node-") ? nodeId.slice("osm-node-".length) : nodeId;
}

function formatCoord(value: number): string {
  return value.toFixed(6);
}

function NodePopupInfo({
  node,
  covered,
}: {
  node: StreetNode;
  covered?: boolean;
}) {
  const nodeType = node.totalEdges > 1 ? "Intersection" : "Endpoint";
  const sourceLabel =
    node.sourceTypes.length > 1
      ? "OSM + imported"
      : node.sourceTypes[0] === "osm"
        ? "OSM"
        : "Imported";
  const completionLabel =
    node.completedEdges >= node.totalEdges ? "Complete" : "Open";
  const routeCoverageLabel =
    covered === undefined ? null : covered ? "Covered by active route" : "Not yet covered";

  return (
    <div className="node-popup">
      <strong>{nodeType} Node</strong>
      <div>ID: {formatNodeId(node.id)}</div>
      <div>
        Lat/Lon: {formatCoord(node.point.lat)}, {formatCoord(node.point.lon)}
      </div>
      <div>
        Connected streets: {node.totalEdges} ({node.completedEdges} completed)
      </div>
      <div>Street status: {completionLabel}</div>
      {routeCoverageLabel && <div>Route status: {routeCoverageLabel}</div>}
      <div>Source: {sourceLabel}</div>
      <div>
        Streets:{" "}
        {node.streetNames.length > 0
          ? node.streetNames.slice(0, 4).join(", ")
          : "Unknown"}
      </div>
    </div>
  );
}

function FitMapToPoints({
  points,
  fitToken,
  maxZoom = 17,
}: {
  points: LatLng[];
  fitToken: string;
  maxZoom?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) {
      return;
    }
    const bounds = L.latLngBounds(points.map(latLngTuple));
    map.fitBounds(bounds, {
      padding: [24, 24],
      maxZoom,
    });
  }, [map, points, fitToken, maxZoom]);

  return null;
}

export function StreetNetworkMapWidget({
  streets,
  cityBounds,
}: {
  streets: StreetSegment[];
  cityBounds: CityBounds | null;
}) {
  const runnableStreets = useMemo(
    () =>
      streets.filter(
        (street) =>
          isRunnableStreetForNodes(street) &&
          (!cityBounds || isStreetInsideBounds(street, cityBounds)),
      ),
    [streets, cityBounds],
  );

  const sampledStreetPaths = useMemo(() => {
    const paths = runnableStreets.map((street) => street.path);
    return sampleEvery(paths, 1800);
  }, [runnableStreets]);

  const nodeSummary = useMemo(
    () => buildStreetNodeSummary(runnableStreets),
    [runnableStreets],
  );

  const visibleNodes = useMemo(() => sampleEvery(nodeSummary, 2800), [nodeSummary]);
  const filteredStreetCount = streets.length - runnableStreets.length;

  const completedNodeCount = useMemo(
    () =>
      nodeSummary.filter(
        (node) => node.totalEdges > 0 && node.completedEdges >= node.totalEdges,
      ).length,
    [nodeSummary],
  );

  const fitPoints = useMemo(() => {
    const points: LatLng[] = [];
    for (const path of sampledStreetPaths) {
      points.push(path[0], path[path.length - 1]);
    }
    return points;
  }, [sampledStreetPaths]);

  return (
    <div className="network-map-wrap">
      <div className="network-map-toolbar">
        <span>
          Nodes: {compactNumber(nodeSummary.length)} total, {" "}
          {compactNumber(completedNodeCount)} fully complete
        </span>
      </div>

      <MapContainer
        center={fitPoints[0] ? latLngTuple(fitPoints[0]) : [40.7128, -74.006]}
        zoom={13}
        className="route-map network-map"
        scrollWheelZoom
      >
        <TileLayer attribution={TILE_ATTRIBUTION} url={SATELLITE_TILE_URL} />
        <TileLayer attribution={TILE_ATTRIBUTION} url={LABEL_TILE_URL} opacity={0.9} />

        <FitMapToPoints
          fitToken={`streets-${runnableStreets.length}`}
          points={fitPoints}
          maxZoom={16}
        />

        {sampledStreetPaths.map((path, index) => (
          <Polyline
            key={`network-street-${index}`}
            positions={path.map(latLngTuple)}
            pathOptions={{
              color: "rgba(0, 226, 255, 0.95)",
              weight: 2.4,
              opacity: 0.85,
            }}
          />
        ))}

        {visibleNodes.map((node) => {
          const complete = node.totalEdges > 0 && node.completedEdges >= node.totalEdges;
          return (
            <CircleMarker
              key={node.id}
              center={latLngTuple(node.point)}
              radius={complete ? 4.4 : 3.2}
            pathOptions={{
              color: complete ? "#6af3a5" : "#eef6ff",
              fillColor: complete ? "#6af3a5" : "#00d8ff",
              fillOpacity: complete ? 0.92 : 0.9,
              weight: 1.4,
            }}
            >
              <Popup>
                <NodePopupInfo node={node} />
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <p className="help-text">
        Blue lines are runnable street segments; blue nodes are open and green nodes are complete.
        Click any node for details. {filteredStreetCount > 0 ? `${filteredStreetCount} non-runnable segments were hidden.` : ""}
      </p>
    </div>
  );
}

export function RouteMapEditorWidget({
  streets,
  cityBounds,
  route,
  onRouteChange,
}: {
  streets: StreetSegment[];
  cityBounds: CityBounds | null;
  route: SuggestedRoute;
  onRouteChange: (route: SuggestedRoute) => void;
}) {
  const [draftPoints, setDraftPoints] = useState<LatLng[]>(route.points);
  const runnableStreets = useMemo(
    () =>
      streets.filter(
        (street) =>
          isRunnableStreetForNodes(street) &&
          (!cityBounds || isStreetInsideBounds(street, cityBounds)),
      ),
    [streets, cityBounds],
  );

  const sampledStreetPaths = useMemo(() => {
    const paths = runnableStreets.map((street) => street.path);
    return sampleEvery(paths, 1400);
  }, [runnableStreets]);

  const nodeSummary = useMemo(
    () => buildStreetNodeSummary(runnableStreets),
    [runnableStreets],
  );

  const nodeSummaryById = useMemo(
    () => new Map(nodeSummary.map((node) => [node.id, node])),
    [nodeSummary],
  );

  const controlIndices = useMemo(() => {
    if (draftPoints.length < 2) {
      return [];
    }
    const step = Math.max(1, Math.floor(draftPoints.length / 20));
    const indices = new Set<number>([0, draftPoints.length - 1]);
    for (let i = step; i < draftPoints.length - 1; i += step) {
      indices.add(i);
    }
    return Array.from(indices).sort((a, b) => a - b);
  }, [draftPoints.length]);

  const visibleNodes = useMemo(() => {
    const routeNodesOnRunnableStreets = route.availableNodes.filter((node) =>
      nodeSummaryById.has(node.id),
    );
    return sampleEvery(routeNodesOnRunnableStreets, 1200);
  }, [route.availableNodes, nodeSummaryById]);

  const coveredNodeSet = useMemo(
    () => new Set(route.nodeIdsCovered),
    [route.nodeIdsCovered],
  );

  const fitPoints = useMemo(() => {
    const points = [...draftPoints];
    for (const path of sampledStreetPaths) {
      points.push(path[0], path[path.length - 1]);
    }
    return points;
  }, [draftPoints, sampledStreetPaths]);

  const handleIcon: DivIcon = useMemo(
    () =>
      L.divIcon({
        className: "route-handle-icon",
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      }),
    [],
  );

  return (
    <div className="map-editor-wrap">
      <MapContainer
        center={fitPoints[0] ? latLngTuple(fitPoints[0]) : [40.7128, -74.006]}
        zoom={14}
        className="route-map"
        scrollWheelZoom
      >
        <TileLayer attribution={TILE_ATTRIBUTION} url={SATELLITE_TILE_URL} />
        <TileLayer attribution={TILE_ATTRIBUTION} url={LABEL_TILE_URL} opacity={0.92} />

        <FitMapToPoints
          fitToken={`route-${route.id}`}
          points={fitPoints}
          maxZoom={17}
        />

        {sampledStreetPaths.map((path, index) => (
          <Polyline
            key={`street-${index}`}
            positions={path.map(latLngTuple)}
            pathOptions={{
              color: "#00d8ff",
              opacity: 0.45,
              weight: 2,
            }}
          />
        ))}

        {visibleNodes.map((node) => {
          const nodeDetails = nodeSummaryById.get(node.id);
          if (!nodeDetails) {
            return null;
          }

          const covered = coveredNodeSet.has(node.id);
          return (
            <CircleMarker
              key={node.id}
              center={latLngTuple(node.point)}
              radius={covered ? 4.4 : 2.8}
              pathOptions={{
                color: covered ? "#6af3a5" : "#d6dde5",
                fillColor: covered ? "#6af3a5" : "#8b95a0",
                fillOpacity: covered ? 0.92 : 0.85,
                weight: 1.2,
              }}
            >
              <Popup>
                <NodePopupInfo node={nodeDetails} covered={covered} />
              </Popup>
            </CircleMarker>
          );
        })}

        <Polyline
          positions={draftPoints.map(latLngTuple)}
          pathOptions={{
            color: "#ff9f45",
            weight: 4.4,
            opacity: 0.95,
          }}
        />

        {controlIndices.map((index) => {
          const point = draftPoints[index];
          return (
            <Marker
              key={`control-${index}`}
              position={latLngTuple(point)}
              icon={handleIcon}
              draggable
              eventHandlers={{
                drag: (event) => {
                  const target = event.target as L.Marker;
                  const latLng = target.getLatLng();
                  setDraftPoints((previous) => {
                    const next = [...previous];
                    next[index] = { lat: latLng.lat, lon: latLng.lng };
                    return next;
                  });
                },
                dragend: () => {
                  setDraftPoints((previous) => {
                    const updated = [...previous];
                    onRouteChange(updateRouteAfterDrag(route, updated));
                    return updated;
                  });
                },
              }}
            />
          );
        })}
      </MapContainer>

      <div className="map-hint-row">
        <span>
          Blue lines are runnable street segments. Gray nodes are not covered yet; green nodes are covered.
          The orange line is your active plan. Nodes within 20 ft of your route count as covered.
          Drag cyan handles to adjust the route.
        </span>
        <span>
          Draft distance: {compactNumber(polylineDistanceKm(draftPoints) * 0.621371)} mi
        </span>
      </div>
    </div>
  );
}

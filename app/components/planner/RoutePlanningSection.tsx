"use client";

import dynamic from "next/dynamic";
import {
  compactNumber,
  type CityBounds,
  type StreetSegment,
  type SuggestedRoute,
} from "@/app/lib/planner-engine";
import RouteSparkline from "./RouteSparkline";

type RoutePlanningSectionProps = {
  streets: StreetSegment[];
  cityBounds: CityBounds | null;
  targetMiles: number;
  maxSliderMiles: number;
  onTargetMilesChange: (value: number) => void;
  onGenerateRoute: () => void;
  activeRoute: SuggestedRoute | null;
  suggestions: SuggestedRoute[];
  preferredIntegrationLabel: string;
  onOpenInPreferredApp: (route: SuggestedRoute) => void;
  onDownloadGpx: (route: SuggestedRoute) => void;
  onDownloadAml: (route: SuggestedRoute) => void;
  onMarkSuggestedAsDone: (route: SuggestedRoute) => void;
  onRouteChange: (route: SuggestedRoute) => void;
  onSelectRoute: (routeId: string) => void;
};

const mapLoadingFallback = () => (
  <div className="route-map map-loading">Loading satellite map...</div>
);

const RouteMapEditor = dynamic(
  () =>
    import("../leaflet-map-widgets").then(
      (mod) => mod.RouteMapEditorWidget,
    ),
  {
    ssr: false,
    loading: mapLoadingFallback,
  },
);

export default function RoutePlanningSection({
  streets,
  cityBounds,
  targetMiles,
  maxSliderMiles,
  onTargetMilesChange,
  onGenerateRoute,
  activeRoute,
  suggestions,
  preferredIntegrationLabel,
  onOpenInPreferredApp,
  onDownloadGpx,
  onDownloadAml,
  onMarkSuggestedAsDone,
  onRouteChange,
  onSelectRoute,
}: RoutePlanningSectionProps) {
  return (
    <>
      <section className="card planner-panel">
        <div>
          <h3>4) Efficient Coverage Route Planner</h3>
          <p>
            Drag the mileage slider to optimize node completion for your target run distance.
          </p>
        </div>

        <div className="slider-wrap">
          <label>
            Target mileage: <strong>{targetMiles.toFixed(1)} miles</strong>
          </label>
          <input
            type="range"
            min={1}
            max={maxSliderMiles}
            step={0.25}
            value={targetMiles}
            onChange={(event) =>
              onTargetMilesChange(Number.parseFloat(event.target.value))
            }
          />
          <div className="slider-labels">
            <span>1 mi</span>
            <span className="slider-separator" aria-hidden="true">
              -
            </span>
            <span>{maxSliderMiles} mi</span>
          </div>
        </div>

        <button className="btn btn-primary" onClick={onGenerateRoute}>
          Generate Efficient Coverage Route
        </button>
      </section>

      {activeRoute && (
        <section className="card map-panel">
          <div className="map-panel-head">
            <div>
              <h3>Plan Route Map</h3>
              <p>
                {compactNumber(activeRoute.distanceKm * 0.621371)} mi,{" "}
                {compactNumber(activeRoute.nodeIdsCovered.length)} nodes,{" "}
                {compactNumber(activeRoute.streetIds.length)} street segments
              </p>
            </div>
            <div className="button-row">
              <button
                className="btn btn-soft"
                onClick={() => onOpenInPreferredApp(activeRoute)}
              >
                Open in {preferredIntegrationLabel}
              </button>
              <button
                className="btn btn-soft"
                onClick={() => onDownloadGpx(activeRoute)}
              >
                Download .gpx
              </button>
              <button
                className="btn btn-soft"
                onClick={() => onDownloadAml(activeRoute)}
              >
                Download .aml
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => onMarkSuggestedAsDone(activeRoute)}
              >
                Mark streets done
              </button>
            </div>
          </div>

          <RouteMapEditor
            key={activeRoute.id}
            streets={streets}
            cityBounds={cityBounds}
            route={activeRoute}
            onRouteChange={onRouteChange}
          />
        </section>
      )}

      {suggestions.length > 0 && (
        <section className="route-results">
          {suggestions.map((route) => (
            <article className="card route-card" key={route.id}>
              <div>
                <p className="card-label">Suggested Route</p>
                <h3>{route.name}</h3>
                <p>
                  {compactNumber(route.distanceKm * 0.621371)} mi •{" "}
                  {compactNumber(route.nodeIdsCovered.length)} nodes •{" "}
                  {compactNumber(route.streetIds.length)} segments
                </p>
              </div>
              <RouteSparkline points={route.points} />
              <div className="button-row">
                <button
                  className="btn btn-primary"
                  onClick={() => onSelectRoute(route.id)}
                >
                  Plan Route
                </button>
                <button
                  className="btn btn-soft"
                  onClick={() => onOpenInPreferredApp(route)}
                >
                  Open in app
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </>
  );
}

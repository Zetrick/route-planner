"use client";

import dynamic from "next/dynamic";
import type { ChangeEvent } from "react";
import {
  INTEGRATIONS,
  type CityBounds,
  type IntegrationKey,
  type PlannerState,
} from "@/app/lib/planner-engine";

type HeroStat = {
  label: string;
  value: string;
  hint: string;
};

type DashboardSetupSectionProps = {
  heroStats: HeroStat[];
  planner: PlannerState;
  loadingCity: boolean;
  preferredIntegrationLabel: string;
  preferredIntegrationSupportsDirectRoute: boolean;
  onCityQueryChange: (value: string) => void;
  onLoadCity: () => void;
  onImportStreetFile: (event: ChangeEvent<HTMLInputElement>) => void;
  onImportActivityFile: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearCompletion: () => void;
  onHomeLatInput: (value: string) => void;
  onHomeLonInput: (value: string) => void;
  onPreferredAppChange: (value: IntegrationKey) => void;
  cityBounds: CityBounds | null;
};

const mapLoadingFallback = () => (
  <div className="route-map map-loading">Loading satellite map...</div>
);

const StreetNetworkMap = dynamic(
  () =>
    import("../leaflet-map-widgets").then(
      (mod) => mod.StreetNetworkMapWidget,
    ),
  {
    ssr: false,
    loading: mapLoadingFallback,
  },
);

export default function DashboardSetupSection({
  heroStats,
  planner,
  loadingCity,
  preferredIntegrationLabel,
  preferredIntegrationSupportsDirectRoute,
  onCityQueryChange,
  onLoadCity,
  onImportStreetFile,
  onImportActivityFile,
  onClearCompletion,
  onHomeLatInput,
  onHomeLonInput,
  onPreferredAppChange,
  cityBounds,
}: DashboardSetupSectionProps) {
  const streetCount = planner.streets.length;

  return (
    <>
      <section className="stats-grid">
        {heroStats.map((stat) => (
          <article key={stat.label} className="card stat-card">
            <p className="card-label">{stat.label}</p>
            <p className="stat-value">{stat.value}</p>
            <p>{stat.hint}</p>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="card panel">
          <h3>1) Load Street Network</h3>
          <p>Use OpenStreetMap city import with fallback handling for timeout-prone queries.</p>
          <label>
            City Query
            <input
              value={planner.cityQuery}
              onChange={(event) => onCityQueryChange(event.target.value)}
              placeholder="San Luis Obispo, CA"
            />
          </label>

          <div className="button-row">
            <button
              className="btn btn-primary"
              onClick={onLoadCity}
              disabled={loadingCity}
            >
              {loadingCity ? "Loading OSM..." : "Fetch from OSM"}
            </button>
            <label className="btn btn-soft file-btn">
              Import streets
              <input
                type="file"
                accept=".csv,.json,.geojson,.txt"
                onChange={onImportStreetFile}
              />
            </label>
          </div>
          <p className="help-text">
            CSV: <code>name,start_lat,start_lon,end_lat,end_lon</code>
          </p>
        </article>

        <article className="card panel">
          <h3>2) Import Completed Runs</h3>
          <p>
            Upload GPX/TCX/JSON/CSV routes from Strava, Runkeeper, Garmin, or Komoot exports.
          </p>
          <label className="btn btn-soft file-btn file-btn-wide">
            Import activity file
            <input
              type="file"
              accept=".gpx,.tcx,.xml,.json,.geojson,.csv,.txt"
              onChange={onImportActivityFile}
            />
          </label>
          <button className="btn btn-ghost" onClick={onClearCompletion}>
            Reset completion marks
          </button>
        </article>

        <article className="card panel">
          <h3>3) App + Home Settings</h3>
          <div className="field-grid two-col">
            <label>
              Home Latitude
              <input
                value={planner.home.lat}
                onChange={(event) => onHomeLatInput(event.target.value)}
              />
            </label>
            <label>
              Home Longitude
              <input
                value={planner.home.lon}
                onChange={(event) => onHomeLonInput(event.target.value)}
              />
            </label>
          </div>
          <label>
            Preferred App
            <select
              value={planner.preferredApp}
              onChange={(event) =>
                onPreferredAppChange(event.target.value as IntegrationKey)
              }
            >
              {INTEGRATIONS.map((integration) => (
                <option key={integration.key} value={integration.key}>
                  {integration.label}
                </option>
              ))}
            </select>
          </label>
          <p className="help-text">
            {preferredIntegrationSupportsDirectRoute
              ? `${preferredIntegrationLabel} supports direct URL route launch.`
              : `${preferredIntegrationLabel} will open with GPX download for import.`}
          </p>
        </article>
      </section>

      {streetCount > 0 && (
        <section className="card network-panel">
          <div className="map-panel-head">
            <div>
              <h3>Street Network Map</h3>
              <p>Explore loaded streets and nodes before planning routes.</p>
            </div>
          </div>
          <StreetNetworkMap streets={planner.streets} cityBounds={cityBounds} />
        </section>
      )}
    </>
  );
}

# StreetSprint (City Strides Route Planner)

StreetSprint is a Next.js web app for planning efficient “run every street” routes with local-only auth and no required backend.

## Core features

- Professional landing + dashboard UI (desktop + mobile optimized)
- Local auth/session:
  - users stored in `localStorage`
  - active session in browser cookie
- Street data loading:
  - OpenStreetMap import by city query
  - Overpass endpoint failover + fallback bbox query for timeout-prone cities
  - manual import (`.csv`, `.json`, `.geojson`)
- Activity import (to mark completion):
  - `.gpx`, `.tcx`, `.xml`, `.json`, `.geojson`, `.csv`
- Eulerian route planning:
  - mileage slider target
  - route generation optimized for high node coverage per run distance
- Plan Route map:
  - route line + node visualization
  - draggable route handles to alter geometry
  - live distance + node coverage update
- Route delivery:
  - direct launch for Google Maps / Apple Maps
  - GPX handoff flow for Strava/Runkeeper/Garmin/Komoot
  - export `.gpx` and `.aml`

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Street CSV format

```csv
name,start_lat,start_lon,end_lat,end_lon
Main St,39.9621,-82.9988,39.9652,-82.9951
Oak Ave,39.9601,-82.9940,39.9582,-82.9893
```

## Notes

- This is an MVP and currently uses file-based import for Strava/Runkeeper instead of OAuth.
- Node/segment completion from imported activities is geometry-based and approximate.
- OSM quality and completeness depend on OpenStreetMap coverage for the selected city.

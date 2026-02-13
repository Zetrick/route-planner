"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import {
  DEFAULT_HOME,
  DEFAULT_PLANNER,
  INTEGRATIONS,
  SESSION_COOKIE,
  buildDirectAppRouteUrl,
  buildEfficientCoverageRoute,
  compactNumber,
  clearCookie,
  dedupeByName,
  downloadTextFile,
  getCookie,
  getUsers,
  hashPin,
  loadStreetsFromOSM,
  matchActivityToStreets,
  normalizeStreetName,
  parseActivityPoints,
  parseStreetDataset,
  plannerKey,
  polylineDistanceKm,
  routeToAML,
  routeToGPX,
  saveUsers,
  setCookie,
  slugify,
  type CityBounds,
  type IntegrationKey,
  type Message,
  type MessageTone,
  type PlannerState,
  type StreetSegment,
  type SuggestedRoute,
} from "@/app/lib/planner-engine";
import CompletionSection from "./CompletionSection";
import DashboardSetupSection from "./DashboardSetupSection";
import LandingContent from "./LandingContent";
import PlannerTopbar from "./PlannerTopbar";
import RoutePlanningSection from "./RoutePlanningSection";

export default function PlannerApp() {
  const [usernameInput, setUsernameInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [activeUsername, setActiveUsername] = useState<string | null>(null);
  const [planner, setPlanner] = useState<PlannerState>(DEFAULT_PLANNER);
  const [plannerReady, setPlannerReady] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [loadingCity, setLoadingCity] = useState(false);
  const [targetMiles, setTargetMiles] = useState(3);
  const [suggestions, setSuggestions] = useState<SuggestedRoute[]>([]);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);

  const loggedIn = activeUsername !== null;

  useEffect(() => {
    const session = getCookie(SESSION_COOKIE);
    if (!session) {
      return;
    }

    const users = getUsers();
    if (!users[session]) {
      clearCookie(SESSION_COOKIE);
      return;
    }

    setActiveUsername(session);
  }, []);

  useEffect(() => {
    if (!activeUsername) {
      setPlanner(DEFAULT_PLANNER);
      setPlannerReady(false);
      setSuggestions([]);
      setActiveRouteId(null);
      return;
    }

    const raw = window.localStorage.getItem(plannerKey(activeUsername));
    if (!raw) {
      setPlanner(DEFAULT_PLANNER);
      setPlannerReady(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as PlannerState;
      setPlanner({
        streets: Array.isArray(parsed.streets) ? parsed.streets : [],
        preferredApp:
          INTEGRATIONS.some((integration) => integration.key === parsed.preferredApp)
            ? parsed.preferredApp
            : "google_maps",
        home:
          parsed.home &&
          Number.isFinite(parsed.home.lat) &&
          Number.isFinite(parsed.home.lon)
            ? parsed.home
            : DEFAULT_HOME,
        cityQuery: typeof parsed.cityQuery === "string" ? parsed.cityQuery : "",
        cityBounds:
          parsed.cityBounds &&
          Number.isFinite(parsed.cityBounds.south) &&
          Number.isFinite(parsed.cityBounds.north) &&
          Number.isFinite(parsed.cityBounds.west) &&
          Number.isFinite(parsed.cityBounds.east) &&
          parsed.cityBounds.south < parsed.cityBounds.north &&
          parsed.cityBounds.west < parsed.cityBounds.east
            ? parsed.cityBounds
            : null,
      });
    } catch {
      setPlanner(DEFAULT_PLANNER);
    }

    setPlannerReady(true);
  }, [activeUsername]);

  useEffect(() => {
    if (!activeUsername || !plannerReady) {
      return;
    }

    window.localStorage.setItem(plannerKey(activeUsername), JSON.stringify(planner));

    const users = getUsers();
    const existing = users[activeUsername];
    if (existing) {
      users[activeUsername] = {
        ...existing,
        preferredApp: planner.preferredApp,
      };
      saveUsers(users);
    }
  }, [activeUsername, planner, plannerReady]);

  const streetCount = planner.streets.length;
  const completedCount = planner.streets.filter((street) => street.completed).length;
  const completionPct = streetCount === 0 ? 0 : (completedCount / streetCount) * 100;

  const preferredIntegration = INTEGRATIONS.find(
    (integration) => integration.key === planner.preferredApp,
  );

  const milesRemaining = useMemo(() => {
    const remainingKm = planner.streets
      .filter((street) => !street.completed)
      .reduce((sum, street) => sum + polylineDistanceKm(street.path), 0);
    return remainingKm * 0.621371;
  }, [planner.streets]);

  const unfinishedCount = streetCount - completedCount;

  const activeRoute = useMemo(
    () => suggestions.find((route) => route.id === activeRouteId) ?? null,
    [suggestions, activeRouteId],
  );

  const setStatus = (tone: MessageTone, text: string) => {
    setMessage({ tone, text });
  };

  const signInOrCreate = () => {
    const username = usernameInput.trim().toLowerCase();
    const pin = pinInput.trim();

    if (username.length < 3) {
      setStatus("error", "Username must be at least 3 characters.");
      return;
    }
    if (pin.length < 4) {
      setStatus("error", "PIN must be at least 4 characters.");
      return;
    }

    const users = getUsers();
    const existing = users[username];
    const pinHash = hashPin(pin);

    if (existing && existing.pinHash !== pinHash) {
      setStatus("error", "Incorrect PIN for this username.");
      return;
    }

    if (!existing) {
      users[username] = {
        pinHash,
        preferredApp: "google_maps",
        createdAt: new Date().toISOString(),
      };
      saveUsers(users);
      setStatus("success", "New local account created.");
    } else {
      setStatus("success", "Signed in with local session.");
    }

    setActiveUsername(username);
    setCookie(SESSION_COOKIE, username, 30);
    setPinInput("");
  };

  const logout = () => {
    clearCookie(SESSION_COOKIE);
    setActiveUsername(null);
    setPlanner(DEFAULT_PLANNER);
    setSuggestions([]);
    setActiveRouteId(null);
    setStatus("info", "Signed out.");
  };

  const replaceStreetData = (
    incoming: StreetSegment[],
    sourceLabel: string,
    cityBounds: CityBounds | null,
  ) => {
    const completedByName = new Set(
      planner.streets
        .filter((street) => street.completed)
        .map((street) => normalizeStreetName(street.name)),
    );

    const merged = dedupeByName(
      incoming.map((street) => ({
        ...street,
        completed: completedByName.has(normalizeStreetName(street.name)),
      })),
    );

    setPlanner((previous) => ({
      ...previous,
      streets: merged,
      cityBounds,
    }));
    setSuggestions([]);
    setActiveRouteId(null);
    setStatus(
      "success",
      `Loaded ${compactNumber(merged.length)} street segments from ${sourceLabel}${cityBounds ? " (city-limits constrained)." : "."}`,
    );
  };

  const loadCityFromOSM = async () => {
    const city = planner.cityQuery.trim();
    if (!city) {
      setStatus("error", "Enter a city query first (for example: San Luis Obispo, CA). ");
      return;
    }

    setLoadingCity(true);
    setStatus(
      "info",
      "Loading OSM streets with endpoint failover and city-boundary fallback...",
    );

    try {
      const result = await loadStreetsFromOSM(city);
      replaceStreetData(result.streets, result.sourceLabel, result.cityBounds);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unknown network error";
      setStatus("error", `Could not load city from OSM: ${text}`);
    } finally {
      setLoadingCity(false);
    }
  };

  const importStreetFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const streets = parseStreetDataset(text, file.name);
      if (streets.length === 0) {
        setStatus("error", "No valid streets found in the imported file.");
        return;
      }

      replaceStreetData(streets, file.name, null);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unknown import error";
      setStatus("error", `Street import failed: ${text}`);
    }
  };

  const importActivityFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    if (planner.streets.length === 0) {
      setStatus("error", "Load streets first, then import activity files.");
      return;
    }

    try {
      const text = await file.text();
      const points = parseActivityPoints(text, file.name);
      if (points.length < 2) {
        setStatus("error", "Could not parse route points from that activity file.");
        return;
      }

      const matched = matchActivityToStreets(points, planner.streets);
      if (matched.size === 0) {
        setStatus(
          "info",
          "Imported activity but no streets matched. Try a tighter city query or a different file.",
        );
        return;
      }

      setPlanner((previous) => ({
        ...previous,
        streets: previous.streets.map((street) =>
          matched.has(street.id) ? { ...street, completed: true } : street,
        ),
      }));
      setSuggestions([]);
      setActiveRouteId(null);
      setStatus("success", `Matched ${matched.size} street segments from ${file.name}.`);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unknown import error";
      setStatus("error", `Activity import failed: ${text}`);
    }
  };

  const setManualCompletion = (streetId: string, completed: boolean) => {
    setPlanner((previous) => ({
      ...previous,
      streets: previous.streets.map((street) =>
        street.id === streetId ? { ...street, completed } : street,
      ),
    }));
    setSuggestions([]);
    setActiveRouteId(null);
  };

  const clearCompletion = () => {
    setPlanner((previous) => ({
      ...previous,
      streets: previous.streets.map((street) => ({ ...street, completed: false })),
    }));
    setSuggestions([]);
    setActiveRouteId(null);
    setStatus("info", "Reset all completion marks.");
  };

  const generateCoverageRoute = () => {
    if (planner.streets.length === 0) {
      setStatus("error", "Load street data before generating a route.");
      return;
    }

    const targetKm = targetMiles * 1.60934;
    if (!Number.isFinite(targetKm) || targetKm <= 0) {
      setStatus("error", "Set a valid target mileage.");
      return;
    }

    const route = buildEfficientCoverageRoute(
      planner.streets,
      planner.home,
      targetKm,
      planner.cityBounds,
    );
    if (!route) {
      setStatus(
        "error",
        "Could not generate a route for this area. Try a higher mileage or load more streets.",
      );
      return;
    }

    setSuggestions([route]);
    setActiveRouteId(route.id);
    setStatus(
      "success",
      `Generated efficient route: ${compactNumber(route.distanceKm * 0.621371)} miles, ${route.nodeIdsCovered.length} nodes covered.`,
    );
  };

  const updateRoute = (updated: SuggestedRoute) => {
    setSuggestions((previous) =>
      previous.map((route) => (route.id === updated.id ? updated : route)),
    );
    setStatus(
      "info",
      `Route updated: ${compactNumber(updated.distanceKm * 0.621371)} miles, ${updated.nodeIdsCovered.length} nodes covered.`,
    );
  };

  const openInPreferredApp = (route: SuggestedRoute) => {
    const integration = INTEGRATIONS.find((item) => item.key === planner.preferredApp);
    if (!integration) {
      setStatus("error", "Preferred app is not configured.");
      return;
    }

    if (integration.supportsDirectRoute) {
      const url = buildDirectAppRouteUrl(route, integration.key);
      if (!url) {
        setStatus("error", "Could not generate a direct route URL.");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
      setStatus("success", `Opened route in ${integration.label}.`);
      return;
    }

    downloadTextFile(`${slugify(route.name)}.gpx`, routeToGPX(route));
    window.open(integration.launchUrl, "_blank", "noopener,noreferrer");
    setStatus(
      "info",
      `Downloaded GPX and opened ${integration.label}. Import the file there to use the route.`,
    );
  };

  const markSuggestedAsDone = (route: SuggestedRoute) => {
    const ids = new Set(route.streetIds);
    setPlanner((previous) => ({
      ...previous,
      streets: previous.streets.map((street) =>
        ids.has(street.id) ? { ...street, completed: true } : street,
      ),
    }));
    setStatus("success", "Marked route streets as completed.");
  };

  const setCityQuery = (value: string) => {
    setPlanner((previous) => ({
      ...previous,
      cityQuery: value,
    }));
  };

  const setHomeLatInput = (value: string) => {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) {
      return;
    }

    setPlanner((previous) => ({
      ...previous,
      home: {
        ...previous.home,
        lat: parsed,
      },
    }));
  };

  const setHomeLonInput = (value: string) => {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) {
      return;
    }

    setPlanner((previous) => ({
      ...previous,
      home: {
        ...previous.home,
        lon: parsed,
      },
    }));
  };

  const setPreferredApp = (value: IntegrationKey) => {
    setPlanner((previous) => ({
      ...previous,
      preferredApp: value,
    }));
  };

  const downloadRouteGpx = (route: SuggestedRoute) => {
    downloadTextFile(`${slugify(route.name)}.gpx`, routeToGPX(route));
  };

  const downloadRouteAml = (route: SuggestedRoute) => {
    downloadTextFile(`${slugify(route.name)}.aml`, routeToAML(route));
  };

  const heroStats = [
    {
      label: "Coverage",
      value: `${completionPct.toFixed(1)}%`,
      hint: `${compactNumber(completedCount)} of ${compactNumber(streetCount)} segments`,
    },
    {
      label: "Remaining",
      value: `${compactNumber(milesRemaining)} mi`,
      hint: "Estimated unfinished mileage",
    },
    {
      label: "Planned Nodes",
      value: activeRoute ? compactNumber(activeRoute.nodeIdsCovered.length) : "0",
      hint: "Nodes covered by active plan",
    },
  ];

  const topUnfinished = useMemo(
    () => {
      const seen = new Set<string>();
      const names: string[] = [];

      for (const street of planner.streets) {
        if (street.completed) {
          continue;
        }

        const normalized = normalizeStreetName(street.name);
        if (seen.has(normalized)) {
          continue;
        }

        seen.add(normalized);
        names.push(street.name);

        if (names.length >= 12) {
          break;
        }
      }

      return names;
    },
    [planner.streets],
  );

  const maxSliderMiles = 20;
  const preferredIntegrationLabel = preferredIntegration?.label ?? "selected app";
  const preferredIntegrationSupportsDirectRoute =
    preferredIntegration?.supportsDirectRoute ?? false;

  return (
    <div className="app-shell">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <div className="ambient-grid" />

      <main className="main-wrap">
        <PlannerTopbar
          loggedIn={loggedIn}
          activeUsername={activeUsername}
          onLogout={logout}
        />

        {!loggedIn ? (
          <LandingContent
            usernameInput={usernameInput}
            pinInput={pinInput}
            onUsernameChange={setUsernameInput}
            onPinChange={setPinInput}
            onSubmit={signInOrCreate}
          />
        ) : (
          <>
            <DashboardSetupSection
              heroStats={heroStats}
              planner={planner}
              loadingCity={loadingCity}
              preferredIntegrationLabel={preferredIntegrationLabel}
              preferredIntegrationSupportsDirectRoute={
                preferredIntegrationSupportsDirectRoute
              }
              onCityQueryChange={setCityQuery}
              onLoadCity={loadCityFromOSM}
              onImportStreetFile={importStreetFile}
              onImportActivityFile={importActivityFile}
              onClearCompletion={clearCompletion}
              onHomeLatInput={setHomeLatInput}
              onHomeLonInput={setHomeLonInput}
              onPreferredAppChange={setPreferredApp}
              cityBounds={planner.cityBounds}
            />

            <RoutePlanningSection
              streets={planner.streets}
              cityBounds={planner.cityBounds}
              targetMiles={targetMiles}
              maxSliderMiles={maxSliderMiles}
              onTargetMilesChange={setTargetMiles}
              onGenerateRoute={generateCoverageRoute}
              activeRoute={activeRoute}
              suggestions={suggestions}
              preferredIntegrationLabel={preferredIntegrationLabel}
              onOpenInPreferredApp={openInPreferredApp}
              onDownloadGpx={downloadRouteGpx}
              onDownloadAml={downloadRouteAml}
              onMarkSuggestedAsDone={markSuggestedAsDone}
              onRouteChange={updateRoute}
              onSelectRoute={setActiveRouteId}
            />

            <CompletionSection
              unfinishedCount={unfinishedCount}
              topUnfinished={topUnfinished}
              streets={planner.streets}
              onSetManualCompletion={setManualCompletion}
            />
          </>
        )}

        {message && (
          <p className={`status status-${message.tone}`} role="status" aria-live="polite">
            {message.text}
          </p>
        )}
      </main>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { boundsFromPoints, type LatLng } from "@/app/lib/planner-engine";

export default function RouteSparkline({
  points,
  className,
}: {
  points: LatLng[];
  className?: string;
}) {
  const d = useMemo(() => {
    if (points.length < 2) {
      return "";
    }
    const bounds = boundsFromPoints(points);
    const latSpan = Math.max(0.0001, bounds.maxLat - bounds.minLat);
    const lonSpan = Math.max(0.0001, bounds.maxLon - bounds.minLon);

    return points
      .map((point, index) => {
        const x = ((point.lon - bounds.minLon) / lonSpan) * 296 + 12;
        const y = ((bounds.maxLat - point.lat) / latSpan) * 112 + 14;
        return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, [points]);

  return (
    <svg
      viewBox="0 0 320 140"
      className={className ?? "route-sparkline"}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sparkRoute" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d7ff" />
          <stop offset="50%" stopColor="#7cf9a6" />
          <stop offset="100%" stopColor="#ff8f45" />
        </linearGradient>
      </defs>
      <rect width="320" height="140" rx="16" fill="rgba(6, 16, 28, 0.9)" />
      {d && <path d={d} fill="none" stroke="url(#sparkRoute)" strokeWidth="3.2" />}
    </svg>
  );
}

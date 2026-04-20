"use client";

import { useState, useMemo } from "react";
import Graph from "@/app/chart";
import { getCondition, getConditionPalette } from "@/app/lib/conditions";

interface SpeedometerProps {
  value: number;
  trailName: string;
  readings: Array<{ moisture: number; timestamp: number }>;
}

const TIMEFRAMES = {
  "Last 24h": 24 * 60 * 60 * 1000,
  "Last 48h": 48 * 60 * 60 * 1000,
  "Last 7 days": 7 * 24 * 60 * 60 * 1000,
};

const OFFLINE_THRESHOLD = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

export default function Speedometer({
  value: initialValue,
  trailName,
  readings,
}: SpeedometerProps) {
  const [selectedTimeframe, setSelectedTimeframe] =
    useState<keyof typeof TIMEFRAMES>("Last 24h");

  const filteredReadings = useMemo(() => {
    const now = Date.now();
    const timeframeMs = TIMEFRAMES[selectedTimeframe];
    // readings arrive pre-sorted ascending from the page; just filter
    return readings.filter((reading) => now - reading.timestamp <= timeframeMs);
  }, [readings, selectedTimeframe]);

  const latestReading = useMemo(() => {
    return readings.length > 0 ? readings[readings.length - 1] : null;
  }, [readings]);

  const latestValue = useMemo(() => {
    return latestReading?.moisture ?? initialValue;
  }, [latestReading, initialValue]);

  const condition = getCondition(latestValue);

  const getNextUpdateTime = (lastTimestamp: number) => {
    const nextUpdate = lastTimestamp + 6 * 60 * 60 * 1000; // 6 hours after last update
    const timeUntilNext = nextUpdate - Date.now();

    if (timeUntilNext <= 0) return "0 minutes";

    const totalMinutes = Math.ceil(timeUntilNext / (60 * 1000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const isOffline = useMemo(() => {
    if (!latestReading) {
      return true;
    }
    return Date.now() - latestReading.timestamp > OFFLINE_THRESHOLD;
  }, [latestReading]);

  const lastUpdateTime = latestReading
    ? new Date(latestReading.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

  return (
    <article className="hud-card hud-card-hover p-5 sm:p-7">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="hud-label mb-2">🧭 Trail Node</p>
            <h2 className="text-xl font-semibold tracking-tight text-slate-100 sm:text-2xl">
              {trailName}
            </h2>
          </div>

          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
              isOffline
                ? "border-amber-300/40 bg-amber-300/10 text-amber-200"
                : "border-emerald-300/40 bg-emerald-300/10 text-emerald-200"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isOffline ? "bg-amber-300" : "bg-emerald-300 live-dot"
              }`}
            />
            {isOffline ? "Offline" : "Live"}
          </span>
        </div>

        {isOffline && (
          <div className="rounded-xl border border-amber-400/35 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            🔧 Feed offline for maintenance.
          </div>
        )}

        <section className="hud-panel p-5 sm:p-6">
          <div className="space-y-5">
            <div className="hud-label">🌤️ Current Condition</div>
            <div className="relative">
              <div
                className={`${condition.tailwindColor} rounded-xl px-6 py-5 text-center text-3xl font-bold text-slate-900 shadow-xl transition-transform duration-300 sm:text-5xl`}
              >
                {condition.name}
              </div>
              {!isOffline && (
                <div className="pointer-events-none absolute inset-0 rounded-xl border border-cyan-300/35" />
              )}
            </div>

            {condition.warning && (
              <div className="rounded-lg border border-yellow-400/35 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-100">
                {condition.warning}
              </div>
            )}

            <div className="rounded-lg border border-slate-700/80 bg-slate-950/40 px-4 py-4">
              <div className="flex items-center justify-center gap-4">
                <div className="text-[11px] text-slate-400">
                  <span className="text-slate-500">Wetter</span> Lower
                </div>
                <div className="text-4xl font-bold tabular-nums text-slate-100">
                  {latestValue}
                </div>
                <div className="text-[11px] text-slate-400">
                  Higher <span className="text-slate-500">Dryer</span>
                </div>
              </div>

              <div className="mt-4 space-y-1 text-center text-xs text-slate-400">
                <div>Last updated {lastUpdateTime}</div>
                {!isOffline && latestReading && (
                  <div className="text-slate-500">
                    Next update in{" "}
                    <span className="font-medium text-slate-300">
                      {getNextUpdateTime(latestReading.timestamp)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="hud-panel p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="hud-label">Condition Scale</div>
            <div className="h-px w-16 hud-accent-line" />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
            {getConditionPalette().map((item) => (
              <div
                key={item.name}
                className="rounded-lg border border-slate-700/70 bg-slate-900/45 p-2.5 text-center transition-colors duration-200 hover:border-slate-500/70"
              >
                <div
                  className={`mb-2 h-1.5 rounded-full ${item.tailwindColor}`}
                />
                <div className="text-[11px] font-semibold text-slate-200">
                  {item.name}
                </div>
                <div className="text-[10px] text-slate-400">
                  {item.rangeLabel}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="hud-panel p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="hud-label">History</div>
              <div className="mt-1 text-sm text-slate-300">
                {selectedTimeframe}
              </div>
            </div>

            <label className="text-xs text-slate-400">
              Timeframe
              <select
                value={selectedTimeframe}
                onChange={(e) =>
                  setSelectedTimeframe(
                    e.target.value as keyof typeof TIMEFRAMES,
                  )
                }
                className="mt-1 w-full rounded-lg border border-slate-600/60 bg-slate-900/65 px-3 py-2 text-sm text-slate-100 outline-none transition-all duration-200 hover:border-slate-500 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20 sm:min-w-44"
              >
                {Object.keys(TIMEFRAMES).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="h-[210px] rounded-lg border border-slate-800/80 bg-slate-950/40 p-2">
            {filteredReadings.length > 0 ? (
              <Graph
                readings={filteredReadings}
                key={selectedTimeframe}
                timeframe={selectedTimeframe}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                📉 No data in this timeframe yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </article>
  );
}

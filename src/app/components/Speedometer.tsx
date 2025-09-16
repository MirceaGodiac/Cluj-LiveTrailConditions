"use client";

import { useState, useMemo } from "react";
import Graph from "@/app/chart";

interface SpeedometerProps {
  value: number;
  trailName: string;
  readings: Array<{ moisture: number; timestamp: number }>;

  initialTimestamp?: number; // Add this new prop
}

const TIMEFRAMES = {
  "12h": 12 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "48h": 48 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
};

const OFFLINE_THRESHOLD = 65 * 60 * 1000; // 1 hour and 5 minutes in milliseconds

export default function Speedometer({
  value: initialValue,
  trailName,
  readings,
  initialTimestamp = Date.now(), // Default to current time if not provided
}: SpeedometerProps) {
  const [selectedTimeframe, setSelectedTimeframe] =
    useState<keyof typeof TIMEFRAMES>("12h");

  const filteredReadings = useMemo(() => {
    const now = Date.now();
    const timeframeMs = TIMEFRAMES[selectedTimeframe];
    const filtered = readings.filter(
      (reading) => now - reading.timestamp <= timeframeMs
    );
    console.log(
      `[Speedometer] Filtered readings for ${selectedTimeframe}:`,
      filtered
    );
    return filtered;
  }, [readings, selectedTimeframe]);

  const latestValue = useMemo(() => {
    return filteredReadings.length > 0
      ? filteredReadings[filteredReadings.length - 1].moisture
      : initialValue;
  }, [filteredReadings, initialValue]);

  const getCondition = (val: number) => {
    if (val <= 300) return { name: "Slippery", color: "bg-rose-500" };
    if (val <= 330)
      return {
        name: "Wet / Damp",
        color: "bg-sky-500",
        warning: "Some parts may still be slippery",
      };
    if (val <= 350) return { name: "Hero Dirt", color: "bg-emerald-500" };
    if (val <= 400) return { name: "Dry", color: "bg-emerald-500" };
    return { name: "Dusty", color: "bg-amber-400" };
  };

  const condition = getCondition(latestValue);

  const getNextUpdateTime = (lastTimestamp: number) => {
    const nextUpdate = lastTimestamp + 60 * 60 * 1000; // 1 hour after last update
    const timeUntilNext = nextUpdate - Date.now();
    const minutesUntilNext = Math.max(
      0,
      Math.ceil(timeUntilNext / (60 * 1000))
    );
    return minutesUntilNext;
  };

  const isOffline = useMemo(() => {
    if (filteredReadings.length === 0) {
      // If no readings, check against initial timestamp
      return true;
    }
    const lastReading = filteredReadings[filteredReadings.length - 1];
    return Date.now() - lastReading.timestamp > OFFLINE_THRESHOLD;
  }, [filteredReadings, initialTimestamp]);

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-700/50 p-4 sm:p-6">
      <div className="space-y-4 sm:space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-100 capitalize">
          {trailName}
        </h2>

        {isOffline && (
          <div className="bg-yellow-500/20 border border-yellow-500/40 text-yellow-200 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
            <span>🔌</span>
            Offline - out for battery charging
          </div>
        )}

        {/* Conditions Panel */}
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
          <div className="space-y-4">
            <div className="text-sm text-slate-400 uppercase tracking-wide">
              Current Conditions
            </div>

            <div className="flex flex-col space-y-3">
              <div
                className={`${condition.color} text-slate-900 text-2xl sm:text-4xl font-bold px-4 py-2 rounded-lg text-center shadow-md`}
              >
                {condition.name}
              </div>

              {"warning" in condition && (
                <div className="bg-yellow-500/20 border border-yellow-500/40 text-yellow-200 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                  <span>⚠️</span>
                  {condition.warning}
                </div>
              )}

              <div className="flex flex-col items-center space-y-1 mt-2">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span>← Lower</span>
                    <span className="text-slate-500">(Wetter)</span>
                  </div>
                  <div className="text-3xl font-bold text-slate-100">
                    {latestValue}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span className="text-slate-500">(Dryer)</span>
                    <span>Higher →</span>
                  </div>
                </div>
                <div className="flex flex-col items-center text-xs text-slate-400">
                  <div>
                    Last Updated{" "}
                    {filteredReadings.length > 0
                      ? new Date(
                          filteredReadings[
                            filteredReadings.length - 1
                          ].timestamp
                        ).toLocaleTimeString()
                      : "N/A"}
                  </div>
                  {filteredReadings.length > 0 && !isOffline && (
                    <div className="text-slate-500">
                      Next update in approximately{" "}
                      {getNextUpdateTime(
                        filteredReadings[filteredReadings.length - 1].timestamp
                      )}{" "}
                      minutes
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Condition Scale */}
          <div className="mt-4 space-y-2">
            <div className="text-xs text-slate-400 uppercase tracking-wide">
              Condition Scale
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                {
                  name: "Slippery",
                  range: "< 300",
                  color: "bg-rose-500",
                },
                {
                  name: "Wet / Damp",
                  range: "300 - 330",
                  color: "bg-sky-500",
                },
                {
                  name: "Hero Dirt",
                  range: "330 - 350",
                  color: "bg-emerald-500",
                },
                {
                  name: "Dry",
                  range: "350 - 400",
                  color: "bg-amber-400",
                },
                {
                  name: "Dusty",
                  range: "> 400",
                  color: "bg-rose-400",
                },
              ].map((item) => (
                <div
                  key={item.name}
                  className="bg-slate-800/50 rounded-lg p-2 text-center"
                >
                  <div className={`h-1.5 ${item.color} rounded-full mb-2`} />
                  <div className="font-medium text-slate-300 text-xs">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-slate-400">{item.range}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Graph Panel */}
        <div className="bg-slate-900/50 rounded-xl p-3 sm:p-4 border border-slate-700/50">
          <div className="flex flex-col space-y-2 mb-3">
            <div className="text-xs sm:text-sm text-slate-400 uppercase tracking-wide">
              History -{" "}
              {Object.keys(TIMEFRAMES).find((key) => key === selectedTimeframe)}
            </div>
            <select
              value={selectedTimeframe}
              onChange={(e) =>
                setSelectedTimeframe(e.target.value as keyof typeof TIMEFRAMES)
              }
              className="w-full bg-slate-800 text-slate-300 text-sm rounded px-2 py-1.5 border border-slate-700"
            >
              {Object.keys(TIMEFRAMES).map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>
          <div className="h-[150px]">
            {filteredReadings.length > 0 ? (
              <Graph
                readings={filteredReadings}
                key={selectedTimeframe}
                timeframe={selectedTimeframe}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">
                Loading data...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

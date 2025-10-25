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
  "Last 24h": 24 * 60 * 60 * 1000,
  "Last 48h": 48 * 60 * 60 * 1000,
  "Last 7 days": 7 * 24 * 60 * 60 * 1000,
};

const OFFLINE_THRESHOLD = 3 * 61 * 60 * 1000; // 12 hours in milliseconds
const MOVING_AVERAGE_WINDOWS = [3, 5, 7, 9, 11];

const calculateMovingAverage = (
  readings: Array<{ moisture: number; timestamp: number }>,
  windowSize: number
) => {
  const result = [];
  for (let i = windowSize - 1; i < readings.length; i++) {
    const window = readings.slice(i - windowSize + 1, i + 1);
    const avgMoisture =
      window.reduce((sum, r) => sum + r.moisture, 0) / windowSize;
    result.push({
      moisture: avgMoisture,
      timestamp: readings[i].timestamp,
    });
  }
  return result;
};

export default function Speedometer({
  value: initialValue,
  trailName,
  readings,
  initialTimestamp = Date.now(), // Default to current time if not provided
}: SpeedometerProps) {
  const [selectedTimeframe, setSelectedTimeframe] =
    useState<keyof typeof TIMEFRAMES>("Last 24h");
  const [maWindow, setMaWindow] = useState<number>(3);

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
    if (val <= 350)
      return {
        name: "Hero Dirt",
        color: "bg-emerald-500",
        warning: "Lower section of trails may still be slippery",
      };
    if (val <= 400) return { name: "Dry", color: "bg-amber-400" };
    return { name: "Dusty", color: "bg-orange-400" };
  };

  const condition = getCondition(latestValue);

  const getNextUpdateTime = (lastTimestamp: number) => {
    const nextUpdate = lastTimestamp + 12 * 60 * 60 * 1000; // 4 hours after last update
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
    if (filteredReadings.length === 0) {
      // If no readings, check against initial timestamp
      return true;
    }
    const lastReading = filteredReadings[filteredReadings.length - 1];
    return Date.now() - lastReading.timestamp > OFFLINE_THRESHOLD;
  }, [filteredReadings, initialTimestamp]);

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-700/50 p-4 sm:p-6 transition-all duration-300 hover:bg-slate-800/70">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 capitalize bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            {trailName}
          </h2>
          {!isOffline && (
            <span className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          )}
        </div>

        {isOffline && (
          <div className="bg-yellow-500/20 border border-yellow-500/40 text-yellow-200 px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-3 animate-pulse">
            <span className="text-xl">🔌</span>
            <span>Offline - Out for maintenance and updates</span>
          </div>
        )}

        {/* Conditions Panel */}
        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50 transition-all duration-300 hover:bg-slate-900/60">
          <div className="space-y-6">
            <div className="text-sm text-slate-400 uppercase tracking-wide font-semibold">
              Current Conditions
            </div>

            <div className="flex flex-col space-y-4">
              <div
                className={`${condition.color} text-slate-900 text-3xl sm:text-5xl font-bold px-6 py-4 rounded-xl text-center shadow-lg transform transition-all duration-300 hover:scale-[1.02] cursor-default`}
              >
                {condition.name}
              </div>

              {"warning" in condition && (
                <div className="bg-yellow-500/20 border border-yellow-500/40 text-yellow-200 px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-3 animate-pulse">
                  <span className="text-xl">⚠️</span>
                  {condition.warning}
                </div>
              )}

              <div className="flex flex-col items-center space-y-3 mt-2">
                <div className="flex items-center gap-6">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span>← Lower</span>
                    <span className="text-slate-500">(Wetter)</span>
                  </div>
                  <div className="text-4xl font-bold text-slate-100 tabular-nums transition-all duration-300">
                    {latestValue}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span className="text-slate-500">(Dryer)</span>
                    <span>Higher →</span>
                  </div>
                </div>
                <div className="flex flex-col items-center text-xs space-y-1 text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
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
                      <span className="text-slate-300 font-medium">
                        {getNextUpdateTime(
                          filteredReadings[filteredReadings.length - 1]
                            .timestamp
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Condition Scale */}
          <div className="mt-6 space-y-3">
            <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold">
              Condition Scale
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                {
                  name: "Slippery",
                  color: "bg-rose-500",
                  range: "< 300",
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
                  color: "bg-orange-400",
                },
              ].map((item) => (
                <div
                  key={item.name}
                  className="bg-slate-800/50 rounded-lg p-3 text-center transition-all duration-300 hover:bg-slate-800/70 cursor-default"
                >
                  <div className={`h-2 ${item.color} rounded-full mb-2`} />
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
        <div className="bg-slate-900/50 rounded-xl p-4 sm:p-6 border border-slate-700/50 transition-all duration-300 hover:bg-slate-900/60">
          <div className="flex flex-col space-y-3 mb-4">
            <div className="text-sm text-slate-400 uppercase tracking-wide font-semibold">
              History -{" "}
              {Object.keys(TIMEFRAMES).find((key) => key === selectedTimeframe)}
            </div>
            <select
              value={selectedTimeframe}
              onChange={(e) =>
                setSelectedTimeframe(e.target.value as keyof typeof TIMEFRAMES)
              }
              className="w-full bg-slate-800 text-slate-300 text-sm rounded-lg px-4 py-2.5 border border-slate-700 cursor-pointer transition-all duration-300 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {Object.keys(TIMEFRAMES).map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>
          <div className="h-[180px]">
            {filteredReadings.length > 0 ? (
              <Graph
                readings={filteredReadings}
                key={selectedTimeframe}
                timeframe={selectedTimeframe}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">
                <div className="animate-pulse">Loading data...</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

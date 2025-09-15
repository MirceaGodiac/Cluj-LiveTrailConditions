"use client";

import { useState, useMemo } from "react";
import Graph from "@/app/chart";

interface SpeedometerProps {
  value: number;
  trailName: string;
  readings: Array<{ moisture: number; timestamp: number }>;
}

const TIMEFRAMES = {
  "12h": 12 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "48h": 48 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
};

export default function Speedometer({
  value: initialValue,
  trailName,
  readings,
}: SpeedometerProps) {
  const [selectedTimeframe, setSelectedTimeframe] =
    useState<keyof typeof TIMEFRAMES>("24h");

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
  }, [readings, selectedTimeframe]); // added selectedTimeframe to dependencies

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

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-700/50 p-6">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-100 capitalize">
          {trailName}
        </h2>

        {/* Conditions Panel */}
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="space-y-2 w-full">
              <div className="text-sm text-slate-400 uppercase tracking-wide">
                Current Conditions
              </div>
              <div
                className={`${condition.color} text-slate-900 text-3xl sm:text-4xl font-bold px-4 sm:px-6 py-2 rounded-lg text-center shadow-md`}
              >
                {condition.name}
              </div>
              {"warning" in condition && (
                <div className="text-white-400 text-xs sm:text-sm mt-2 font-medium flex items-center justify-center gap-1">
                  <span>⚠️</span>
                  {condition.warning}
                </div>
              )}
            </div>

            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-slate-100">
                  {latestValue}
                </span>
              </div>
              <div className="text-xs sm:text-sm text-slate-400 mt-0 sm:mt-2">
                Updated{" "}
                {filteredReadings.length > 0
                  ? new Date(
                      filteredReadings[filteredReadings.length - 1].timestamp
                    ).toLocaleTimeString()
                  : "N/A"}
              </div>
            </div>
          </div>

          {/* Condition Scale */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 mt-4 text-center">
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
                range: "> 450",
                color: "bg-rose-400",
              },
            ].map((item) => (
              <div key={item.name} className="text-center">
                <div
                  className={`h-1.5 ${item.color} rounded-full mb-1 sm:mb-1.5 shadow-sm`}
                />
                <div className="font-medium text-slate-300 text-xs sm:text-sm">
                  {item.name}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-400">
                  {item.range}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Graph Panel */}
        <div className="bg-slate-900/50 rounded-xl p-3 sm:p-4 border border-slate-700/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-3">
            <div className="text-xs sm:text-sm text-slate-400 uppercase tracking-wide">
              {Object.keys(TIMEFRAMES).find((key) => key === selectedTimeframe)}
            </div>
            <select
              value={selectedTimeframe}
              onChange={(e) =>
                setSelectedTimeframe(e.target.value as keyof typeof TIMEFRAMES)
              }
              className="w-full sm:w-auto bg-slate-800 text-slate-300 text-xs sm:text-sm rounded px-2 py-1 border border-slate-700"
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

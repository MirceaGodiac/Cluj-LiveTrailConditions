"use client";

import { useState, useMemo } from "react";
import Graph from "@/app/chart";

interface SpeedometerProps {
  value: number;
  trailName: string;
  readings: Array<{ moisture: number; timestamp: number }>;
}

const TIMEFRAMES = {
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
    if (val <= 350) return { name: "Slippery", color: "bg-rose-500" };
    if (val <= 400) return { name: "Wet", color: "bg-sky-500" };
    if (val <= 450) return { name: "Good", color: "bg-emerald-500" };
    return { name: "Dry", color: "bg-amber-400" };
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
          <div className="flex justify-between items-start">
            <div className="space-y-2 w-full">
              <div className="text-sm text-slate-400 uppercase tracking-wide">
                Current Conditions
              </div>
              <div
                className={`${condition.color} text-slate-900 text-4xl font-bold px-6 py-2 rounded-lg text-center shadow-md`}
              >
                {condition.name}
              </div>
            </div>

            <div className="flex flex-col items-end ml-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-100">
                  {latestValue}
                </span>
                <span className="text-lg text-slate-400"></span>
              </div>
              <div className="text-sm text-slate-400 mt-2">
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
          <div className="grid grid-cols-4 gap-3 mt-4">
            {[
              {
                name: "Slippery",
                range: "< 350",
                color: "bg-rose-500",
              },
              {
                name: "Wet",
                range: "350 - 400",
                color: "bg-sky-500",
              },
              {
                name: "Good",
                range: "400 - 450",
                color: "bg-emerald-500",
              },
              {
                name: "Dry",
                range: "> 450",
                color: "bg-amber-400",
              },
            ].map((item) => (
              <div key={item.name} className="text-center">
                <div
                  className={`h-1.5 ${item.color} rounded-full mb-1.5 shadow-sm`}
                />
                <div className="font-medium text-slate-300 text-sm">
                  {item.name}
                </div>
                <div className="text-xs text-slate-400">{item.range}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Graph Panel */}
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex justify-between items-center mb-3">
            <div className="text-sm text-slate-400 uppercase tracking-wide">
              {Object.keys(TIMEFRAMES).find((key) => key === selectedTimeframe)}
            </div>
            <select
              value={selectedTimeframe}
              onChange={(e) =>
                setSelectedTimeframe(e.target.value as keyof typeof TIMEFRAMES)
              }
              className="bg-slate-800 text-slate-300 text-sm rounded px-2 py-1 border border-slate-700"
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

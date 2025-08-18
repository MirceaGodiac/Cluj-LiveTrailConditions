"use client";

import Graph from "@/app/chart";

interface SpeedometerProps {
  value: number;
  trailName: string;
  readings: Array<{ moisture: number }>;
}

export default function Speedometer({
  value,
  trailName,
  readings,
}: SpeedometerProps) {
  const getCondition = (val: number) => {
    if (val <= 30) return { name: "Dry", color: "bg-amber-400" };
    if (val <= 40) return { name: "Hero Dirt", color: "bg-emerald-500" };
    if (val <= 50) return { name: "Wet", color: "bg-sky-500" };
    return { name: "Slippery", color: "bg-rose-500" };
  };

  const condition = getCondition(value);

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
                  {value}
                </span>
                <span className="text-lg text-slate-400">%</span>
              </div>
              <div className="text-sm text-slate-400 mt-2">
                Updated {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Condition Scale */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            {[
              { name: "Dry", range: "0-30%", color: "bg-amber-400" },
              { name: "Hero Dirt", range: "30-40%", color: "bg-emerald-500" },
              { name: "Wet", range: "40-50%", color: "bg-sky-500" },
              { name: "Slippery", range: "50%+", color: "bg-rose-500" },
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
          <div className="text-sm text-slate-400 uppercase tracking-wide mb-3">
            24 Hour History
          </div>
          <div className="h-[150px]">
            {readings.length > 0 ? (
              <Graph readings={readings} />
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

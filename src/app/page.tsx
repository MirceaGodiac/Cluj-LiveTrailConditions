"use client";

import { useEffect, useState } from "react";
import Speedometer from "@/app/components/Speedometer";
import { ref, onValue, DataSnapshot } from "firebase/database";
import { database } from "@/app/lib/firebaseconfig";
import { normalizeTimestamp } from "@/app/lib/normalizeTimestamp";

interface Reading {
  moisture: number;
  timestamp: number;
}

interface FirebaseReading {
  [key: string]: {
    moisture: number;
    timestamp: number;
  };
}

const TRAILS = [{ id: "2", name: "Livada Tech Trail Upper" }];

export default function Home() {
  const [trailReadings, setTrailReadings] = useState<{
    [key: string]: Reading[];
  }>({});

  useEffect(() => {
    const unsubscribes = TRAILS.map((trail) => {
      const readingsRef = ref(database, `${trail.id}-readings`);

      return onValue(readingsRef, (snapshot: DataSnapshot) => {
        const data = snapshot.val() as FirebaseReading;
        if (data) {
          const readingsArray = Object.values(data)
            .map((reading) => ({
              moisture: Number(reading.moisture) || 0,
              timestamp: normalizeTimestamp(reading.timestamp),
            }))
            .sort((a, b) => a.timestamp - b.timestamp);

          setTrailReadings((prev) => ({
            ...prev,
            [trail.id]: readingsArray,
          }));
        }
      });
    });

    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, []);

  const latestTimestamps = TRAILS.map((trail) => {
    const latest = trailReadings[trail.id]?.slice(-1)[0];
    return latest?.timestamp ?? 0;
  }).filter((ts) => ts > 0);

  const freshestTimestamp =
    latestTimestamps.length > 0 ? Math.max(...latestTimestamps) : 0;

  const formatLastSync = (timestamp: number) => {
    const diffMinutes = Math.max(
      0,
      Math.floor((Date.now() - timestamp) / (60 * 1000)),
    );

    const relative =
      diffMinutes < 60
        ? `${diffMinutes} min ago`
        : diffMinutes < 24 * 60
          ? `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m ago`
          : `${Math.floor(diffMinutes / (24 * 60))}d ago`;

    const absolute = new Intl.DateTimeFormat(undefined, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp));

    return `${absolute} (${relative})`;
  };

  return (
    <main className="min-h-screen pb-10">
      <section className="relative overflow-hidden px-4 pt-12 pb-10 sm:pt-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-120px] left-[8%] h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />
          <div className="absolute right-[6%] top-[5%] h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div className="hud-card border-slate-700/40 px-6 py-8 sm:px-10 sm:py-10">
            <div className="space-y-4 text-center sm:text-left">
              <p className="hud-label">Live Trail Feed</p>
              <h1 className="hud-title text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                🏔️ Cluj-Napoca Trail Conditions
              </h1>
              <p className="mx-auto max-w-2xl text-sm text-slate-300 sm:mx-0 sm:text-base">
                To go out on a ride or to not go out on a ride? That is the
                question.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 sm:text-sm">
              <div className="hud-panel px-4 py-3">
                <span className="hud-label">Sensor Cadence</span>
                <p className="mt-1 text-slate-100">Every 6 hours</p>
              </div>
              <div className="hud-panel px-4 py-3">
                <span className="hud-label">Last Network Sync</span>
                <p className="mt-1 text-slate-100">
                  {freshestTimestamp === 0
                    ? "Waiting for first reading"
                    : formatLastSync(freshestTimestamp)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-7 px-4 md:grid-cols-2 xl:gap-8">
        {TRAILS.map((trail) => (
          <Speedometer
            key={trail.id}
            value={trailReadings[trail.id]?.slice(-1)[0]?.moisture || 0}
            trailName={trail.name}
            readings={trailReadings[trail.id] || []}
          />
        ))}
      </section>
    </main>
  );
}

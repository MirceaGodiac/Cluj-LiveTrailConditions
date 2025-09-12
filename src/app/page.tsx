"use client";

import { useEffect, useState } from "react";
import Speedometer from "@/app/components/Speedometer";
import { ref, onValue, DataSnapshot } from "firebase/database";
import { database } from "@/app/lib/firebaseconfig";

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

const TRAILS = [{ id: "1", name: "Livada Tech Trail Upper" }];

const TIMEFRAMES = {
  "24h": 24 * 60 * 60 * 1000,
  "48h": 48 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
};

export default function Home() {
  const [trailReadings, setTrailReadings] = useState<{
    [key: string]: Reading[];
  }>({});
  const [timeframe, setTimeframe] = useState<keyof typeof TIMEFRAMES>("24h");

  useEffect(() => {
    const unsubscribes = TRAILS.map((trail) => {
      const readingsRef = ref(database, `${trail.id}-readings`);

      return onValue(readingsRef, (snapshot: DataSnapshot) => {
        const data = snapshot.val() as FirebaseReading;
        if (data) {
          const readingsArray = Object.entries(data).map(([key, reading]) => ({
            moisture: Number(reading.moisture) || 0,
            timestamp: reading.timestamp,
          }));

          setTrailReadings((prev) => ({
            ...prev,
            [trail.id]: readingsArray,
          }));
        }
      });
    });

    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, []);

  const filterReadings = (readings: Reading[]) => {
    const now = Date.now();
    const timeframeMs = TIMEFRAMES[timeframe];
    return readings.filter((reading) => now - reading.timestamp <= timeframeMs);
  };

  return (
    <main className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          🏔️ Cluj-Napoca Live Trail Conditions
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TRAILS.map((trail) => (
            <Speedometer
              key={trail.id}
              value={
                filterReadings(trailReadings[trail.id] || []).slice(-1)[0]
                  ?.moisture || 0
              }
              trailName={trail.name}
              readings={filterReadings(trailReadings[trail.id] || [])}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

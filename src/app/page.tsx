"use client";

import { useEffect, useState } from "react";
import Speedometer from "@/app/components/Speedometer";
import { ref, onValue, DataSnapshot } from "firebase/database";
import { database } from "@/app/lib/firebaseconfig";

interface Reading {
  moisture: number;
}

interface FirebaseReading {
  [key: string]: Reading;
}

const TRAILS = [
  { id: "1", name: "Livada Tech Trail Upper" },
  { id: "2", name: "Livada Tech Trail Lower" },
  { id: "3", name: "Mosquito Upper" },
  { id: "4", name: "Hoia Forest" },
];

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
          const readingsArray = Object.entries(data).map(([key, reading]) => ({
            moisture: Number(reading.moisture) || 0,
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
              value={trailReadings[trail.id]?.slice(-1)[0]?.moisture || 0}
              trailName={trail.name}
              readings={trailReadings[trail.id] || []}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

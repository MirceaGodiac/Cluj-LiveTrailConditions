"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type Reading = {
  moisture: number;
  timestamp: number;
};

export default function Graph({
  readings,
  timeframe,
}: {
  readings: Reading[];
  timeframe: string;
}) {
  console.log(
    `[Chart] Rendering chart for timeframe ${timeframe} with ${readings.length} readings:`,
    readings.map((r) => ({
      moisture: r.moisture,
      time: new Date(r.timestamp).toLocaleString(),
    }))
  );

  const moistureValues = readings.map((r) => {
    const value = parseFloat(r.moisture.toString());
    return isNaN(value) ? 0 : value;
  });

  console.log("Processed moisture values:", moistureValues);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    if (timeframe === "week" || timeframe === "month") {
      return date.toLocaleDateString();
    }
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const data = {
    labels: readings.map((r) => formatTimestamp(r.timestamp)),
    datasets: [
      {
        label: "Moisture Level",
        data: moistureValues,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
        fill: false,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  };

  return (
    <div className="w-full h-full">
      <Line data={data} options={options} />
    </div>
  );
}

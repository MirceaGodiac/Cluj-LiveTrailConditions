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

  // Function to get color based on moisture value
  const getConditionColor = (val: number) => {
    if (val <= 300) return "#f43f5e"; // rose-500 - Slippery
    if (val <= 330) return "#0ea5e9"; // sky-500 - Wet/Damp
    if (val <= 350) return "#10b981"; // emerald-500 - Hero Dirt
    if (val <= 400) return "#fbbf24"; // amber-400 - Dry
    return "#fb923c"; // orange-400 - Dusty
  };

  // Create gradient colors for the line based on moisture values
  const pointColors = moistureValues.map((val) => getConditionColor(val));
  const pointBorderColors = pointColors.map((color) => color);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    if (timeframe === "Last 7 days" || timeframe === "month") {
      return date.toLocaleDateString();
    }
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Create a simple gradient background that doesn't cause issues
  const gradientBackground = "rgba(6, 182, 212, 0.2)";

  const data = {
    labels: readings.map((r) => formatTimestamp(r.timestamp)),
    datasets: [
      {
        label: "Moisture Level",
        data: moistureValues,
        borderColor: "#06b6d4", // Use solid color to avoid gradient issues
        backgroundColor: gradientBackground,
        tension: 0.4,
        fill: true,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: pointColors,
        pointBorderColor: pointBorderColors,
        pointBorderWidth: 2,
        borderWidth: 4,
        // Use segment coloring for the gradient effect on line segments
        segment: {
          borderColor: (ctx: {
            p0: { parsed: { y: number } };
            p1: { parsed: { y: number } };
          }) => {
            if (!ctx.p0?.parsed || !ctx.p1?.parsed) return "#06b6d4";
            const startValue = ctx.p0.parsed.y;
            const endValue = ctx.p1.parsed.y;
            const avgValue = (startValue + endValue) / 2;
            return getConditionColor(avgValue);
          },
        },
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
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)", // slate-900 with transparency
        titleColor: "#e2e8f0", // slate-200
        bodyColor: "#cbd5e1", // slate-300
        borderColor: "#475569", // slate-600
        borderWidth: 1,
        callbacks: {
          label: function (context: { parsed: { y: number } }) {
            const value = context.parsed.y;
            let condition = "Unknown";
            if (value <= 300) condition = "Slippery";
            else if (value <= 330) condition = "Wet / Damp";
            else if (value <= 350) condition = "Hero Dirt";
            else if (value <= 400) condition = "Dry";
            else condition = "Dusty";

            return `Moisture: ${value} (${condition})`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(71, 85, 105, 0.3)", // slate-600 with transparency
        },
        ticks: {
          color: "#94a3b8", // slate-400
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        grid: {
          color: "rgba(71, 85, 105, 0.3)", // slate-600 with transparency
        },
        ticks: {
          color: "#94a3b8", // slate-400
        },
        // Add colored background zones for different conditions
        plugins: {
          annotation: {
            annotations: {
              slippery: {
                type: "box",
                yMin: 0,
                yMax: 300,
                backgroundColor: "rgba(244, 63, 94, 0.1)", // rose-500 with transparency
              },
              wetDamp: {
                type: "box",
                yMin: 300,
                yMax: 330,
                backgroundColor: "rgba(14, 165, 233, 0.1)", // sky-500 with transparency
              },
              heroDirt: {
                type: "box",
                yMin: 330,
                yMax: 350,
                backgroundColor: "rgba(16, 185, 129, 0.1)", // emerald-500 with transparency
              },
              dry: {
                type: "box",
                yMin: 350,
                yMax: 400,
                backgroundColor: "rgba(251, 191, 36, 0.1)", // amber-400 with transparency
              },
              dusty: {
                type: "box",
                yMin: 400,
                yMax: 500,
                backgroundColor: "rgba(251, 146, 60, 0.1)", // orange-400 with transparency
              },
            },
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index" as const,
    },
    elements: {
      point: {
        hoverBackgroundColor: "#ffffff",
        hoverBorderWidth: 3,
      },
    },
  };

  return (
    <div className="w-full h-full">
      <Line data={data} options={options} />
    </div>
  );
}

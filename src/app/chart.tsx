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
import annotationPlugin from "chartjs-plugin-annotation";
import {
  getConditionColorHex,
  getCondition,
  getConditionPalette,
} from "@/app/lib/conditions";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin,
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
  const moistureValues = readings.map((r) => {
    const value = parseFloat(r.moisture.toString());
    return isNaN(value) ? 0 : value;
  });

  const pointColors = moistureValues.map((val) => getConditionColorHex(val));
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

  // Derive annotation bands from the shared condition palette
  const conditionBands = getConditionPalette().map((c) => {
    const match = c.rangeLabel.match(/([<>]?)\s*(\d+)(?:\s*-\s*(\d+))?/);
    let bandMin = 200;
    let bandMax = 500;
    if (match) {
      if (match[1] === "<") {
        bandMin = 200;
        bandMax = Number(match[2]);
      } else if (match[1] === ">") {
        bandMin = Number(match[2]);
        bandMax = 500;
      } else {
        bandMin = Number(match[2]);
        bandMax = Number(match[3] ?? match[2]);
      }
    }
    const hex = c.hexColor;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return {
      yMin: bandMin,
      yMax: bandMax,
      color: `rgba(${r}, ${g}, ${b}, 0.1)`,
    };
  });

  // Compute dynamic y-axis range: accommodate values outside default 200-500
  const positiveValues = moistureValues.filter((v) => v > 0);
  const dataMin = positiveValues.length > 0 ? Math.min(...positiveValues) : 200;
  const dataMax = positiveValues.length > 0 ? Math.max(...positiveValues) : 500;
  const yAxisMin = Math.min(200, Math.floor(dataMin / 50) * 50);
  const yAxisMax = Math.max(500, Math.ceil(dataMax / 50) * 50);

  // Flag if values fall outside the standard 200-500 range
  const hasOutOfRange = positiveValues.some((v) => v < 200 || v > 500);

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
            return getConditionColorHex(avgValue);
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
            const condition = getCondition(value);

            return `Moisture: ${value} (${condition.name})`;
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
          color: "rgba(71, 85, 105, 0.3)",
        },
        ticks: {
          color: "#94a3b8",
        },
        min: yAxisMin,
        max: yAxisMax,
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (options as any).plugins = {
    ...options.plugins,
    annotation: {
      annotations: {
        ...conditionBands.reduce(
          (acc, zone, idx) => {
            acc[`zone-${idx}`] = {
              type: "box",
              yMin: zone.yMin,
              yMax: zone.yMax,
              backgroundColor: zone.color,
            };
            return acc;
          },
          {} as Record<string, unknown>,
        ),
        ...(hasOutOfRange
          ? {
              outOfRangeLabel: {
                type: "label",
                content: "⚠ Values outside standard range",
                position: { x: "end", y: "start" },
                color: "#fbbf24",
                font: { size: 10 },
              },
            }
          : {}),
      },
    },
  };

  return (
    <div className="w-full h-full">
      <Line data={data} options={options} />
    </div>
  );
}

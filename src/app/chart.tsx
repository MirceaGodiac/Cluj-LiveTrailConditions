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
};

export default function Graph({ readings }: { readings: Reading[] }) {
  const moistureValues = readings.map((r) => {
    const value = parseFloat(r.moisture.toString());
    return isNaN(value) ? 0 : value;
  });

  console.log("Processed moisture values:", moistureValues);

  const data = {
    labels: readings.map((_, index) => `Reading ${index + 1}`),
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
  };

  return (
    <div className="w-full h-full">
      <Line data={data} options={options} />
    </div>
  );
}

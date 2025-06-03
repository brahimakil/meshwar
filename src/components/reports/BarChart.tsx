"use client";

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  height?: number;
  title?: string;
  color?: string;
}

export default function BarChart({ data, height = 300, title = 'Chart', color = 'rgb(59, 130, 246)' }: BarChartProps) {
  const [chartData, setChartData] = useState({
    labels: [] as string[],
    datasets: [
      {
        label: title,
        data: [] as number[],
        backgroundColor: color,
        borderColor: color.replace(')', ', 0.8)').replace('rgb', 'rgba'),
        borderWidth: 1,
      },
    ],
  });

  useEffect(() => {
    if (data && data.length > 0) {
      const labels = data.map(item => item.label);
      const values = data.map(item => item.value);
      
      setChartData({
        labels,
        datasets: [
          {
            label: title,
            data: values,
            backgroundColor: color,
            borderColor: color.replace(')', ', 0.8)').replace('rgb', 'rgba'),
            borderWidth: 1,
          },
        ],
      });
    }
  }, [data, title, color]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        display: false,
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Bar data={chartData} options={options} />
    </div>
  );
} 
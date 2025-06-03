'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TimeSeriesData } from '@/services/dashboardService';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface LineChartProps {
  data: TimeSeriesData[];
  title?: string;
  height?: number;
}

export default function LineChart({ data, title = 'Chart', height = 300 }: LineChartProps) {
  const [chartData, setChartData] = useState<ChartData<'line'>>({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    if (data && data.length > 0) {
      setChartData({
        labels: data.map(item => item.date),
        datasets: [
          {
            label: 'Users',
            data: data.map(item => item.users || 0),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            tension: 0.3
          },
          {
            label: 'Activities',
            data: data.map(item => item.activities || 0),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.5)',
            tension: 0.3
          },
          {
            label: 'Locations',
            data: data.map(item => item.locations || 0),
            borderColor: 'rgb(249, 115, 22)',
            backgroundColor: 'rgba(249, 115, 22, 0.5)',
            tension: 0.3
          }
        ]
      });
    }
  }, [data]);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Line options={options} data={chartData} />
    </div>
  );
} 
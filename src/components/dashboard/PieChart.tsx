'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { PieChartData } from '@/services/dashboardService';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

interface PieChartProps {
  data: PieChartData[];
  title?: string;
  height?: number;
}

export default function PieChart({ data, title = 'Chart', height = 300 }: PieChartProps) {
  const [chartData, setChartData] = useState<ChartData<'pie'>>({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    if (data && data.length > 0) {
      // Generate colors
      const colors = [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)',
        'rgba(199, 199, 199, 0.7)',
        'rgba(83, 102, 255, 0.7)',
        'rgba(40, 159, 64, 0.7)',
        'rgba(210, 199, 199, 0.7)',
      ];

      setChartData({
        labels: data.map(item => item.name),
        datasets: [
          {
            data: data.map(item => item.value),
            backgroundColor: colors.slice(0, data.length),
            borderColor: colors.slice(0, data.length).map(color => color.replace('0.7', '1')),
            borderWidth: 1,
          }
        ]
      });
    }
  }, [data]);

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: title,
      },
    }
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Pie options={options} data={chartData} />
    </div>
  );
} 
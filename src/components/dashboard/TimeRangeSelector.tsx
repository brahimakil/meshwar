'use client';

import { TimePeriod } from '@/services/dashboardService';

interface TimeRangeSelectorProps {
  value: TimePeriod;
  onChange: (value: TimePeriod) => void;
  className?: string;
}

export default function TimeRangeSelector({
  value,
  onChange,
  className
}: TimeRangeSelectorProps) {
  const options: { value: TimePeriod; label: string }[] = [
    { value: 'day', label: 'Today' },
    { value: 'week', label: 'Last 7 days' },
    { value: 'month', label: 'Last 30 days' },
    { value: 'year', label: 'Last 12 months' },
    { value: 'all', label: 'All time' },
  ];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TimePeriod)}
      className={`h-8 rounded-md border border-input bg-background px-2 text-xs ${className}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
} 
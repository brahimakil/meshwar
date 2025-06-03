export function formatDate(date: Date | string): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatTime(time: string): string {
  if (!time) return '';
  return time;
}

export function isDateInPast(date: Date | string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const compareDate = typeof date === 'string' ? new Date(date) : date;
  compareDate.setHours(0, 0, 0, 0);
  
  return compareDate < today;
} 
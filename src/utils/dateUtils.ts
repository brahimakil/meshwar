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

export function safeToDate(t: any): Date | null {
  if (!t) return null;
  
  // Handle Firestore Timestamp
  if (t && typeof t.toDate === 'function') {
    return t.toDate();
  }
  
  // Handle JavaScript Date objects
  if (t instanceof Date) {
    return t;
  }
  
  // Handle numeric timestamps
  if (typeof t === 'number') {
    return new Date(t);
  }
  
  // Handle ISO strings
  if (typeof t === 'string') {
    return new Date(t);
  }
  
  console.warn('Unsupported date format:', t);
  return null;
} 
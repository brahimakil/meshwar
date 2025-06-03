export const ageGroupOptions = [
  { value: 'all', label: 'All Ages' },
  { value: 'adults', label: 'Adults' },
  { value: 'children', label: 'Children' },
  { value: 'seniors', label: 'Seniors' }
];

export function getAgeGroupLabel(value: string): string {
  const option = ageGroupOptions.find(opt => opt.value === value);
  return option ? option.label : value.charAt(0).toUpperCase() + value.slice(1);
} 
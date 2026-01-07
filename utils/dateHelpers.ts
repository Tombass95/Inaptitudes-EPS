
export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const calculateEndDate = (startDate: string, durationDays: number): string => {
  const date = new Date(startDate);
  date.setDate(date.getDate() + durationDays);
  return date.toISOString().split('T')[0];
};

export const isExpired = (endDate: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(endDate) < today;
};

export const getDaysRemaining = (endDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  const diffTime = end.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

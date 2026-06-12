export function formatDurationMinutes(value: number): string {
  if (!Number.isFinite(value)) {
    return '0 min';
  }

  const minutes = Math.max(0, value);
  const maximumFractionDigits = minutes < 10 && !Number.isInteger(minutes) ? 1 : 0;
  const formattedMinutes = new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
  }).format(minutes);

  if (minutes > 0 && minutes < 1) {
    return '<1 min';
  }

  return `${formattedMinutes} min`;
}

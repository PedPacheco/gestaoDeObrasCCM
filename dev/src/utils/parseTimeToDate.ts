export function parseTimeToDate(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setFullYear(1970, 0, 1);
  date.setUTCHours(hours, minutes, 0, 0);
  return date;
}

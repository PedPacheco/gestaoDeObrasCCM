import moment from 'moment';

export function parseTimeToDate(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setFullYear(1970, 0, 1);
  date.setUTCHours(hours, minutes, 0, 0);
  return date;
}

export function countBusinessDays(startDate: Date, endDate: Date): number {
  const start = moment.utc(startDate).startOf('day');
  const end = moment.utc(endDate).startOf('day');

  console.log(start, end);

  let count = 0;

  const current = start.clone();

  while (current.isBefore(end)) {
    current.add(1, 'day');
    const dayOfWeek = current.isoWeekday(); // 1 (seg) a 7 (dom)
    if (dayOfWeek <= 5) {
      count++;
    }
  }

  return count;
}

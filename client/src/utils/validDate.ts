export function isValidDateString(dateString: string) {
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  return isoDatePattern.test(dateString);
}

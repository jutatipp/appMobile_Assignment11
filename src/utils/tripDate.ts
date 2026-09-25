// รับเวลาไทยแบบชัดเจน และปฏิเสธวันไม่มีจริง เช่น 31 กุมภาพันธ์
export function parseTripDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(value.replace(' ', 'T') + ':00+07:00');
  if (!Number.isFinite(date.getTime())) return null;
  return formatTripInput(date.toISOString()) === value ? date.toISOString() : null;
}
export function formatTripInput(iso: string) {
  return new Date(new Date(iso).getTime() + 7 * 3600000)
    .toISOString()
    .slice(0, 16)
    .replace('T', ' ');
}

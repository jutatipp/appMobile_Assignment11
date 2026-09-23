// ฟอร์มรับเวลาไทยเสมอ เพื่อให้เครื่องที่ตั้ง timezone ต่างกันนัดเวลาเดียวกัน
export function parseEventDate(date: string, time: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const calendarDay = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(calendarDay.getTime()) || calendarDay.toISOString().slice(0, 10) !== date)
    return null;
  const value = new Date(`${date}T${time}:00+07:00`);
  return Number.isFinite(value.getTime()) ? value : null;
}

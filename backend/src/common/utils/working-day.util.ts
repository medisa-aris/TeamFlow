import { isWeekend } from 'date-fns';
import { toZonedTime, format } from 'date-fns-tz';

const WIB = 'Asia/Jakarta';

export function getNowWIB(): Date {
  return toZonedTime(new Date(), WIB);
}

export function isWeekendInWIB(date: Date = new Date()): boolean {
  return isWeekend(toZonedTime(date, WIB));
}

export function getTodayDateStringWIB(): string {
  return format(toZonedTime(new Date(), WIB), 'yyyy-MM-dd', { timeZone: WIB });
}

export function shouldAutoApproveNow(deadlineHour = 9): boolean {
  const nowWIB = toZonedTime(new Date(), WIB);
  if (isWeekend(nowWIB)) return false;
  const hours = nowWIB.getHours();
  return hours >= deadlineHour;
}

export function getNextWorkingDateWIB(): Date {
  let cursor = toZonedTime(new Date(), WIB);
  cursor = new Date(cursor.getTime() + 86400000); // add one day
  while (isWeekend(cursor)) {
    cursor = new Date(cursor.getTime() + 86400000);
  }
  const dateStr = format(cursor, 'yyyy-MM-dd', { timeZone: WIB });
  return new Date(dateStr);
}

export function getCurrentWeekMonFri(): string[] {
  const nowWIB = toZonedTime(new Date(), WIB);
  const dayOfWeek = nowWIB.getDay(); // 0=Sun, 1=Mon, …, 6=Sat
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const days: string[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(nowWIB.getTime() + (i - daysFromMonday) * 86400000);
    days.push(format(d, 'yyyy-MM-dd', { timeZone: WIB }));
  }
  return days;
}

export function getWorkingDaysBack(n: number): string[] {
  const days: string[] = [];
  let cursor = toZonedTime(new Date(), WIB);
  while (days.length < n) {
    if (!isWeekend(cursor)) {
      days.push(format(cursor, 'yyyy-MM-dd', { timeZone: WIB }));
    }
    cursor = new Date(cursor.getTime() - 86400000);
  }
  return days;
}

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

export function shouldAutoApproveNow(): boolean {
  const nowWIB = toZonedTime(new Date(), WIB);
  if (isWeekend(nowWIB)) return false;
  const hours = nowWIB.getHours();
  return hours >= 9;
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

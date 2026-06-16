import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getTodayDateStringWIB } from '../../common/utils/working-day.util';
import { toZonedTime, format } from 'date-fns-tz';

const WIB = 'Asia/Jakarta';
const DAY_COLS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

function mondayOf(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00+07:00');
  const dow = d.getDay(); // 0=Sun
  const dff = dow === 0 ? 6 : dow - 1;
  const mon = new Date(d.getTime() - dff * 86400000);
  return format(mon, 'yyyy-MM-dd', { timeZone: WIB });
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getWeeklySummary(period = 'this_week') {
    const nowWIB = toZonedTime(new Date(), WIB);
    const dow = nowWIB.getDay();
    const dff = dow === 0 ? 6 : dow - 1;
    const thisMonday = new Date(nowWIB.getTime() - dff * 86400000);

    /* -------- week views (Mon-Sun, 7 columns) -------- */
    if (period === 'this_week' || period === 'last_week') {
      const targetMonday =
        period === 'last_week'
          ? new Date(thisMonday.getTime() - 7 * 86400000)
          : thisMonday;

      const dates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(targetMonday.getTime() + i * 86400000);
        dates.push(format(d, 'yyyy-MM-dd', { timeZone: WIB }));
      }
      const [d0, d1, d2, d3, d4, d5, d6] = dates;

      const rows = await this.prisma.$queryRaw<any[]>`
        WITH week_days(day_date) AS (
          VALUES (${d0}::date),(${d1}::date),(${d2}::date),(${d3}::date),
                 (${d4}::date),(${d5}::date),(${d6}::date)
        )
        SELECT
          u.id            AS user_id,
          u.full_name,
          wd.day_date::text AS date,
          COALESCE(h.worked_hours, 0)::float AS worked_hours
        FROM users u
        CROSS JOIN week_days wd
        LEFT JOIN vw_daily_user_hours h
          ON h.user_id = u.id AND h.todo_date = wd.day_date
        WHERE u.is_active = true AND u.role = 'MEMBER' AND u.deleted_at IS NULL
        ORDER BY u.full_name, wd.day_date
      `;

      const userMap = new Map<string, { userId: string; fullName: string; days: number[] }>();
      for (const row of rows) {
        if (!userMap.has(row.user_id))
          userMap.set(row.user_id, { userId: row.user_id, fullName: row.full_name, days: Array(7).fill(0) });
        const idx = dates.indexOf(row.date);
        if (idx >= 0)
          userMap.get(row.user_id)!.days[idx] = Math.round(parseFloat(row.worked_hours) * 10) / 10;
      }

      return {
        dateRange: { from: dates[0], to: dates[6] },
        columns: DAY_COLS,
        members: Array.from(userMap.values()),
      };
    }

    /* -------- this_month: per-week-within-month columns -------- */
    const year = nowWIB.getFullYear();
    const month = nowWIB.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const fromStr = format(new Date(year, month, 1), 'yyyy-MM-dd', { timeZone: WIB });
    const toStr   = format(new Date(year, month, daysInMonth), 'yyyy-MM-dd', { timeZone: WIB });

    // All dates in month
    const allDates: string[] = [];
    for (let d = 1; d <= daysInMonth; d++)
      allDates.push(format(new Date(year, month, d), 'yyyy-MM-dd', { timeZone: WIB }));

    // Group dates by their Mon-week
    const weekGroups = new Map<string, string[]>();
    for (const d of allDates) {
      const mon = mondayOf(d);
      if (!weekGroups.has(mon)) weekGroups.set(mon, []);
      weekGroups.get(mon)!.push(d);
    }
    const weekStarts = Array.from(weekGroups.keys()).sort();
    const columns = weekStarts.map((w) => {
      const wDates = weekGroups.get(w)!;
      const first = parseInt(wDates[0].slice(8, 10), 10);
      const last  = parseInt(wDates[wDates.length - 1].slice(8, 10), 10);
      return first === last ? `${first}` : `${first}-${last}`;
    });

    // Query per-day data for the month
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        h.user_id,
        h.todo_date::text AS date,
        h.worked_hours::float AS worked_hours
      FROM vw_daily_user_hours h
      WHERE h.todo_date >= ${fromStr}::date AND h.todo_date <= ${toStr}::date
    `;

    // All active members (guarantee empty rows for members with no data)
    const allMembers = await this.prisma.user.findMany({
      where: { isActive: true, role: 'MEMBER' as any, deletedAt: null },
      select: { id: true, fullName: true },
      orderBy: { fullName: 'asc' },
    });

    const userMap = new Map<string, { userId: string; fullName: string; days: number[] }>();
    for (const m of allMembers)
      userMap.set(m.id, { userId: m.id, fullName: m.fullName, days: Array(weekStarts.length).fill(0) });

    for (const row of rows) {
      if (!row.date || !userMap.has(row.user_id)) continue;
      const mon = mondayOf(row.date);
      const idx = weekStarts.indexOf(mon);
      if (idx >= 0)
        userMap.get(row.user_id)!.days[idx] =
          Math.round((userMap.get(row.user_id)!.days[idx] + parseFloat(row.worked_hours || 0)) * 10) / 10;
    }

    return {
      dateRange: { from: fromStr, to: toStr },
      columns,
      members: Array.from(userMap.values()),
    };
  }

  async getUserReport(userId: string, dateStr?: string) {
    const targetDate = dateStr ?? getTodayDateStringWIB();

    const user = await this.prisma.user.findFirst({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const todos = await this.prisma.todo.findMany({
      where: { userId, todoDate: new Date(targetDate) },
      include: {
        sessions: { where: { deletedAt: null }, orderBy: { startedAt: 'asc' } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const totalWorkedSeconds = todos.reduce((sum, t) => sum + (t.totalSeconds ?? 0), 0);

    return {
      user: { id: user.id, fullName: user.fullName, email: user.email },
      date: targetDate,
      todos,
      summary: {
        total: todos.length,
        done: todos.filter((t) => t.status === 'DONE').length,
        totalWorkedSeconds,
        totalWorkedHours: parseFloat((totalWorkedSeconds / 3600).toFixed(2)),
      },
    };
  }
}

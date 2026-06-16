import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Redis } from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { getTodayDateStringWIB, getWorkingDaysBack } from '../../common/utils/working-day.util';

const CACHE_TTL = 30;

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async getToday() {
    const dateStr = getTodayDateStringWIB();
    const cacheKey = `dashboard:today:${dateStr}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        u.id AS user_id,
        u.full_name,
        u.role,
        COALESCE(h.approved_hours, 0) AS today_hours_approved,
        COALESCE(h.worked_hours, 0) AS today_hours_worked,
        t.id AS current_todo_id,
        t.title AS current_todo_title,
        t.status AS current_status,
        ts.started_at AS current_session_started_at
      FROM users u
      LEFT JOIN vw_daily_user_hours h
        ON h.user_id = u.id AND h.todo_date = ${dateStr}::date
      LEFT JOIN todos t
        ON t.user_id = u.id AND t.status = 'ONGOING' AND t.todo_date = ${dateStr}::date AND t.deleted_at IS NULL
      LEFT JOIN todo_sessions ts
        ON ts.todo_id = t.id AND ts.paused_at IS NULL AND ts.completed_at IS NULL AND ts.deleted_at IS NULL
      WHERE u.is_active = true AND u.deleted_at IS NULL
      ORDER BY u.full_name
    `;

    const result = {
      date: dateStr,
      members: rows,
      summary: {
        total: rows.length,
        working: rows.filter((r: any) => r.current_status === 'ONGOING').length,
        idle: rows.filter((r: any) => !r.current_status || r.current_status !== 'ONGOING').length,
      },
    };

    await this.redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL);
    return result;
  }

  async getHistory(days = 7) {
    const dateStr = getTodayDateStringWIB();
    const cacheKey = `dashboard:history:${dateStr}:${days}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const workingDays = getWorkingDaysBack(days);
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        h.todo_date::text AS date,
        SUM(h.approved_hours) AS total_approved_hours,
        SUM(h.worked_hours) AS total_worked_hours,
        COUNT(DISTINCT h.user_id)::int AS active_members
      FROM vw_daily_user_hours h
      WHERE h.todo_date::text = ANY(${workingDays})
      GROUP BY h.todo_date
      ORDER BY h.todo_date DESC
    `;

    const result = { days: workingDays, history: rows };
    await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 60);
    return result;
  }

  @OnEvent('dashboard.invalidate')
  async onInvalidate(): Promise<void> {
    const dateStr = getTodayDateStringWIB();
    await this.redis.del(`dashboard:today:${dateStr}`);
  }
}

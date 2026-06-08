import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getTodayDateStringWIB } from '../../common/utils/working-day.util';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserReport(userId: string, dateStr?: string) {
    const targetDate = dateStr ?? getTodayDateStringWIB();

    const user = await this.prisma.user.findFirst({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const todos = await this.prisma.todo.findMany({
      where: {
        userId,
        todoDate: new Date(targetDate),
      },
      include: {
        sessions: {
          where: { deletedAt: null },
          orderBy: { startedAt: 'asc' },
        },
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

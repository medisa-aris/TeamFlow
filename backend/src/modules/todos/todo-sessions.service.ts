import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { computeElapsedSeconds } from '../../common/utils/elapsed-seconds.util';

@Injectable()
export class TodoSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async openSession(todoId: string, startedAt: Date, tx?: any): Promise<void> {
    const db = tx ?? this.prisma;
    await db.todoSession.create({
      data: { todoId, startedAt },
    });
  }

  async closeSession(
    todoId: string,
    closedAt: Date,
    type: 'pause' | 'complete',
    tx?: any,
  ): Promise<number> {
    const db = tx ?? this.prisma;

    const openSession = await db.todoSession.findFirst({
      where: {
        todoId,
        pausedAt: null,
        completedAt: null,
        deletedAt: null,
      },
    });

    if (!openSession) throw new NotFoundException(`No open session found for todo ${todoId}`);

    const elapsedSeconds = computeElapsedSeconds(openSession.startedAt, closedAt);

    await db.todoSession.update({
      where: { id: openSession.id },
      data: {
        ...(type === 'pause' ? { pausedAt: closedAt } : { completedAt: closedAt }),
        elapsedSeconds,
      },
    });

    return elapsedSeconds;
  }

  async sumElapsedSeconds(todoId: string, tx?: any): Promise<number> {
    const db = tx ?? this.prisma;
    const sessions = await db.todoSession.findMany({
      where: { todoId, elapsedSeconds: { not: null } },
      select: { elapsedSeconds: true },
    });
    return sessions.reduce((sum: number, s: any) => sum + (s.elapsedSeconds ?? 0), 0);
  }
}

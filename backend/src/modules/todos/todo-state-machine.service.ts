import { Injectable } from '@nestjs/common';
import { Todo, TodoStatus as PrismaTodoStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TodoStatus } from '../../common/enums/todo-status.enum';
import { TodoTrigger } from '../../common/enums/todo-trigger.enum';
import { ALLOWED_TRANSITIONS } from '../../common/constants/todo-state-machine';
import { InvalidTransitionException } from '../../common/exceptions/invalid-transition.exception';

@Injectable()
export class TodoStateMachineService {
  constructor(private readonly prisma: PrismaService) {}

  async transition(
    todo: Todo,
    toStatus: TodoStatus,
    actorId: string | null,
    trigger: TodoTrigger,
    note?: string,
    tx?: any,
  ): Promise<Todo> {
    const fromStatus = todo.status as TodoStatus;
    const allowed = ALLOWED_TRANSITIONS[fromStatus];

    if (!allowed.includes(toStatus)) {
      throw new InvalidTransitionException(fromStatus, toStatus);
    }

    const db = tx ?? this.prisma;

    const updated = await db.todo.update({
      where: { id: todo.id },
      data: { status: toStatus as PrismaTodoStatus },
    });

    await db.todoEvent.create({
      data: {
        todoId: todo.id,
        actorUserId: actorId,
        fromStatus: fromStatus as PrismaTodoStatus,
        toStatus: toStatus as PrismaTodoStatus,
        triggeredBy: trigger,
        note: note ?? null,
      },
    });

    return updated;
  }
}

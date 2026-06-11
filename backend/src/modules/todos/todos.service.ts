import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Todo, TodoStatus as PrismaTodoStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DelegationsService } from '../delegations/delegations.service';
import { TodoStateMachineService } from './todo-state-machine.service';
import { TodoSessionsService } from './todo-sessions.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { CreateTodoForMemberDto } from './dto/create-todo-for-member.dto';
import { ApproveRejectTodoDto } from './dto/approve-reject-todo.dto';
import { ListTodosQueryDto } from './dto/list-todos-query.dto';
import { TodoStatus } from '../../common/enums/todo-status.enum';
import { TodoTrigger } from '../../common/enums/todo-trigger.enum';
import { ApprovalAction } from '../../common/enums/approval-action.enum';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { SseService } from '../notifications/sse/sse.service';
import {
  WeekendGuardException,
} from '../../common/exceptions/weekend-guard.exception';
import {
  isWeekendInWIB,
  getTodayDateStringWIB,
  shouldAutoApproveNow,
  getNextWorkingDateWIB,
} from '../../common/utils/working-day.util';
import { SystemConfigService } from '../system-config/system-config.service';

@Injectable()
export class TodosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly delegations: DelegationsService,
    private readonly stateMachine: TodoStateMachineService,
    private readonly sessions: TodoSessionsService,
    private readonly events: EventEmitter2,
    private readonly sse: SseService,
    private readonly systemConfig: SystemConfigService,
  ) {}

  async create(dto: CreateTodoDto, userId: string) {
    if (isWeekendInWIB()) throw new WeekendGuardException();

    const todayStr = getTodayDateStringWIB();

    // Sum hours already approved/scheduled for today
    const existing = await this.prisma.$queryRaw<{ approved_hours: number }[]>`
      SELECT COALESCE(SUM(estimated_hours)::float, 0) AS approved_hours
      FROM todos
      WHERE user_id = ${userId}::uuid
        AND todo_date = ${todayStr}::date
        AND status NOT IN ('REJECTED', 'PENDING_APPROVAL', 'PENDING_OVERTIME_APPROVAL')
        AND deleted_at IS NULL
    `;

    const approvedHours = Number(existing[0]?.approved_hours ?? 0);
    const isOvertime = approvedHours + dto.estimatedHours > 8;

    const deadlineHour = await this.systemConfig.getDeadlineHour();
    let initialStatus: TodoStatus;
    if (shouldAutoApproveNow(deadlineHour)) {
      initialStatus = TodoStatus.AUTO_APPROVED;
    } else if (isOvertime) {
      initialStatus = TodoStatus.PENDING_OVERTIME_APPROVAL;
    } else {
      initialStatus = TodoStatus.PENDING_APPROVAL;
    }

    const todo = await this.prisma.$transaction(async (tx) => {
      const created = await tx.todo.create({
        data: {
          userId,
          title: dto.title,
          description: dto.description,
          estimatedHours: dto.estimatedHours,
          status: initialStatus as PrismaTodoStatus,
          isOvertime,
          todoDate: new Date(todayStr),
        },
      });

      await tx.todoEvent.create({
        data: {
          todoId: created.id,
          actorUserId: userId,
          fromStatus: null,
          toStatus: initialStatus as PrismaTodoStatus,
          triggeredBy: shouldAutoApproveNow() ? TodoTrigger.SYSTEM : TodoTrigger.USER,
        },
      });

      return created;
    });

    if (initialStatus === TodoStatus.PENDING_APPROVAL || initialStatus === TodoStatus.PENDING_OVERTIME_APPROVAL) {
      const { userId: approverId } = await this.delegations.resolveApprover(userId);
      await this.prisma.notification.create({
        data: {
          recipientUserId: approverId,
          actorUserId: userId,
          todoId: todo.id,
          type: NotificationType.TODO_PENDING_APPROVAL,
          title: 'New Todo Pending Approval',
          body: `A new todo "${todo.title}" is awaiting your approval.`,
        },
      });
      this.sse.emit(approverId, { type: 'notification.new', data: {} });
    } else {
      await this.prisma.notification.create({
        data: {
          recipientUserId: userId,
          todoId: todo.id,
          type: NotificationType.TODO_AUTO_APPROVED,
          title: 'Todo Auto-Approved',
          body: `Your todo "${todo.title}" has been automatically approved.`,
        },
      });
    }

    this.events.emit('dashboard.invalidate', { userId });
    return todo;
  }

  async findAll(requesterId: string, query: ListTodosQueryDto) {
    const dateStr = query.date ?? getTodayDateStringWIB();
    const whereDate = new Date(dateStr);

    const where: any = {
      userId: requesterId,
      todoDate: whereDate,
      deletedAt: null,
    };

    if (!query.includeDone) {
      where.status = { not: TodoStatus.DONE as PrismaTodoStatus };
    }

    return this.prisma.todo.findMany({
      where,
      include: {
        sessions: { where: { deletedAt: null } },
        approvalLogs: { orderBy: { actionedAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingApprovals(actorId: string) {
    const actor = await this.prisma.user.findFirst({ where: { id: actorId } });
    if (!actor) return [];

    const todayStr = getTodayDateStringWIB();
    const pendingStatuses = [
      TodoStatus.PENDING_APPROVAL as PrismaTodoStatus,
      TodoStatus.PENDING_OVERTIME_APPROVAL as PrismaTodoStatus,
    ];

    let pendingTodos: any[];

    if (actor.role === UserRole.CEO) {
      pendingTodos = await this.prisma.todo.findMany({
        where: { status: { in: pendingStatuses }, deletedAt: null },
        include: { user: { select: { id: true, fullName: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      });
    } else {
      const delegations = await this.prisma.approvalDelegation.findMany({
        where: { delegateUserId: actorId, activeUntil: null },
      });
      const requestorIds = delegations.map((d) => d.requestorUserId);
      pendingTodos = requestorIds.length
        ? await this.prisma.todo.findMany({
            where: { userId: { in: requestorIds }, status: { in: pendingStatuses }, deletedAt: null },
            include: { user: { select: { id: true, fullName: true, email: true } } },
            orderBy: { createdAt: 'asc' },
          })
        : [];
    }

    return Promise.all(
      pendingTodos.map(async (todo) => {
        const rows = await this.prisma.$queryRaw<{ approved_hours: number }[]>`
          SELECT COALESCE(SUM(estimated_hours)::float, 0) AS approved_hours
          FROM todos
          WHERE user_id = ${todo.userId}::uuid
            AND todo_date = ${todayStr}::date
            AND status NOT IN ('REJECTED','PENDING_APPROVAL','PENDING_OVERTIME_APPROVAL')
            AND deleted_at IS NULL
        `;
        const usedToday = Number(rows[0]?.approved_hours ?? 0);
        return { ...todo, usedToday, withThis: usedToday + todo.estimatedHours };
      }),
    );
  }

  async approve(id: string, actorId: string, dto: ApproveRejectTodoDto) {
    const todo = await this.findTodoOrFail(id);

    if (
      todo.status !== (TodoStatus.PENDING_APPROVAL as PrismaTodoStatus) &&
      todo.status !== (TodoStatus.PENDING_OVERTIME_APPROVAL as PrismaTodoStatus)
    ) {
      throw new ConflictException(`Todo is not pending approval (current: ${todo.status})`);
    }

    const canApprove = await this.delegations.canApprove(actorId, todo.userId);
    if (!canApprove) throw new ForbiddenException('You are not authorized to approve this todo');

    const actor = await this.prisma.user.findFirst({ where: { id: actorId } });
    const isDelegateAction = actor?.role !== UserRole.CEO;

    await this.prisma.$transaction(async (tx) => {
      await this.stateMachine.transition(
        todo,
        TodoStatus.APPROVED,
        actorId,
        isDelegateAction ? TodoTrigger.DELEGATE : TodoTrigger.CEO,
        dto.reason,
        tx,
      );

      await tx.approvalLog.create({
        data: {
          todoId: id,
          actorUserId: actorId,
          action: ApprovalAction.APPROVED,
          reason: dto.reason ?? null,
          isDelegateAction,
        },
      });

      await tx.notification.create({
        data: {
          recipientUserId: todo.userId,
          actorUserId: actorId,
          todoId: id,
          type: NotificationType.TODO_APPROVED,
          title: 'Todo Approved',
          body: `Your todo "${todo.title}" has been approved.`,
        },
      });
    });

    this.events.emit('dashboard.invalidate', { userId: todo.userId });
    this.sse.emit(todo.userId, { type: 'notification.new', data: {} });
    return this.findTodoOrFail(id);
  }

  async reject(id: string, actorId: string, dto: ApproveRejectTodoDto) {
    const todo = await this.findTodoOrFail(id);

    if (
      todo.status !== (TodoStatus.PENDING_APPROVAL as PrismaTodoStatus) &&
      todo.status !== (TodoStatus.PENDING_OVERTIME_APPROVAL as PrismaTodoStatus)
    ) {
      throw new ConflictException(`Todo is not pending approval (current: ${todo.status})`);
    }

    const canApprove = await this.delegations.canApprove(actorId, todo.userId);
    if (!canApprove) throw new ForbiddenException('You are not authorized to reject this todo');

    const actor = await this.prisma.user.findFirst({ where: { id: actorId } });
    const isDelegateAction = actor?.role !== UserRole.CEO;

    await this.prisma.$transaction(async (tx) => {
      await this.stateMachine.transition(
        todo,
        TodoStatus.REJECTED,
        actorId,
        isDelegateAction ? TodoTrigger.DELEGATE : TodoTrigger.CEO,
        dto.reason,
        tx,
      );

      await tx.approvalLog.create({
        data: {
          todoId: id,
          actorUserId: actorId,
          action: ApprovalAction.REJECTED,
          reason: dto.reason ?? null,
          isDelegateAction,
        },
      });

      await tx.notification.create({
        data: {
          recipientUserId: todo.userId,
          actorUserId: actorId,
          todoId: id,
          type: NotificationType.TODO_REJECTED,
          title: 'Todo Rejected',
          body: `Your todo "${todo.title}" has been rejected.${dto.reason ? ` Reason: ${dto.reason}` : ''}`,
        },
      });
    });

    this.events.emit('dashboard.invalidate', { userId: todo.userId });
    this.sse.emit(todo.userId, { type: 'notification.new', data: {} });
    return this.findTodoOrFail(id);
  }

  async start(id: string, userId: string) {
    const todo = await this.findTodoOrFail(id);
    this.assertOwner(todo, userId);

    if (
      todo.status !== (TodoStatus.APPROVED as PrismaTodoStatus) &&
      todo.status !== (TodoStatus.AUTO_APPROVED as PrismaTodoStatus)
    ) {
      throw new ConflictException(`Todo must be APPROVED or AUTO_APPROVED to start (current: ${todo.status})`);
    }

    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await this.stateMachine.transition(todo, TodoStatus.ONGOING, userId, TodoTrigger.USER, undefined, tx);
      await this.sessions.openSession(id, now, tx);
    });

    this.events.emit('dashboard.invalidate', { userId });
    return this.findTodoOrFail(id);
  }

  async pause(id: string, userId: string) {
    const todo = await this.findTodoOrFail(id);
    this.assertOwner(todo, userId);

    if (todo.status !== (TodoStatus.ONGOING as PrismaTodoStatus)) {
      throw new ConflictException(`Todo must be ONGOING to pause (current: ${todo.status})`);
    }

    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await this.sessions.closeSession(id, now, 'pause', tx);
      await this.stateMachine.transition(todo, TodoStatus.PAUSED, userId, TodoTrigger.USER, undefined, tx);
    });

    this.events.emit('dashboard.invalidate', { userId });
    return this.findTodoOrFail(id);
  }

  async resume(id: string, userId: string) {
    const todo = await this.findTodoOrFail(id);
    this.assertOwner(todo, userId);

    if (todo.status !== (TodoStatus.PAUSED as PrismaTodoStatus)) {
      throw new ConflictException(`Todo must be PAUSED to resume (current: ${todo.status})`);
    }

    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await this.stateMachine.transition(todo, TodoStatus.ONGOING, userId, TodoTrigger.USER, undefined, tx);
      await this.sessions.openSession(id, now, tx);
    });

    this.events.emit('dashboard.invalidate', { userId });
    return this.findTodoOrFail(id);
  }

  async complete(id: string, userId: string) {
    const todo = await this.findTodoOrFail(id);
    this.assertOwner(todo, userId);

    if (todo.status !== (TodoStatus.ONGOING as PrismaTodoStatus)) {
      throw new ConflictException(`Todo must be ONGOING to complete (current: ${todo.status})`);
    }

    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await this.sessions.closeSession(id, now, 'complete', tx);
      const totalSeconds = await this.sessions.sumElapsedSeconds(id, tx);

      await tx.todo.update({
        where: { id },
        data: { totalSeconds },
      });

      await this.stateMachine.transition(todo, TodoStatus.DONE, userId, TodoTrigger.USER, undefined, tx);
    });

    this.events.emit('dashboard.invalidate', { userId });
    return this.findTodoOrFail(id);
  }

  async autoApproveAllPending(): Promise<number> {
    const pending = await this.prisma.todo.findMany({
      where: {
        status: {
          in: [
            TodoStatus.PENDING_APPROVAL as PrismaTodoStatus,
            TodoStatus.PENDING_OVERTIME_APPROVAL as PrismaTodoStatus,
          ],
        },
      },
    });

    let count = 0;
    // Process in batches of 50
    for (let i = 0; i < pending.length; i += 50) {
      const batch = pending.slice(i, i + 50);
      await this.prisma.$transaction(async (tx) => {
        for (const todo of batch) {
          await this.stateMachine.transition(
            todo,
            TodoStatus.AUTO_APPROVED,
            null,
            TodoTrigger.SYSTEM,
            undefined,
            tx,
          );

          await tx.approvalLog.create({
            data: {
              todoId: todo.id,
              actorUserId: null,
              action: ApprovalAction.AUTO_APPROVED,
              isDelegateAction: false,
            },
          });

          await tx.notification.create({
            data: {
              recipientUserId: todo.userId,
              todoId: todo.id,
              type: NotificationType.TODO_AUTO_APPROVED,
              title: 'Todo Auto-Approved',
              body: `Your todo "${todo.title}" has been automatically approved.`,
            },
          });
        }
      });
      count += batch.length;
    }

    if (count > 0) {
      this.events.emit('dashboard.invalidate', {});
    }

    return count;
  }

  async softDelete(id: string, userId: string): Promise<void> {
    const todo = await this.findTodoOrFail(id);
    this.assertOwner(todo, userId);
    if (todo.status !== (TodoStatus.REJECTED as PrismaTodoStatus)) {
      throw new ConflictException(`Only rejected todos can be deleted (current: ${todo.status})`);
    }
    await this.prisma.todo.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async updateAndResubmit(id: string, userId: string, dto: UpdateTodoDto) {
    const todo = await this.findTodoOrFail(id);
    this.assertOwner(todo, userId);
    if (todo.status !== (TodoStatus.REJECTED as PrismaTodoStatus)) {
      throw new ConflictException(`Only rejected todos can be resubmitted (current: ${todo.status})`);
    }

    const todayStr = getTodayDateStringWIB();
    const existing = await this.prisma.$queryRaw<{ approved_hours: number }[]>`
      SELECT COALESCE(SUM(estimated_hours)::float, 0) AS approved_hours
      FROM todos
      WHERE user_id = ${userId}::uuid
        AND todo_date = ${todayStr}::date
        AND id != ${id}::uuid
        AND status NOT IN ('REJECTED', 'PENDING_APPROVAL', 'PENDING_OVERTIME_APPROVAL')
        AND deleted_at IS NULL
    `;
    const approvedHours = Number(existing[0]?.approved_hours ?? 0);
    const newEst = dto.estimatedHours ?? Number(todo.estimatedHours);
    const isOvertime = approvedHours + newEst > 8;
    const newStatus = isOvertime ? TodoStatus.PENDING_OVERTIME_APPROVAL : TodoStatus.PENDING_APPROVAL;

    await this.prisma.$transaction(async (tx) => {
      await tx.todo.update({
        where: { id },
        data: {
          title: dto.title ?? todo.title,
          description: dto.description ?? todo.description,
          estimatedHours: newEst,
          isOvertime,
          status: newStatus as PrismaTodoStatus,
          deletedAt: null,
        },
      });
      await tx.todoEvent.create({
        data: {
          todoId: id,
          actorUserId: userId,
          fromStatus: TodoStatus.REJECTED as PrismaTodoStatus,
          toStatus: newStatus as PrismaTodoStatus,
          triggeredBy: TodoTrigger.USER,
        },
      });
    });

    const { userId: approverId } = await this.delegations.resolveApprover(userId);
    await this.prisma.notification.create({
      data: {
        recipientUserId: approverId,
        actorUserId: userId,
        todoId: id,
        type: NotificationType.TODO_PENDING_APPROVAL,
        title: 'Todo Resubmitted',
        body: `Todo "${dto.title ?? todo.title}" has been resubmitted for approval.`,
      },
    });
    this.sse.emit(approverId, { type: 'notification.new', data: {} });
    this.events.emit('dashboard.invalidate', { userId });
    return this.findTodoOrFail(id);
  }

  async archiveTodo(id: string, userId: string): Promise<void> {
    const todo = await this.findTodoOrFail(id);
    this.assertOwner(todo, userId);
    if (todo.status !== (TodoStatus.DONE as PrismaTodoStatus)) {
      throw new ConflictException(`Only done todos can be archived (current: ${todo.status})`);
    }
    await this.prisma.todo.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async findArchived(userId: string) {
    return this.prisma.todo.findMany({
      where: {
        userId,
        status: TodoStatus.DONE as PrismaTodoStatus,
        deletedAt: { not: null },
      },
      include: {
        sessions: { where: { deletedAt: null } },
        approvalLogs: { orderBy: { actionedAt: 'desc' }, take: 1 },
      },
      orderBy: { deletedAt: 'desc' },
    });
  }

  async createForMember(dto: CreateTodoForMemberDto, ceoId: string) {
    const member = await this.prisma.user.findFirst({ where: { id: dto.targetUserId, isActive: true } });
    if (!member || member.role !== (UserRole.MEMBER as any)) {
      throw new ForbiddenException('Target must be an active member');
    }

    const todayStr = getTodayDateStringWIB();
    const todo = await this.prisma.$transaction(async (tx) => {
      const created = await tx.todo.create({
        data: {
          userId: dto.targetUserId,
          title: dto.title,
          description: dto.description,
          estimatedHours: dto.estimatedHours,
          status: TodoStatus.AUTO_APPROVED as PrismaTodoStatus,
          isOvertime: false,
          todoDate: new Date(todayStr),
        },
      });
      await tx.todoEvent.create({
        data: {
          todoId: created.id,
          actorUserId: ceoId,
          fromStatus: null,
          toStatus: TodoStatus.AUTO_APPROVED as PrismaTodoStatus,
          triggeredBy: TodoTrigger.CEO,
        },
      });
      return created;
    });

    await this.prisma.notification.create({
      data: {
        recipientUserId: dto.targetUserId,
        actorUserId: ceoId,
        todoId: todo.id,
        type: NotificationType.TODO_AUTO_APPROVED,
        title: 'Todo Dibuat CEO',
        body: `CEO telah membuat todo "${todo.title}" untuk Anda.`,
      },
    });
    this.sse.emit(dto.targetUserId, { type: 'notification.new', data: {} });
    this.events.emit('dashboard.invalidate', { userId: dto.targetUserId });
    return todo;
  }

  async carryOver(id: string, userId: string) {
    const todo = await this.findTodoOrFail(id);
    this.assertOwner(todo, userId);
    const allowedStatuses: PrismaTodoStatus[] = [
      TodoStatus.APPROVED as PrismaTodoStatus,
      TodoStatus.AUTO_APPROVED as PrismaTodoStatus,
      TodoStatus.PENDING_APPROVAL as PrismaTodoStatus,
      TodoStatus.PENDING_OVERTIME_APPROVAL as PrismaTodoStatus,
    ];
    if (!allowedStatuses.includes(todo.status)) {
      throw new ConflictException(
        `Only approved or pending todos can be carried over (current: ${todo.status})`,
      );
    }
    const nextDate = getNextWorkingDateWIB();
    await this.prisma.todo.update({
      where: { id },
      data: { todoDate: nextDate },
    });
    return this.findTodoOrFail(id);
  }

  private async findTodoOrFail(id: string): Promise<Todo> {
    const todo = await this.prisma.todo.findFirst({ where: { id } });
    if (!todo) throw new NotFoundException(`Todo ${id} not found`);
    return todo;
  }

  private assertOwner(todo: Todo, userId: string): void {
    if (todo.userId !== userId) throw new ForbiddenException('You do not own this todo');
  }
}

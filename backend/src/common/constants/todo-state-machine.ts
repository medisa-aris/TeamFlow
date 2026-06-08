import { TodoStatus } from '../enums/todo-status.enum';

export const ALLOWED_TRANSITIONS: Record<TodoStatus, TodoStatus[]> = {
  [TodoStatus.PENDING_APPROVAL]: [
    TodoStatus.APPROVED,
    TodoStatus.AUTO_APPROVED,
    TodoStatus.REJECTED,
  ],
  [TodoStatus.PENDING_OVERTIME_APPROVAL]: [
    TodoStatus.APPROVED,
    TodoStatus.AUTO_APPROVED,
    TodoStatus.REJECTED,
  ],
  [TodoStatus.APPROVED]: [TodoStatus.ONGOING],
  [TodoStatus.AUTO_APPROVED]: [TodoStatus.ONGOING],
  [TodoStatus.ONGOING]: [TodoStatus.PAUSED, TodoStatus.DONE],
  [TodoStatus.PAUSED]: [TodoStatus.ONGOING],
  [TodoStatus.REJECTED]: [],
  [TodoStatus.DONE]: [],
};

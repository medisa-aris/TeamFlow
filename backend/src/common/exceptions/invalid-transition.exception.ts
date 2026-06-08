import { BadRequestException } from '@nestjs/common';
import { TodoStatus } from '../enums/todo-status.enum';

export class InvalidTransitionException extends BadRequestException {
  constructor(from: TodoStatus, to: TodoStatus) {
    super(`Invalid status transition from ${from} to ${to}`);
  }
}

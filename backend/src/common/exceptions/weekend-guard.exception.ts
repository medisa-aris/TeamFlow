import { UnprocessableEntityException } from '@nestjs/common';

export class WeekendGuardException extends UnprocessableEntityException {
  constructor() {
    super('Todo submission is not allowed on weekends (Saturday/Sunday)');
  }
}

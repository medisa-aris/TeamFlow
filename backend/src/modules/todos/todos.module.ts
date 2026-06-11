import { Module } from '@nestjs/common';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';
import { TodoStateMachineService } from './todo-state-machine.service';
import { TodoSessionsService } from './todo-sessions.service';
import { DelegationsModule } from '../delegations/delegations.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SystemConfigModule } from '../system-config/system-config.module';

@Module({
  imports: [DelegationsModule, NotificationsModule, SystemConfigModule],
  controllers: [TodosController],
  providers: [TodosService, TodoStateMachineService, TodoSessionsService],
  exports: [TodosService, TodoStateMachineService],
})
export class TodosModule {}

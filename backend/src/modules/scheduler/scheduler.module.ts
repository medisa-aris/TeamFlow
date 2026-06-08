import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { AutoApproveScheduler } from './auto-approve.scheduler';
import { AutoApproveProcessor } from './auto-approve.processor';
import { TodosModule } from '../todos/todos.module';
import { QUEUE_AUTO_APPROVE } from '../../common/constants/queue-names';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue({ name: QUEUE_AUTO_APPROVE }),
    TodosModule,
  ],
  providers: [AutoApproveScheduler, AutoApproveProcessor],
})
export class SchedulerModule {}

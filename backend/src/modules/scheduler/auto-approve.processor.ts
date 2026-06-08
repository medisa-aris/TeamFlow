import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { TodosService } from '../todos/todos.service';
import { isWeekendInWIB } from '../../common/utils/working-day.util';
import { QUEUE_AUTO_APPROVE } from '../../common/constants/queue-names';

@Processor(QUEUE_AUTO_APPROVE)
export class AutoApproveProcessor extends WorkerHost {
  private readonly logger = new Logger(AutoApproveProcessor.name);

  constructor(private readonly todosService: TodosService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (isWeekendInWIB()) {
      this.logger.warn('Auto-approve processor: defensive weekend check triggered — skipping');
      return;
    }

    this.logger.log(`Processing auto-approve job for date: ${job.data.date}`);
    const count = await this.todosService.autoApproveAllPending();
    this.logger.log(`Auto-approved ${count} todos`);
  }
}

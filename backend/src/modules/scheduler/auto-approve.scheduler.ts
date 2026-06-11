import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { format } from 'date-fns-tz';
import { isWeekendInWIB, getNowWIB } from '../../common/utils/working-day.util';
import { QUEUE_AUTO_APPROVE } from '../../common/constants/queue-names';
import { SystemConfigService } from '../system-config/system-config.service';

@Injectable()
export class AutoApproveScheduler {
  private readonly logger = new Logger(AutoApproveScheduler.name);

  constructor(
    @InjectQueue(QUEUE_AUTO_APPROVE) private readonly queue: Queue,
    private readonly systemConfig: SystemConfigService,
  ) {}

  // Runs every hour (01:00-06:00 UTC = 08:00-13:00 WIB) Mon-Fri
  // Only queues a job when current WIB hour matches the configured deadline
  @Cron('0 1-6 * * 1-5', { timeZone: 'UTC' })
  async scheduleAutoApprove(): Promise<void> {
    const nowWIB = getNowWIB();
    if (isWeekendInWIB()) {
      this.logger.log('Auto-approve scheduler: skipping weekend');
      return;
    }

    const deadlineHour = await this.systemConfig.getDeadlineHour();
    const currentHour = nowWIB.getHours();
    if (currentHour !== deadlineHour) {
      this.logger.debug(`Auto-approve: hour ${currentHour} !== deadline ${deadlineHour}, skipping`);
      return;
    }

    const dateKey = format(nowWIB, 'yyyy-MM-dd', { timeZone: 'Asia/Jakarta' });
    const jobId = `auto-approve-${dateKey}`;

    await this.queue.add(
      'auto-approve',
      { date: dateKey },
      {
        jobId,
        removeOnComplete: 100,
        attempts: 3,
        backoff: { type: 'exponential', delay: 10000 },
      },
    );

    this.logger.log(`Auto-approve job queued for ${dateKey} (deadline: ${deadlineHour}:00 WIB)`);
  }
}

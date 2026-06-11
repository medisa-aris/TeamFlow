import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SystemConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    const config = await this.prisma.systemConfig.upsert({
      where: { id: 1 },
      create: { id: 1, approvalDeadlineHour: 9 },
      update: {},
    });
    return config;
  }

  async getDeadlineHour(): Promise<number> {
    const config = await this.get();
    return config.approvalDeadlineHour;
  }

  async update(approvalDeadlineHour: number) {
    return this.prisma.systemConfig.upsert({
      where: { id: 1 },
      create: { id: 1, approvalDeadlineHour },
      update: { approvalDeadlineHour },
    });
  }
}

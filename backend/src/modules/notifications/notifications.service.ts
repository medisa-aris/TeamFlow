import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SseService } from './sse/sse.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sse: SseService,
  ) {}

  async findAll(userId: string, unreadOnly?: boolean) {
    const where: any = { recipientUserId: userId };
    if (unreadOnly) where.readAt = null;

    const [notifications, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.notification.count({
        where: { recipientUserId: userId, readAt: null },
      }),
    ]);

    return { notifications, unreadCount };
  }

  async markRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.recipientUserId !== userId) {
      throw new ForbiddenException('Cannot mark another user\'s notification as read');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async remove(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.recipientUserId !== userId) {
      throw new ForbiddenException('Cannot delete another user\'s notification');
    }
    await this.prisma.notification.delete({ where: { id } });
  }

  async removeAll(userId: string) {
    await this.prisma.notification.deleteMany({ where: { recipientUserId: userId } });
  }

  async pushToUser(userId: string, data: Record<string, unknown>): Promise<void> {
    this.sse.emit(userId, { data, type: 'notification.new' });
  }
}

import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDelegationDto } from './dto/create-delegation.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { NotificationType } from '../../common/enums/notification-type.enum';

@Injectable()
export class DelegationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDelegationDto, actorId: string) {
    if (dto.requestorUserId === dto.delegateUserId) {
      throw new UnprocessableEntityException('Cannot delegate to the same user as requestor');
    }

    const delegate = await this.prisma.user.findFirst({ where: { id: dto.delegateUserId, isActive: true } });
    if (!delegate) throw new NotFoundException('Delegate user not found or inactive');

    const requestor = await this.prisma.user.findFirst({ where: { id: dto.requestorUserId, isActive: true } });
    if (!requestor) throw new NotFoundException('Requestor user not found or inactive');

    return this.prisma.$transaction(async (tx) => {
      // Revoke existing active delegation for this requestor
      const existing = await tx.approvalDelegation.findFirst({
        where: { requestorUserId: dto.requestorUserId, activeUntil: null },
      });

      if (existing) {
        await tx.approvalDelegation.update({
          where: { id: existing.id },
          data: { activeUntil: new Date() },
        });

        // Notify previous delegate of revocation
        await tx.notification.create({
          data: {
            recipientUserId: existing.delegateUserId,
            actorUserId: actorId,
            type: NotificationType.DELEGATION_REVOKED,
            title: 'Delegation Revoked',
            body: `Your delegation authority for ${requestor.fullName} has been revoked.`,
          },
        });
      }

      const delegation = await tx.approvalDelegation.create({
        data: {
          requestorUserId: dto.requestorUserId,
          delegateUserId: dto.delegateUserId,
          delegatedByUserId: actorId,
        },
        include: {
          requestor: { select: { id: true, fullName: true, email: true } },
          delegate: { select: { id: true, fullName: true, email: true } },
        },
      });

      // Notify new delegate
      await tx.notification.create({
        data: {
          recipientUserId: dto.delegateUserId,
          actorUserId: actorId,
          type: NotificationType.DELEGATION_CREATED,
          title: 'Delegation Assigned',
          body: `You have been assigned as the approval delegate for ${requestor.fullName}.`,
        },
      });

      return delegation;
    });
  }

  async findAll() {
    return this.prisma.approvalDelegation.findMany({
      include: {
        requestor: { select: { id: true, fullName: true, email: true } },
        delegate: { select: { id: true, fullName: true, email: true } },
        delegatedBy: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(id: string, actorId: string) {
    const delegation = await this.prisma.approvalDelegation.findFirst({
      where: { id, activeUntil: null },
      include: {
        requestor: { select: { fullName: true } },
      },
    });
    if (!delegation) throw new NotFoundException('Active delegation not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.approvalDelegation.update({
        where: { id },
        data: { activeUntil: new Date() },
      });

      await tx.notification.create({
        data: {
          recipientUserId: delegation.delegateUserId,
          actorUserId: actorId,
          type: NotificationType.DELEGATION_REVOKED,
          title: 'Delegation Revoked',
          body: `Your delegation authority for ${delegation.requestor.fullName} has been revoked.`,
        },
      });
    });

    return { message: 'Delegation revoked' };
  }

  async resolveApprover(requestorUserId: string): Promise<{ userId: string; isDelegated: boolean }> {
    const delegation = await this.prisma.approvalDelegation.findFirst({
      where: { requestorUserId, activeUntil: null },
    });

    if (delegation) {
      return { userId: delegation.delegateUserId, isDelegated: true };
    }

    const ceo = await this.prisma.user.findFirst({
      where: { role: UserRole.CEO, isActive: true },
    });

    if (!ceo) throw new UnprocessableEntityException('No active CEO found to receive approval');
    return { userId: ceo.id, isDelegated: false };
  }

  async canApprove(actorId: string, requestorId: string): Promise<boolean> {
    const actor = await this.prisma.user.findFirst({ where: { id: actorId } });
    if (!actor) return false;
    if (actor.role === UserRole.CEO) return true;

    const delegation = await this.prisma.approvalDelegation.findFirst({
      where: {
        requestorUserId: requestorId,
        delegateUserId: actorId,
        activeUntil: null,
      },
    });

    return !!delegation;
  }
}

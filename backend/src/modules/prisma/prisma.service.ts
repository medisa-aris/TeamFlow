import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
    });

    // Soft-delete middleware
    (this as any).$use(async (params: any, next: any) => {
      const softDeleteModels = [
        'User', 'ApprovalDelegation', 'RefreshToken', 'Todo',
        'TodoSession', 'TodoEvent', 'ApprovalLog', 'Notification',
      ];

      if (softDeleteModels.includes(params.model)) {
        if (params.action === 'delete') {
          params.action = 'update';
          params.args['data'] = { deletedAt: new Date() };
        }
        if (params.action === 'deleteMany') {
          params.action = 'updateMany';
          if (params.args.data !== undefined) {
            params.args.data.deletedAt = new Date();
          } else {
            params.args['data'] = { deletedAt: new Date() };
          }
        }
        if (['findMany', 'findFirst', 'findUnique', 'count', 'findFirstOrThrow', 'findUniqueOrThrow'].includes(params.action)) {
          if (params.args.where) {
            if (params.args.where.deletedAt === undefined) {
              params.args.where.deletedAt = null;
            }
          } else {
            params.args = { ...params.args, where: { deletedAt: null } };
          }
        }
      }

      return next(params);
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

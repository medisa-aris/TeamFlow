import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  Res,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { Observable, interval, merge } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';
import { NotificationsService } from './notifications.service';
import { SseService, SseEvent } from './sse/sse.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly sseService: SseService,
  ) {}

  @Get('notifications')
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('unread_only') unreadOnly?: string,
  ) {
    return this.notificationsService.findAll(user.sub, unreadOnly === 'true');
  }

  @Patch('notifications/:id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.notificationsService.markRead(id, user.sub);
  }

  @Sse('events/stream')
  stream(
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Observable<SseEvent> {
    const subject = this.sseService.getOrCreateSubject(user.sub);
    const heartbeat$ = interval(30000).pipe(
      map(() => ({ data: { type: 'heartbeat' } })),
    );
    const stream$ = merge(subject.asObservable(), heartbeat$);

    req.on('close', () => {
      this.sseService.removeConnection(user.sub);
    });

    return stream$;
  }
}

import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('user/:userId')
  getUserReport(@Param('userId') userId: string, @Query('date') date?: string) {
    return this.reportsService.getUserReport(userId, date);
  }
}

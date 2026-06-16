import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('weekly')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CEO)
  getWeeklySummary(@Query('period') period?: string) {
    return this.reportsService.getWeeklySummary(period);
  }

  @Get('user/:userId')
  getUserReport(@Param('userId') userId: string, @Query('date') date?: string) {
    return this.reportsService.getUserReport(userId, date);
  }
}

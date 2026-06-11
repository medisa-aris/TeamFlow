import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { IsInt, Min, Max } from 'class-validator';

class UpdateSystemConfigDto {
  @IsInt()
  @Min(7)
  @Max(12)
  approvalDeadlineHour: number;
}

@Controller('system-config')
@UseGuards(JwtAuthGuard)
export class SystemConfigController {
  constructor(private readonly service: SystemConfigService) {}

  @Get()
  get() {
    return this.service.get();
  }

  @Patch()
  @UseGuards(RolesGuard)
  @Roles(UserRole.CEO)
  update(@Body() dto: UpdateSystemConfigDto) {
    return this.service.update(dto.approvalDeadlineHour);
  }
}

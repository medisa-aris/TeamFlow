import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { DelegationsService } from './delegations.service';
import { CreateDelegationDto } from './dto/create-delegation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('delegations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CEO)
export class DelegationsController {
  constructor(private readonly delegationsService: DelegationsService) {}

  @Post()
  create(@Body() dto: CreateDelegationDto, @CurrentUser() user: JwtPayload) {
    return this.delegationsService.create(dto, user.sub);
  }

  @Get()
  findAll() {
    return this.delegationsService.findAll();
  }

  @Delete(':id')
  revoke(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.delegationsService.revoke(id, user.sub);
  }
}

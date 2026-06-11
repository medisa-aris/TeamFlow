import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { ApproveRejectTodoDto } from './dto/approve-reject-todo.dto';
import { ListTodosQueryDto } from './dto/list-todos-query.dto';
import { CreateTodoForMemberDto } from './dto/create-todo-for-member.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('todos')
@UseGuards(JwtAuthGuard)
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.MEMBER)
  create(@Body() dto: CreateTodoDto, @CurrentUser() user: JwtPayload) {
    return this.todosService.create(dto, user.sub);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query() query: ListTodosQueryDto) {
    return this.todosService.findAll(user.sub, query);
  }

  @Get('pending-approvals')
  getPendingApprovals(@CurrentUser() user: JwtPayload) {
    return this.todosService.getPendingApprovals(user.sub);
  }

  @Get('archived')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MEMBER)
  findArchived(@CurrentUser() user: JwtPayload) {
    return this.todosService.findArchived(user.sub);
  }

  @Post('for-member')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CEO)
  createForMember(@Body() dto: CreateTodoForMemberDto, @CurrentUser() user: JwtPayload) {
    return this.todosService.createForMember(dto, user.sub);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MEMBER)
  softDelete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.todosService.softDelete(id, user.sub);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MEMBER)
  updateAndResubmit(
    @Param('id') id: string,
    @Body() dto: UpdateTodoDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.todosService.updateAndResubmit(id, user.sub, dto);
  }

  @Post(':id/archive')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MEMBER)
  archiveTodo(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.todosService.archiveTodo(id, user.sub);
  }

  @Post(':id/carry-over')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MEMBER)
  carryOver(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.todosService.carryOver(id, user.sub);
  }

  @Patch(':id/approve')
  approve(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ApproveRejectTodoDto,
  ) {
    return this.todosService.approve(id, user.sub, dto);
  }

  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ApproveRejectTodoDto,
  ) {
    return this.todosService.reject(id, user.sub, dto);
  }

  @Post(':id/start')
  start(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.todosService.start(id, user.sub);
  }

  @Post(':id/pause')
  pause(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.todosService.pause(id, user.sub);
  }

  @Post(':id/resume')
  resume(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.todosService.resume(id, user.sub);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.todosService.complete(id, user.sub);
  }
}

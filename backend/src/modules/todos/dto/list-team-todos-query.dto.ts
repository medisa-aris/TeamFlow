import { IsOptional, IsDateString, IsUUID, IsEnum, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import { TodoStatus } from '../../../common/enums/todo-status.enum';

export class ListTeamTodosQueryDto {
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  userId?: string[];

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(TodoStatus, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  status?: TodoStatus[];
}

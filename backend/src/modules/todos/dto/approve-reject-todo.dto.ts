import { IsOptional, IsString } from 'class-validator';

export class ApproveRejectTodoDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

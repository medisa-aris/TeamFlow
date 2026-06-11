import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTodoForMemberDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn([0.5, 1.0, 1.5, 2.0], { message: 'estimatedHours must be one of 0.5, 1.0, 1.5, or 2.0' })
  @Transform(({ value }) => parseFloat(value))
  estimatedHours: number;

  @IsUUID()
  targetUserId: string;
}

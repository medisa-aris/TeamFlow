import { IsIn, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateTodoDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn([0.5, 1.0, 1.5, 2.0], { message: 'estimatedHours must be one of 0.5, 1.0, 1.5, or 2.0' })
  @Transform(({ value }) => parseFloat(value))
  estimatedHours?: number;
}

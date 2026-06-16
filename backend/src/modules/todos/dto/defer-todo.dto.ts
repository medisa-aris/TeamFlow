import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class DeferTodoDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  reason: string;
}

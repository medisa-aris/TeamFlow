import { IsBoolean, IsOptional, IsString, MinLength, Matches } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  fullName?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  /** Password baru (opsional — hanya diisi jika ingin reset password user) */
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @Matches(/(?=.*[A-Z])(?=.*[0-9])/, {
    message: 'Password harus mengandung minimal 1 huruf kapital dan 1 angka',
  })
  password?: string;
}

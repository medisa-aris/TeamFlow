import { Body, Controller, Post, Patch, UseGuards } from '@nestjs/common';
import { IsString, MinLength, Matches } from 'class-validator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

class ChangePasswordDto {
  @IsString() currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @Matches(/(?=.*[A-Z])(?=.*[0-9])/, {
    message: 'Password harus mengandung minimal 1 huruf kapital dan 1 angka',
  })
  newPassword: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Body() dto: RefreshTokenDto) {
    await this.authService.logout(dto.refreshToken);
    return { message: 'Logged out successfully' };
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@CurrentUser() user: JwtPayload, @Body() dto: ChangePasswordDto) {
    await this.authService.changePassword(user.sub, dto.currentPassword, dto.newPassword);
    return { message: 'Password berhasil diubah. Silakan login ulang di perangkat lain.' };
  }
}

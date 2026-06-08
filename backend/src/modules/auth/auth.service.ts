import {
  Injectable,
  UnauthorizedException,
  TooManyRequestsException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, isActive: true },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new TooManyRequestsException('Account is temporarily locked. Try again later.');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordValid) {
      const newFailedCount = user.failedLoginAttempts + 1;
      const updateData: any = { failedLoginAttempts: newFailedCount };

      if (newFailedCount >= MAX_FAILED_ATTEMPTS) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + LOCKOUT_MINUTES);
        updateData.lockedUntil = lockUntil;
        updateData.failedLoginAttempts = 0;
      }

      await this.prisma.user.update({ where: { id: user.id }, data: updateData });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    const accessToken = this.signAccessToken(user);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async refresh(rawToken: string) {
    const tokens = await this.prisma.refreshToken.findMany({
      where: { revokedAt: null },
      include: { user: true },
    });

    let matched: (typeof tokens)[number] | undefined;
    for (const t of tokens) {
      if (t.expiresAt < new Date()) continue;
      const ok = await bcrypt.compare(rawToken, t.tokenHash);
      if (ok) { matched = t; break; }
    }

    if (!matched) throw new UnauthorizedException('Invalid or expired refresh token');

    const accessToken = this.signAccessToken(matched.user);
    return { accessToken };
  }

  async logout(rawToken: string): Promise<void> {
    const tokens = await this.prisma.refreshToken.findMany({
      where: { revokedAt: null },
    });

    for (const t of tokens) {
      const ok = await bcrypt.compare(rawToken, t.tokenHash);
      if (ok) {
        await this.prisma.refreshToken.update({
          where: { id: t.id },
          data: { revokedAt: new Date() },
        });
        return;
      }
    }
  }

  private signAccessToken(user: { id: string; email: string; role: string }): string {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const privateKeyBase64 = this.configService.get<string>('JWT_PRIVATE_KEY')!;
    const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');

    return this.jwtService.sign(payload, {
      privateKey,
      algorithm: 'RS256',
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
    });
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const rawToken = uuidv4();
    const tokenHash = await bcrypt.hash(rawToken, 12);
    const expiresAt = new Date();
    const days = parseInt(
      (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') ?? '7d').replace('d', ''),
      10,
    );
    expiresAt.setDate(expiresAt.getDate() + days);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    return rawToken;
  }
}

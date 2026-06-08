import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findFirst({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        passwordHash,
        role: dto.role,
      },
    });

    return this.toSafeUser(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOneOrFail(id);
    const user = await this.prisma.user.update({ where: { id }, data: dto });
    return this.toSafeUser(user);
  }

  async findAll() {
    const users = await this.prisma.user.findMany({ orderBy: { fullName: 'asc' } });
    return users.map(this.toSafeUser);
  }

  async findOneOrFail(id: string) {
    const user = await this.prisma.user.findFirst({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  private toSafeUser(user: any) {
    const { passwordHash: _pw, ...safe } = user;
    return safe;
  }
}

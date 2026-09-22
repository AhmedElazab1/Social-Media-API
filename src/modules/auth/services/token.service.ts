import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { Role } from '../../../generated/prisma/enums.js';
import type { StringValue } from 'ms';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateSecureToken(): string {
    return randomBytes(32).toString('hex');
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async generateAccessToken(
    userId: string,
    email: string,
    role: Role,
  ): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: userId,
        email,
        role,
      },
      {
        expiresIn: this.configService.getOrThrow<StringValue>('JWT_EXP'),
      },
    );
  }
}

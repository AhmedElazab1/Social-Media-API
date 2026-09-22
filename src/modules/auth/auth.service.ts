import { Injectable, UnauthorizedException } from '@nestjs/common';

import { UsersService } from '../users/users.service.js';
import { TokenService } from './services/token.service.js';
import { RefreshTokenService } from './services/refresh-token.service.js';

import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

import { UserResponseDto } from '../users/dto/user-response.dto.js';
import { toUserResponse } from '../users/users.mapper.js';

import { LoginResult } from './types/auth.types.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async register(registerDto: RegisterDto): Promise<UserResponseDto> {
    const passwordHash = await this.tokenService.hashPassword(
      registerDto.password,
    );

    const user = await this.usersService.create({
      email: registerDto.email.toLowerCase(),
      username: registerDto.username.toLowerCase(),
      passwordHash,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
    });

    return toUserResponse(user);
  }

  async login(loginDto: LoginDto): Promise<LoginResult> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await this.tokenService.comparePassword(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.tokenService.generateAccessToken(
      user.id,
      user.email,
      user.role,
    );

    const refreshToken = await this.refreshTokenService.create(user.id);

    return {
      accessToken,
      refreshToken: refreshToken.refreshToken,
      user: toUserResponse(user),
    };
  }

  async refresh(refreshToken: string): Promise<LoginResult> {
    const newRefreshToken =
      await this.refreshTokenService.rotateToken(refreshToken);

    const user = await this.usersService.findUserById(newRefreshToken.userId);

    const accessToken = await this.tokenService.generateAccessToken(
      user.id,
      user.email,
      user.role,
    );

    return {
      accessToken,
      refreshToken: newRefreshToken.refreshToken,
      user,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokenService.revoke(refreshToken);
  }

  async logoutAll(userId: string) {
    await this.refreshTokenService.revokeAll(userId);

    return {
      message: 'Logged out from all devices successfully',
    };
  }
}

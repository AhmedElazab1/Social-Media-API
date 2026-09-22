import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import type { Request, Response } from 'express';

import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto, LoginResponseDto } from './dto/login.dto.js';
import { UserResponseDto } from '../users/dto/user-response.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { ConfigService } from '@nestjs/config';

interface AuthCookies {
  refreshToken?: string;
}

class MessageResponseDto {
  message: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private getRefreshCookieOptions() {
    return {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax' as const,
      path: '/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or email/username already taken',
  })
  register(@Body() registerDto: RegisterDto): Promise<UserResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiResponse({
    status: 200,
    description:
      'Returns an access token. A HttpOnly refresh token cookie is also set.',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponseDto> {
    const result = await this.authService.login(loginDto);

    response.cookie(
      'refreshToken',
      result.refreshToken,
      this.getRefreshCookieOptions(),
    );

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('refreshToken')
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Reads the `refreshToken` HttpOnly cookie, validates and rotates it, and returns a new access token. The old refresh token cookie is replaced with a new one.',
  })
  @ApiResponse({
    status: 200,
    description: 'New access token issued',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token missing, invalid, or revoked',
  })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponseDto> {
    const cookies = request.cookies as AuthCookies;

    const refreshToken = cookies.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const result = await this.authService.refresh(refreshToken);

    response.cookie(
      'refreshToken',
      result.refreshToken,
      this.getRefreshCookieOptions(),
    );

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('refreshToken')
  @ApiOperation({
    summary: 'Log out from the current session',
    description:
      'Revokes the current `refreshToken` cookie session and clears the cookie. If no cookie is present the request still succeeds.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    type: MessageResponseDto,
  })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    const cookies = request.cookies as AuthCookies;

    const refreshToken = cookies.refreshToken;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    response.clearCookie('refreshToken', this.getRefreshCookieOptions());

    return {
      message: 'Logged out successfully',
    };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Log out from all sessions',
    description:
      'Revokes every active refresh token session for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out from all devices',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  async logoutAll(@Req() req: Request) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }
    return this.authService.logoutAll(req.user.userId);
  }
}

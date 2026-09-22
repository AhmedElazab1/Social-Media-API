import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';

import { UsersService } from './users.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { Roles } from 'src/common/decorators/roles.decorator.js';
import { Role } from 'src/generated/prisma/enums.js';
import { RolesGuard } from 'src/common/guards/roles.guard.js';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto.js';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto.js';
import { ListQueryDto } from 'src/common/dto/list-query.dto.js';
import { UpdateMeDto } from './dto/update-me.dto.js';

@ApiExtraModels(PaginatedResponseDto, UserResponseDto, PaginationMetaDto)
@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.USER, Role.ADMIN)
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'List of users',
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: {
                $ref: getSchemaPath(UserResponseDto),
              },
            },
            meta: {
              $ref: getSchemaPath(PaginationMetaDto),
            },
          },
        },
      ],
    },
  })
  findAll(
    @Query() listQueryDto: ListQueryDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    return this.usersService.findAll(listQueryDto);
  }

  @Roles(Role.USER, Role.ADMIN)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'The authenticated user profile',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid access token',
  })
  getMe(
    @CurrentUser() user: { userId: string; email: string },
  ): Promise<UserResponseDto> {
    return this.usersService.findOne(user.userId);
  }

  @Roles(Role.USER, Role.ADMIN)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 'cuid2abc123',
  })
  @ApiResponse({
    status: 200,
    description: 'User found',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Roles(Role.USER, Role.ADMIN)
  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update the currently authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  updateMe(
    @CurrentUser() user: { userId: string },
    @Body() updateMeDto: UpdateMeDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateMe(user.userId, updateMeDto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 'cuid2abc123',
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 'cuid2abc123',
  })
  @ApiResponse({
    status: 204,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ListQueryDto } from '../../common/dto/list-query.dto.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto.js';
import { PostResponseDto } from './dto/post-response.dto.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { PostsService } from './posts.service.js';
import { UpdatePostDto } from './dto/update-post.dto.js';
import { CreateMediaDto } from './dto/create-media.dto.js';

@ApiExtraModels(PaginatedResponseDto, PostResponseDto, PaginationMetaDto)
@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // ─── Public ──────────────────────────────────────────────────────────────────

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all posts' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page, max 100 (default: 20)',
    example: 20,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Field to sort by. Allowed: `createdAt`, `updatedAt`',
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort direction (default: desc)',
    example: 'desc',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    type: String,
    description:
      'Filter in `field:value` format. Allowed fields: `content`, `authorId`',
    example: 'authorId:abc123',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term matched against post content and author username',
    example: 'hello world',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of posts',
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(PostResponseDto) },
            },
            meta: { $ref: getSchemaPath(PaginationMetaDto) },
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  findAll(
    @Query() query: ListQueryDto,
  ): Promise<PaginatedResponseDto<PostResponseDto>> {
    return this.postsService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a post by ID' })
  @ApiParam({ name: 'id', description: 'Post ID', example: 'cuid2abc123' })
  @ApiResponse({
    status: 200,
    description: 'Post found',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  findOne(@Param('id') id: string): Promise<PostResponseDto> {
    return this.postsService.findById(id);
  }

  // ─── Authenticated ────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new post' })
  @ApiBody({ type: CreatePostDto })
  @ApiResponse({
    status: 201,
    description: 'Post created successfully',
    type: PostResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or post has no content or media',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  create(
    @CurrentUser('userId') userId: string,
    @Body() createPostDto: CreatePostDto,
  ): Promise<PostResponseDto> {
    return this.postsService.create(userId, createPostDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a post' })
  @ApiParam({ name: 'id', description: 'Post ID', example: 'cuid2abc123' })
  @ApiBody({ type: UpdatePostDto })
  @ApiResponse({
    status: 200,
    description: 'Post updated successfully',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'You are not the post owner' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  update(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    return this.postsService.update(id, userId, updatePostDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a post' })
  @ApiParam({ name: 'id', description: 'Post ID', example: 'cuid2abc123' })
  @ApiResponse({ status: 204, description: 'Post deleted successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'You are not the post owner' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  remove(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ): Promise<void> {
    return this.postsService.remove(id, userId);
  }

  @Post(':id/media')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a media file to a post' })
  @ApiParam({ name: 'id', description: 'Post ID', example: 'cuid2abc123' })
  @ApiBody({ type: CreateMediaDto })
  @ApiResponse({
    status: 201,
    description: 'Media added; returns the updated post',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'You are not the post owner' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  addMedia(
    @Param('id') postId: string,
    @CurrentUser('userId') userId: string,
    @Body() createMediaDto: CreateMediaDto,
  ): Promise<PostResponseDto> {
    return this.postsService.addMedia(postId, userId, createMediaDto);
  }

  @Delete(':id/media/:mediaId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a media file from a post' })
  @ApiParam({ name: 'id', description: 'Post ID', example: 'cuid2abc123' })
  @ApiParam({
    name: 'mediaId',
    description: 'Media ID',
    example: 'cuid2xyz789',
  })
  @ApiResponse({
    status: 200,
    description: 'Media removed; returns the updated post',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'You are not the post owner' })
  @ApiResponse({ status: 404, description: 'Post or media not found' })
  removeMedia(
    @Param('id') postId: string,
    @Param('mediaId') mediaId: string,
    @CurrentUser('userId') userId: string,
  ): Promise<PostResponseDto> {
    return this.postsService.removeMedia(postId, mediaId, userId);
  }
}

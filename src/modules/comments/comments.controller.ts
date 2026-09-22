import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ListQueryDto } from '../../common/dto/list-query.dto.js';

import { CommentsService } from './comments.service.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { UpdateCommentDto } from './dto/update-comment.dto.js';
import { CommentResponseDto } from './dto/comment-response.dto.js';

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('posts/:postId/comments')
  @UseGuards(JwtAuthGuard)
  create(
    @Param('postId') postId: string,
    @CurrentUser('userId') userId: string,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.commentsService.create(userId, postId, createCommentDto);
  }

  @Get('posts/:postId/comments')
  findAll(
    @Param('postId') postId: string,
    @Query() listQueryDto: ListQueryDto,
  ) {
    return this.commentsService.findAll(postId, listQueryDto);
  }

  @Get('comments/:id')
  findById(@Param('id') id: string): Promise<CommentResponseDto> {
    return this.commentsService.findById(id);
  }

  @Patch('comments/:id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.commentsService.update(id, userId, updateCommentDto);
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    await this.commentsService.remove(id, userId);

    return {
      message: 'Comment deleted successfully',
    };
  }
}

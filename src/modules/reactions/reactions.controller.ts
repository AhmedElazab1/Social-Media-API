import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { CreateReactionDto } from './dto/create-reaction.dto.js';
import { ReactionsService } from './reactions.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller()
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('posts/:postId/reactions')
  async reactToPost(
    @CurrentUser('userId') userId: string,
    @Param('postId') postId: string,
    @Body() createReactionDto: CreateReactionDto,
  ) {
    return this.reactionsService.reactToPost(userId, postId, createReactionDto);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('comments/:commentId/reactions')
  async reactToComment(
    @CurrentUser('userId') userId: string,
    @Param('commentId') commentId: string,
    @Body() createReactionDto: CreateReactionDto,
  ) {
    return this.reactionsService.reactToComment(
      userId,
      commentId,
      createReactionDto,
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('posts/:postId/reactions')
  async removePostReaction(
    @CurrentUser('userId') userId: string,
    @Param('postId') postId: string,
  ) {
    return this.reactionsService.removePostReaction(userId, postId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('comments/:commentId/reactions')
  async removeCommentReaction(
    @CurrentUser('userId') userId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.reactionsService.removeCommentReaction(userId, commentId);
  }
}

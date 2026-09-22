import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { FollowsService } from './follows.service.js';
import { ListQueryDto } from '../../common/dto/list-query.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post(':userId/follow')
  async follow(
    @CurrentUser('userId') userId: string,
    @Param('userId') followingId: string,
  ) {
    return this.followsService.follow(userId, followingId);
  }

  @Delete(':userId/follow')
  async unfollow(
    @CurrentUser('userId') userId: string,
    @Param('userId') followingId: string,
  ) {
    return this.followsService.unfollow(userId, followingId);
  }

  @Get(':userId/followers')
  async getFollowers(
    @Param('userId') userId: string,
    @CurrentUser('userId') currentUserId: string,
    @Query() listQueryDto: ListQueryDto,
  ) {
    return this.followsService.findFollowers(userId, listQueryDto);
  }

  @Get(':userId/following')
  async getFollowing(
    @Param('userId') userId: string,
    @Query() listQueryDto: ListQueryDto,
  ) {
    return this.followsService.findFollowing(userId, listQueryDto);
  }
}

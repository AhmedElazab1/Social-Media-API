import { Prisma } from '../../generated/prisma/client.js';

import { PostResponseDto } from './dto/post-response.dto.js';

type PostWithRelations = Prisma.PostGetPayload<{
  include: {
    author: {
      select: {
        id: true;
        username: true;
        profilePicture: true;
      };
    };

    mediaFiles: {
      select: {
        id: true;
        url: true;
        type: true;
      };
    };

    _count: {
      select: {
        comments: true;
        likes: true;
      };
    };
  };
}>;

export class PostsMapper {
  static toResponse(post: PostWithRelations): PostResponseDto {
    return {
      id: post.id,
      content: post.content,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,

      author: {
        id: post.author.id,
        username: post.author.username,
        profilePicture: post.author.profilePicture,
      },

      media: post.mediaFiles.map((media) => ({
        id: media.id,
        url: media.url,
        type: media.type,
      })),

      commentsCount: post._count.comments,
      likesCount: post._count.likes,
    };
  }
}

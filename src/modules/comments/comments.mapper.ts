import type { Prisma } from '../../generated/prisma/client.js';

type CommentWithAuthor = Prisma.CommentGetPayload<{
  include: {
    author: {
      select: {
        id: true;
        username: true;
        profilePicture: true;
      };
    };
    _count: {
      select: {
        likes: true;
      };
    };
  };
}>;

export class CommentsMapper {
  static toResponse(comment: CommentWithAuthor) {
    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      postId: comment.postId,
      author: {
        id: comment.author.id,
        username: comment.author.username,
        profilePicture: comment.author.profilePicture,
      },
      likesCount: comment._count.likes,
    };
  }
}

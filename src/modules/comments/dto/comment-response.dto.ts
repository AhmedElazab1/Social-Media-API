import { ApiProperty } from '@nestjs/swagger';

export class CommentAuthorResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty({ nullable: true })
  profilePicture: string | null;
}

export class CommentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  postId: string;

  @ApiProperty({ type: CommentAuthorResponseDto })
  author: CommentAuthorResponseDto;

  @ApiProperty()
  likesCount: number;
}

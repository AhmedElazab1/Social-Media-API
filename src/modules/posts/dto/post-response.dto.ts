import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PostAuthorResponseDto {
  @ApiProperty({ example: '844d9d0f-a1e5-415b-9147-a2164a7d471b' })
  id: string;

  @ApiProperty({ example: 'john_doe' })
  username: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  profilePicture: string | null;
}

export class PostMediaResponseDto {
  @ApiProperty({ example: '844d9d0f-a1e5-415b-9147-a2164a7d471b' })
  id: string;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  url: string;

  @ApiPropertyOptional({ example: 'image/jpeg', nullable: true })
  type: string | null;
}

export class PostResponseDto {
  @ApiProperty({ example: '844d9d0f-a1e5-415b-9147-a2164a7d471b' })
  id: string;

  @ApiPropertyOptional({
    example: 'This is my first post',
    nullable: true,
  })
  content: string | null;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-06-01T08:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ type: PostAuthorResponseDto })
  author: PostAuthorResponseDto;

  @ApiProperty({ type: [PostMediaResponseDto] })
  media: PostMediaResponseDto[];

  @ApiProperty({ example: 12 })
  commentsCount: number;

  @ApiProperty({ example: 25 })
  likesCount: number;
}

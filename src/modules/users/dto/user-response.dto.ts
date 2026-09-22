import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Role } from '../../../generated/prisma/enums.js';

export class UserResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'john_doe' })
  username: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiPropertyOptional({
    example: 'Software developer and coffee enthusiast.',
    nullable: true,
  })
  bio: string | null;

  @ApiProperty({
    enum: Role,
    example: Role.USER,
  })
  role: Role;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  profilePicture: string | null;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-06-01T08:00:00.000Z',
  })
  updatedAt: Date;
}

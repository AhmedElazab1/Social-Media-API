import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateMeDto {
  @ApiProperty({ example: 'john_doe' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  @MinLength(3)
  username?: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  @MinLength(2)
  firstName?: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  @MinLength(2)
  lastName?: string;

  @ApiProperty({ example: 'Software Engineer' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  bio?: string;

  @ApiProperty({ example: 'https://example.com/john_doe.jpg' })
  @IsString()
  @IsOptional()
  profilePicture?: string;
}

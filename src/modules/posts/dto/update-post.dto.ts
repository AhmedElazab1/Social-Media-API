import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdatePostDto {
  @ApiPropertyOptional({
    example: 'Updated post content.',
    description: 'New text content for the post.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;
}

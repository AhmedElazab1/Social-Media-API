import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateMediaDto {
  @ApiProperty({
    example: 'https://example.com/image.jpg',
    description: 'Publicly accessible URL of the media file.',
  })
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({
    example: 'image/jpeg',
    description: 'MIME type of the media file.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  type?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { CreateMediaDto } from './create-media.dto.js';

export class CreatePostDto {
  @ApiPropertyOptional({
    example: 'Hello world! This is my first post.',
    description: 'Text content of the post. Required if no media is provided.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;

  @ApiPropertyOptional({
    type: [CreateMediaDto],
    description: 'Optional list of media files to attach to the post.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMediaDto)
  media?: CreateMediaDto[];
}

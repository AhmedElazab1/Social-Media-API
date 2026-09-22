import { IsOptional, IsString } from 'class-validator';

export class FilteringDto {
  @IsOptional()
  @IsString()
  filter?: string;
}

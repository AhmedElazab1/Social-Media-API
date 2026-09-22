import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Role } from 'src/generated/prisma/enums.js';

export class UpdateUserDto {
  @ApiProperty({ example: Role.ADMIN })
  @IsOptional()
  @IsEnum(Role)
  role: Role;
}

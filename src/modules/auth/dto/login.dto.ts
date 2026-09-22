import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from 'src/modules/users/dto/user-response.dto.js';

export class LoginDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass123' })
  @IsString()
  password: string;
}

export class LoginResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Short-lived JWT access token',
  })
  @IsString()
  accessToken: string;

  @ApiProperty({ type: () => UserResponseDto })
  user: UserResponseDto;
}

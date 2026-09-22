import { UserResponseDto } from '../../users/dto/user-response.dto.js';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: UserResponseDto;
}

import { User as UserModel } from '../../generated/prisma/client.js';
import { UserResponseDto } from './dto/user-response.dto.js';

export function toUserResponse(user: UserModel): UserResponseDto {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    bio: user.bio,
    role: user.role,
    profilePicture: user.profilePicture,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

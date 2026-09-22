import { IsEnum } from 'class-validator';

import { ReactionType } from '../../../generated/prisma/client.js';

type ReactionTypeValue = (typeof ReactionType)[keyof typeof ReactionType];

export class CreateReactionDto {
  @IsEnum(ReactionType)
  type: ReactionTypeValue;
}

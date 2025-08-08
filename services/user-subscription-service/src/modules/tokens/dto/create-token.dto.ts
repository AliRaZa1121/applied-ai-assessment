import { TokenReason } from '@prisma/client';
import { IsEnum, IsMongoId } from 'class-validator';

export default class CreatePasswordTokenRequestDTO {
  @IsEnum(TokenReason)
  reason: TokenReason;

  @IsMongoId()
  userId: string;
}

import { Injectable } from '@nestjs/common';
import { Prisma, Token, TokenReason, TokenStatus } from '@prisma/client';
import DatabaseService from 'src/database/database.service';
import CreatePasswordTokenRequestDTO from './dto/create-token.dto';

@Injectable()
export class TokenService {
  constructor(private _databaseService: DatabaseService) { }

  async createPasswordToken(
    data: CreatePasswordTokenRequestDTO,
  ): Promise<string> {
    const token = await this._databaseService.token.create({
      data: {
        reason: data.reason as TokenReason,
        status: TokenStatus.ACTIVE,
        userId: data.userId,
        identifier: `${data.userId}-${Date.now()}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      },
    });
    return token.identifier;
  }

  async getToken(whereClause: Prisma.TokenWhereInput): Promise<Token | null> {
    return await this._databaseService.token.findFirst({
      where: whereClause,
    });
  }

  async deleteExpiredTokens(userId: string): Promise<void> {
    await this._databaseService.token.deleteMany({
      where: {
        userId,
        status: TokenStatus.EXPIRED,
      },
    });
  }
}

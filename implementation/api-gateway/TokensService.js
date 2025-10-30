/**
 * Updated TokensService - Update balance check to include bonus energy
 * File: api-gateway/src/services/TokensService.js
 *
 * CHANGES:
 * 1. isHasBalanceToken() now checks total balance (real + bonus)
 * 2. Added new method getTotalBalance()
 */

import { HttpException } from "../rest/HttpException.js";
import crypto from "crypto";

export class TokensService {
  constructor(tokensRepository) {
    this.tokensRepository = tokensRepository;
  }

  async getTokenById(tokenId) {
    console.log(`[ запрос на токен ${tokenId} ]`)
    return this.tokensRepository.getTokenById(tokenId);
  }

  async hasUserToken(userId) {
    console.log(`[ запрос на Юзертокен ${userId} ]`)
    return this.tokensRepository.hasUserToken(userId);
  }

  async getTokenByUserId(userId) {
    console.log(`[ запрос на токен Юзера ${userId} ]`)
    return this.tokensRepository.getTokenByUserId(userId);
  }

  async regenerateToken(userId) {
    console.log(`[ перегенерация токена у юзера ${userId} ]`)
    await this.tokensRepository.updateTokenByUserId(userId, { id: crypto.randomBytes(16).toString("hex") });
    return this.tokensRepository.getTokenByUserId(userId);
  }

  async isValidMasterToken(token) {
    console.log(`[ проверка мастер токена ${token}...`)
    if (token !== process.env.ADMIN_FIRST) {
      console.log(` не пройдена ]`)
      throw new HttpException(401, "Невалидный мастер токен!");
    }
    console.log(` пройдена ]`)
  }

  async isAdminToken(tokenId) {
    const tokensData = await this.tokensRepository.getAllTokens();
    const token = tokensData.tokens.find((token) => token.id === tokenId);
    console.log(`[ проверка админ токена ${tokenId}...`)
    if (!token) {
      console.log(` не пройдена ]`)
      throw new HttpException(401, "Невалидный админ токен!");
    }
    console.log(` пройдена ]`)
  }

  // CHANGED: Now checks total balance (real + bonus)
  async isHasBalanceToken(tokenId) {
    const tokensData = await this.tokensRepository.getAllTokens();
    const token = tokensData.tokens.find((token) => token.id === tokenId);

    console.log(`[ проверка баланса у пользователя ${tokenId}...`)

    // Initialize tokens_gpt if null (backward compatibility)
    if(token.tokens_gpt == null) {
      console.log(` значение "null". выставлен баланс в 10к ]`)
      token.tokens_gpt = 10000;
    }

    // NEW: Calculate total balance including bonus tokens
    const realTokens = token.tokens_gpt || 0;
    const bonusTokens = token.bonus_tokens || 0;
    const totalBalance = realTokens + bonusTokens;

    console.log(`[ баланс: real=${realTokens}, bonus=${bonusTokens}, total=${totalBalance} ]`);

    if (totalBalance <= 0) {
      console.log(` не хватает баланса ]`)
      throw new HttpException(429, "Не хватает баланса!");
    }

    console.log(` проверка пройдена. баланс: ${totalBalance}]`)
  }

  // NEW: Get total balance for a user
  async getTotalBalance(userId) {
    return await this.tokensRepository.getTotalBalance(userId);
  }

  // NEW: Get detailed balance breakdown
  async getBalanceDetails(userId) {
    const token = await this.tokensRepository.getTokenByUserId(userId);

    const realTokens = token.tokens_gpt || 0;
    const bonusTokens = token.bonus_tokens || 0;
    const totalBalance = realTokens + bonusTokens;

    // Get bonuses expiring soon
    const expiringBonuses = await this.tokensRepository.getExpiringBonuses(userId, 30);
    const expiringTotal = expiringBonuses.reduce((sum, b) => sum + b.remaining, 0);

    return {
      user_id: userId,
      real_tokens: realTokens,
      bonus_tokens: bonusTokens,
      total_balance: totalBalance,
      expiring_soon: expiringTotal,
      bonus_history: token.bonus_history || [],
      last_spending_date: token.last_spending_date,
    };
  }

  getTokenFromAuthorization(authorization) {
    return authorization.split("Bearer ")[1];
  }
}

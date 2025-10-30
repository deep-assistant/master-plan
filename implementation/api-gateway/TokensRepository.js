/**
 * Updated TokensRepository with bonus/real energy split
 * File: api-gateway/src/repositories/TokensRepository.js
 *
 * Changes:
 * 1. Added bonus_tokens, bonus_history tracking
 * 2. Added migration function
 * 3. Added spending methods with FIFO bonus logic
 * 4. Added expiration cleanup
 */

import crypto from "crypto";

export class TokensRepository {
  constructor(tokensDB) {
    this.tokensDB = tokensDB;
  }

  getAllTokens() {
    return this.tokensDB.data;
  }

  async generateToken(user_id, tokens) {
    const token = {
      id: crypto.randomBytes(16).toString("hex"),
      user_id: user_id,
      tokens_gpt: tokens,
      // NEW: Bonus energy tracking
      bonus_tokens: 0,
      bonus_history: [],
      last_spending_date: null,
      total_spent_yesterday: 0,
    };

    await this.tokensDB.update(({ tokens }) => tokens.push(token));

    return token;
  }

  async getTokenByUserId(userId) {
    const token = this.tokensDB.data.tokens.find((token) => token.user_id === userId);
    if (!token) {
      return await this.generateToken(userId, 10000);
    }

    // NEW: Ensure new fields exist (migration support)
    if (token.bonus_tokens === undefined) {
      token.bonus_tokens = 0;
      token.bonus_history = [];
      token.last_spending_date = null;
      token.total_spent_yesterday = 0;
      await this.updateTokenByUserId(userId, token);
    }

    return token;
  }

  async getTokenById(tokenId) {
    return this.tokensDB.data.tokens.find((token) => token.id === tokenId);
  }

  async updateTokenByUserId(userId, tokenData) {
    await this.tokensDB.update(({ tokens }) => {
      const foundToken = tokens.find((item) => item.user_id === userId);
      if (foundToken) {
        Object.assign(foundToken, tokenData);
      }
    });
  }

  async hasUserToken(userId) {
    const tokensData = await this.getAllTokens();
    return !!tokensData.tokens.find((token) => token.user_id === userId);
  }

  // NEW: Get total balance (real + bonus)
  async getTotalBalance(userId) {
    const token = await this.getTokenByUserId(userId);
    return (token.tokens_gpt || 0) + (token.bonus_tokens || 0);
  }

  // NEW: Spend energy with FIFO bonus logic
  async spendEnergy(userId, amount) {
    const token = await this.getTokenByUserId(userId);
    const totalBalance = (token.tokens_gpt || 0) + (token.bonus_tokens || 0);

    if (totalBalance < amount) {
      return { success: false, message: "Insufficient balance" };
    }

    let remainingToSpend = amount;
    const today = this.getTodayDateString();
    const bonusHistory = token.bonus_history || [];

    // Sort by granted_date (oldest first) - FIFO
    bonusHistory.sort((a, b) => new Date(a.granted_date) - new Date(b.granted_date));

    // Spend from bonus history first
    for (let i = 0; i < bonusHistory.length && remainingToSpend > 0; i++) {
      const bonus = bonusHistory[i];

      // Skip expired bonuses
      if (new Date(bonus.expires_date) < new Date()) {
        continue;
      }

      const amountToTake = Math.min(bonus.remaining, remainingToSpend);
      bonus.remaining -= amountToTake;
      remainingToSpend -= amountToTake;
    }

    // Remove fully spent bonuses
    const updatedBonusHistory = bonusHistory.filter(b => b.remaining > 0);

    // Calculate new bonus_tokens total
    const newBonusTokens = updatedBonusHistory.reduce((sum, b) => sum + b.remaining, 0);

    // If still need to spend, deduct from real tokens
    let newRealTokens = token.tokens_gpt || 0;
    if (remainingToSpend > 0) {
      newRealTokens -= remainingToSpend;
    }

    // Track spending for daily activity check
    const isToday = token.last_spending_date === today;
    const newTotalSpentYesterday = isToday ? (token.total_spent_yesterday || 0) : 0;

    await this.updateTokenByUserId(userId, {
      tokens_gpt: newRealTokens,
      bonus_tokens: newBonusTokens,
      bonus_history: updatedBonusHistory,
      last_spending_date: today,
      total_spent_yesterday: newTotalSpentYesterday + amount,
    });

    return {
      success: true,
      newBalance: newRealTokens + newBonusTokens,
      realTokens: newRealTokens,
      bonusTokens: newBonusTokens,
    };
  }

  // NEW: Add bonus energy with expiration
  async addBonusEnergy(userId, amount, source = "daily_award") {
    const token = await this.getTokenByUserId(userId);
    const bonusHistory = token.bonus_history || [];

    const grantedDate = new Date();
    const expiresDate = new Date(grantedDate);
    expiresDate.setFullYear(expiresDate.getFullYear() + 2); // 2 years expiration

    const newBonus = {
      id: crypto.randomBytes(8).toString("hex"),
      amount: amount,
      granted_date: grantedDate.toISOString(),
      expires_date: expiresDate.toISOString(),
      remaining: amount,
      source: source,
    };

    bonusHistory.push(newBonus);

    const newBonusTotal = (token.bonus_tokens || 0) + amount;

    await this.updateTokenByUserId(userId, {
      bonus_tokens: newBonusTotal,
      bonus_history: bonusHistory,
    });

    return { success: true, newBonus };
  }

  // NEW: Add real energy (purchased)
  async addRealEnergy(userId, amount) {
    const token = await this.getTokenByUserId(userId);
    const newRealTokens = (token.tokens_gpt || 0) + amount;

    await this.updateTokenByUserId(userId, {
      tokens_gpt: newRealTokens,
    });

    return { success: true, newBalance: newRealTokens };
  }

  // NEW: Clean up expired bonuses
  async cleanExpiredBonuses(userId) {
    const token = await this.getTokenByUserId(userId);
    const bonusHistory = token.bonus_history || [];
    const now = new Date();

    const activeBonuses = bonusHistory.filter(b => new Date(b.expires_date) >= now);
    const expiredBonuses = bonusHistory.filter(b => new Date(b.expires_date) < now);

    if (expiredBonuses.length > 0) {
      const newBonusTotal = activeBonuses.reduce((sum, b) => sum + b.remaining, 0);

      await this.updateTokenByUserId(userId, {
        bonus_tokens: newBonusTotal,
        bonus_history: activeBonuses,
      });

      console.log(`[${userId}] Cleaned ${expiredBonuses.length} expired bonuses`);
      return { cleaned: expiredBonuses.length, amount: expiredBonuses.reduce((sum, b) => sum + b.remaining, 0) };
    }

    return { cleaned: 0, amount: 0 };
  }

  // NEW: Check if user was active yesterday (spent any energy)
  async wasActiveYesterday(userId) {
    const token = await this.getTokenByUserId(userId);
    const yesterday = this.getYesterdayDateString();

    return token.last_spending_date === yesterday && (token.total_spent_yesterday || 0) > 0;
  }

  // NEW: Get bonuses expiring soon (within days)
  async getExpiringBonuses(userId, daysThreshold = 30) {
    const token = await this.getTokenByUserId(userId);
    const bonusHistory = token.bonus_history || [];
    const now = new Date();
    const thresholdDate = new Date(now);
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    return bonusHistory.filter(b => {
      const expiryDate = new Date(b.expires_date);
      return expiryDate >= now && expiryDate <= thresholdDate && b.remaining > 0;
    });
  }

  // Helper: Get today's date as YYYY-MM-DD
  getTodayDateString() {
    return new Date().toISOString().split('T')[0];
  }

  // Helper: Get yesterday's date as YYYY-MM-DD
  getYesterdayDateString() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }

  // NEW: Migration function - run once to update all existing tokens
  async migrateToNewStructure() {
    const allTokens = await this.getAllTokens();
    let migrated = 0;

    for (const token of allTokens.tokens) {
      if (token.bonus_tokens === undefined) {
        // Keep existing tokens_gpt as real energy
        token.bonus_tokens = 0;
        token.bonus_history = [];
        token.last_spending_date = this.getTodayDateString();
        token.total_spent_yesterday = 0;

        await this.updateTokenByUserId(token.user_id, token);
        migrated++;
      }
    }

    console.log(`Migration complete: ${migrated} tokens updated`);
    return { migrated };
  }
}

/**
 * Unit tests for TokensRepository - Bonus/Real Energy Split
 * File: api-gateway/tests/repositories/TokensRepository.test.js
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { TokensRepository } from '../../src/repositories/TokensRepository.js';

describe('TokensRepository - Bonus/Real Energy Split', () => {
  let tokensRepository;
  let mockDB;

  beforeEach(() => {
    // Mock LowDB database
    mockDB = {
      data: {
        tokens: []
      },
      update: async (fn) => {
        fn(mockDB.data);
      }
    };

    tokensRepository = new TokensRepository(mockDB);
  });

  describe('Migration', () => {
    it('should migrate existing tokens to new structure', async () => {
      // Setup: Old token structure
      mockDB.data.tokens = [
        { id: 'token1', user_id: 'user1', tokens_gpt: 5000 },
        { id: 'token2', user_id: 'user2', tokens_gpt: 10000 }
      ];

      // Execute migration
      const result = await tokensRepository.migrateToNewStructure();

      // Verify
      expect(result.migrated).toBe(2);
      expect(mockDB.data.tokens[0].bonus_tokens).toBe(0);
      expect(mockDB.data.tokens[0].bonus_history).toEqual([]);
      expect(mockDB.data.tokens[0].last_spending_date).toBeTruthy();
    });

    it('should not re-migrate already migrated tokens', async () => {
      // Setup: Already migrated token
      mockDB.data.tokens = [
        {
          id: 'token1',
          user_id: 'user1',
          tokens_gpt: 5000,
          bonus_tokens: 1000,
          bonus_history: []
        }
      ];

      // Execute migration
      const result = await tokensRepository.migrateToNewStructure();

      // Verify: Should not change already migrated tokens
      expect(result.migrated).toBe(0);
      expect(mockDB.data.tokens[0].bonus_tokens).toBe(1000);
    });
  });

  describe('Bonus Energy Management', () => {
    it('should add bonus energy with 2-year expiration', async () => {
      // Setup
      await tokensRepository.generateToken('user1', 10000);

      // Execute
      const result = await tokensRepository.addBonusEnergy('user1', 5000, 'daily_award');

      // Verify
      expect(result.success).toBe(true);
      expect(result.newBonus.amount).toBe(5000);
      expect(result.newBonus.remaining).toBe(5000);
      expect(result.newBonus.source).toBe('daily_award');

      // Check expiration date is ~2 years from now
      const expiresDate = new Date(result.newBonus.expires_date);
      const expectedDate = new Date();
      expectedDate.setFullYear(expectedDate.getFullYear() + 2);
      const diffDays = Math.abs((expiresDate - expectedDate) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBeLessThan(1); // Within 1 day
    });

    it('should clean up expired bonuses', async () => {
      // Setup: Create token with expired and active bonuses
      await tokensRepository.generateToken('user1', 10000);

      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 3); // 3 years ago

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2); // 2 years from now

      const token = await tokensRepository.getTokenByUserId('user1');
      token.bonus_history = [
        {
          id: 'bonus1',
          amount: 1000,
          granted_date: pastDate.toISOString(),
          expires_date: new Date(pastDate.getTime() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(), // Expired
          remaining: 500,
          source: 'old_bonus'
        },
        {
          id: 'bonus2',
          amount: 2000,
          granted_date: new Date().toISOString(),
          expires_date: futureDate.toISOString(), // Active
          remaining: 2000,
          source: 'daily_award'
        }
      ];
      token.bonus_tokens = 2500;
      await tokensRepository.updateTokenByUserId('user1', token);

      // Execute
      const result = await tokensRepository.cleanExpiredBonuses('user1');

      // Verify
      expect(result.cleaned).toBe(1);
      expect(result.amount).toBe(500);

      const updatedToken = await tokensRepository.getTokenByUserId('user1');
      expect(updatedToken.bonus_tokens).toBe(2000);
      expect(updatedToken.bonus_history.length).toBe(1);
      expect(updatedToken.bonus_history[0].id).toBe('bonus2');
    });
  });

  describe('FIFO Spending Logic', () => {
    it('should spend oldest bonus energy first', async () => {
      // Setup: Token with multiple bonuses
      await tokensRepository.generateToken('user1', 5000); // Real energy

      const now = new Date();
      const bonus1Date = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const bonus2Date = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      const token = await tokensRepository.getTokenByUserId('user1');
      token.bonus_history = [
        {
          id: 'bonus1',
          amount: 1000,
          granted_date: bonus1Date.toISOString(),
          expires_date: new Date(bonus1Date.getTime() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
          remaining: 1000,
          source: 'daily_award'
        },
        {
          id: 'bonus2',
          amount: 2000,
          granted_date: bonus2Date.toISOString(),
          expires_date: new Date(bonus2Date.getTime() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
          remaining: 2000,
          source: 'daily_award'
        }
      ];
      token.bonus_tokens = 3000;
      await tokensRepository.updateTokenByUserId('user1', token);

      // Execute: Spend 1500 (should take 1000 from bonus1, 500 from bonus2)
      const result = await tokensRepository.spendEnergy('user1', 1500);

      // Verify
      expect(result.success).toBe(true);
      expect(result.bonusTokens).toBe(1500); // 3000 - 1500
      expect(result.realTokens).toBe(5000); // Unchanged

      const updatedToken = await tokensRepository.getTokenByUserId('user1');
      expect(updatedToken.bonus_history[0].remaining).toBe(0); // bonus1 fully spent
      expect(updatedToken.bonus_history[1].remaining).toBe(1500); // bonus2 partial
    });

    it('should spend from real energy after bonus depleted', async () => {
      // Setup
      await tokensRepository.generateToken('user1', 5000);

      const token = await tokensRepository.getTokenByUserId('user1');
      token.bonus_history = [
        {
          id: 'bonus1',
          amount: 1000,
          granted_date: new Date().toISOString(),
          expires_date: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
          remaining: 1000,
          source: 'daily_award'
        }
      ];
      token.bonus_tokens = 1000;
      await tokensRepository.updateTokenByUserId('user1', token);

      // Execute: Spend 2000 (1000 bonus + 1000 real)
      const result = await tokensRepository.spendEnergy('user1', 2000);

      // Verify
      expect(result.success).toBe(true);
      expect(result.bonusTokens).toBe(0);
      expect(result.realTokens).toBe(4000); // 5000 - 1000
    });

    it('should fail if insufficient balance', async () => {
      // Setup
      await tokensRepository.generateToken('user1', 1000);

      // Execute: Try to spend more than available
      const result = await tokensRepository.spendEnergy('user1', 2000);

      // Verify
      expect(result.success).toBe(false);
      expect(result.message).toContain('Insufficient balance');
    });

    it('should remove fully spent bonuses', async () => {
      // Setup
      await tokensRepository.generateToken('user1', 5000);

      const token = await tokensRepository.getTokenByUserId('user1');
      token.bonus_history = [
        {
          id: 'bonus1',
          amount: 1000,
          granted_date: new Date().toISOString(),
          expires_date: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
          remaining: 1000,
          source: 'daily_award'
        }
      ];
      token.bonus_tokens = 1000;
      await tokensRepository.updateTokenByUserId('user1', token);

      // Execute: Spend exactly the bonus amount
      await tokensRepository.spendEnergy('user1', 1000);

      // Verify: Bonus should be removed from history
      const updatedToken = await tokensRepository.getTokenByUserId('user1');
      expect(updatedToken.bonus_history.length).toBe(0);
      expect(updatedToken.bonus_tokens).toBe(0);
    });
  });

  describe('Activity Tracking', () => {
    it('should track spending activity', async () => {
      // Setup
      await tokensRepository.generateToken('user1', 5000);

      // Execute: Spend energy
      await tokensRepository.spendEnergy('user1', 100);

      // Verify
      const token = await tokensRepository.getTokenByUserId('user1');
      expect(token.last_spending_date).toBe(tokensRepository.getTodayDateString());
      expect(token.total_spent_yesterday).toBe(100);
    });

    it('should detect if user was active yesterday', async () => {
      // Setup
      await tokensRepository.generateToken('user1', 5000);

      const yesterday = tokensRepository.getYesterdayDateString();
      const token = await tokensRepository.getTokenByUserId('user1');
      token.last_spending_date = yesterday;
      token.total_spent_yesterday = 150;
      await tokensRepository.updateTokenByUserId('user1', token);

      // Execute
      const wasActive = await tokensRepository.wasActiveYesterday('user1');

      // Verify
      expect(wasActive).toBe(true);
    });

    it('should return false if user was not active yesterday', async () => {
      // Setup
      await tokensRepository.generateToken('user1', 5000);

      // No spending recorded

      // Execute
      const wasActive = await tokensRepository.wasActiveYesterday('user1');

      // Verify
      expect(wasActive).toBe(false);
    });
  });

  describe('Expiring Bonuses', () => {
    it('should get bonuses expiring within threshold', async () => {
      // Setup
      await tokensRepository.generateToken('user1', 5000);

      const now = new Date();
      const soon = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000); // 20 days
      const later = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days

      const token = await tokensRepository.getTokenByUserId('user1');
      token.bonus_history = [
        {
          id: 'bonus1',
          amount: 1000,
          granted_date: new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000 + 20 * 24 * 60 * 60 * 1000).toISOString(),
          expires_date: soon.toISOString(), // Expires in 20 days
          remaining: 1000,
          source: 'old_bonus'
        },
        {
          id: 'bonus2',
          amount: 2000,
          granted_date: new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000 + 60 * 24 * 60 * 60 * 1000).toISOString(),
          expires_date: later.toISOString(), // Expires in 60 days
          remaining: 2000,
          source: 'daily_award'
        }
      ];
      token.bonus_tokens = 3000;
      await tokensRepository.updateTokenByUserId('user1', token);

      // Execute: Get bonuses expiring within 30 days
      const expiringBonuses = await tokensRepository.getExpiringBonuses('user1', 30);

      // Verify
      expect(expiringBonuses.length).toBe(1);
      expect(expiringBonuses[0].id).toBe('bonus1');
      expect(expiringBonuses[0].remaining).toBe(1000);
    });
  });
});

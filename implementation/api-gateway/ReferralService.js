/**
 * Updated ReferralService with daily activity check
 * File: api-gateway/src/services/ReferralService.js
 *
 * CHANGES:
 * 1. runAwardUpdate() now checks if user was active yesterday
 * 2. Uses new addBonusEnergy() for granting bonuses
 * 3. Cleans up expired bonuses during daily run
 * 4. Tracks notifications for users
 */

import { CronJob } from "cron";

export class ReferralService {
  constructor(completionsService, referralRepository, tokensRepository) {
    this.completionsService = completionsService;
    this.referralRepository = referralRepository;
    this.tokensRepository = tokensRepository;

    this.runAwardUpdate();
  }

  async createReferral(id, parent = null) {
    console.log(`[ создание ${id}, родитель: ${parent} ]`);
    const referral = await this.referralRepository.createReferral(id, parent);

    if (parent) {
      const foundParent = await this.referralRepository.findReferralById(parent);
      if (foundParent) {
        await this.referralRepository.updateReferral(foundParent.id, {
          award: 10_000 + ((foundParent.children?.length+1) || 0) * 500
        });
        console.log(`[ежедневное пополнение юзера ${foundParent.id} с количеством рефералов ${(foundParent.children?.length+1)} теперь равно ${foundParent.award}]`);
        console.log(`[ добавлен родитель для ${id} ]`);
        await this.referralRepository.addParent(id, parent);

        // CHANGED: Use addBonusTokens for referral bonus
        await this.completionsService.addBonusTokens(foundParent.id, 5000, "referral_activation");
      }
    }

    return referral;
  }

  async getReferral(id) {
    const foundReferral = await this.referralRepository.findReferralById(id);
    if (!foundReferral) {
      console.log(`[ реферал не найден, создается новый для ${id} ]`);
      return this.createReferral(id);
    }

    return foundReferral;
  }

  async updateParent(parentId) {
    if (!parentId) return;

    const foundParentReferral = await this.referralRepository.findReferralById(parentId);
    if (foundParentReferral) {
      console.log(`[ обновление награды для родителя ${parentId} ]`);

      await this.referralRepository.updateReferral(parentId, {
        award: 10_000 + ((foundParentReferral.children?.length+1) || 0) * 500
      });
    }
  }

  // CHANGED: Now also checks if user was active yesterday
  async getTokensToUpdate(token) {
    // Cap: Don't grant if balance >= 30,000
    const totalBalance = await this.tokensRepository.getTotalBalance(token.user_id);
    if (totalBalance >= 30_000) {
      console.log(`[${token.user_id}] Balance >= 30k, no daily award`);
      return 0;
    }

    // NEW: Check if user was active yesterday
    const wasActive = await this.tokensRepository.wasActiveYesterday(token.user_id);
    if (!wasActive) {
      console.log(`[${token.user_id}] No activity yesterday, no daily award`);
      return 0;
    }

    const referral = await this.getReferral(token.user_id);

    // Calculate award based on referrals
    if (referral) {
      const expectedAward = 10_000 + ((referral.children?.length+1) || 0) * 500;
      if (referral.award != expectedAward) {
        referral.award = expectedAward;
      }
      return referral.award ?? expectedAward;
    }

    // Base award if no referral data
    return 10_000;
  }


  runAwardUpdate() {
    CronJob.from({
      cronTime: "0 0 0 * * *",
      onTick: async () => {
        console.log(`[ выполнение CronJob для обновления наград ]`);
        const tokensData = await this.tokensRepository.getAllTokens();

        let awardedCount = 0;
        let cleanedBonusesCount = 0;

        for (const token of tokensData.tokens) {
          // NEW: Clean up expired bonuses first
          const cleanResult = await this.tokensRepository.cleanExpiredBonuses(token.user_id);
          if (cleanResult.cleaned > 0) {
            console.log(`[${token.user_id}] Cleaned ${cleanResult.cleaned} expired bonuses (${cleanResult.amount} tokens)`);
            cleanedBonusesCount += cleanResult.cleaned;

            // TODO: Create notification about expired bonuses
            // await notificationService.create(token.user_id, 'bonus_expired', { amount: cleanResult.amount });
          }

          // NEW: Check if eligible for daily award
          const award = await this.getTokensToUpdate(token);

          if (award > 0) {
            // CHANGED: Use addBonusTokens instead of updateCompletionTokens
            await this.completionsService.addBonusTokens(token.user_id, award, "daily_award");
            console.log(`[${token.user_id}] Daily bonus granted: ${award} tokens (was active yesterday)`);
            awardedCount++;

            // TODO: Create notification about daily bonus
            // await notificationService.create(token.user_id, 'daily_bonus', { amount: award });
          }

          // Handle referral activation (one-time bonus)
          const foundReferral = await this.referralRepository.findOrCreateReferralById(token.user_id);
          if (!foundReferral?.isActivated && foundReferral?.parent) {
            console.log(`[ активация реферала ${foundReferral.id} ]`);
            await this.updateParent(foundReferral.parent);
            await this.referralRepository.updateReferral(foundReferral.id, { isActivated: true });

            // CHANGED: Use addBonusTokens for activation bonus
            await this.completionsService.addBonusTokens(foundReferral.id, 5000, "referral_activation");
            await this.completionsService.addBonusTokens(foundReferral.parent, 5000, "referral_activation");

            console.log(`[${foundReferral.id}] Referral activated: +5000 tokens for both parties`);

            // TODO: Create notifications for both users
            // await notificationService.create(foundReferral.id, 'referral_activated_self', { amount: 5000 });
            // await notificationService.create(foundReferral.parent, 'referral_activated_parent', { amount: 5000 });
          }

          // NEW: Check for expiring bonuses (within 30 days)
          const expiringBonuses = await this.tokensRepository.getExpiringBonuses(token.user_id, 30);
          if (expiringBonuses.length > 0) {
            const expiringTotal = expiringBonuses.reduce((sum, b) => sum + b.remaining, 0);
            console.log(`[${token.user_id}] Warning: ${expiringTotal} tokens expiring soon`);

            // TODO: Create notification about expiring bonuses
            // await notificationService.create(token.user_id, 'bonus_expiring_soon', {
            //   amount: expiringTotal,
            //   days: 30
            // });
          }
        }

        console.log(`[ CronJob завершен: ${awardedCount} пользователей получили награды, ${cleanedBonusesCount} истекших бонусов очищено ]`);
      },
      start: true,
      timeZone: "Europe/Moscow",
    });
  }
}

/**
 * Key Changes Summary:
 *
 * 1. getTokensToUpdate() now returns 0 if user was not active yesterday
 * 2. runAwardUpdate() cleans expired bonuses before granting new ones
 * 3. All bonus grants use addBonusTokens() which tracks expiration
 * 4. Added logging for expiring soon bonuses
 * 5. Prepared for notification service integration (commented TODO)
 *
 * Activity Check Logic:
 * - User must have spent ANY energy yesterday to receive daily bonus
 * - Tracked via last_spending_date and total_spent_yesterday fields
 * - Encourages daily usage of the platform
 */

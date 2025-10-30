/**
 * Updated CompletionsService - Key changes to updateCompletionTokens method
 * File: api-gateway/src/services/CompletionsService.js
 *
 * CHANGES:
 * 1. Use new tokensRepository.spendEnergy() for "subtract" operations
 * 2. Use tokensRepository.addRealEnergy() or addBonusEnergy() for "add" operations
 * 3. Maintain backward compatibility
 */

// Only showing the modified updateCompletionTokens method
// The rest of the file remains unchanged

async updateCompletionTokens(tokenId, energy, operation) {
    console.log('updateCompletionTokens', 'energy', energy);

    if (!energy) return false;

    console.log('updateCompletionTokens', 'operation', operation);

    if (operation !== "subtract" && operation !== "add") return false;

    // Special handling for bonus account (user_id: "666")
    const tokenBonus = await this.tokensRepository.getTokenByUserId("666");
    console.log('updateCompletionTokens', 'tokenBonus', tokenBonus);

    const currentBonusTokens = tokenBonus && +tokenBonus.tokens_gpt || 0;
    console.log('updateCompletionTokens', 'currentBonusTokens', currentBonusTokens);

    // Use bonus account if available and operation is subtract
    const token = currentBonusTokens > 100000 && operation === "subtract"
        ? tokenBonus
        : await this.tokensService.getTokenByUserId(tokenId);

    console.log('updateCompletionTokens', 'token', token);

    if (!token) return false;

    const userId = token.user_id;

    if (operation === "subtract") {
        // NEW: Use FIFO bonus spending logic
        const result = await this.tokensRepository.spendEnergy(userId, energy);

        if (!result.success) {
            console.log('updateCompletionTokens', 'failed to spend', result.message);
            return false;
        }

        console.log('updateCompletionTokens', 'spent', {
            amount: energy,
            newBalance: result.newBalance,
            realTokens: result.realTokens,
            bonusTokens: result.bonusTokens
        });

        return true;
    } else {
        // operation === "add"
        // For adding, use addRealEnergy (for purchases) or addBonusEnergy (for bonuses)
        // Default to real energy for backward compatibility
        const oldEnergy = +token.tokens_gpt || 0;
        console.log('updateCompletionTokens', 'oldEnergy', oldEnergy);

        const energyToAdd = +energy || 0;
        console.log('updateCompletionTokens', 'energyToAdd', energyToAdd);

        // NEW: Add to real energy (for purchases/refunds)
        await this.tokensRepository.addRealEnergy(userId, energyToAdd);

        const newEnergy = oldEnergy + energyToAdd;
        console.log('updateCompletionTokens', 'newEnergy', newEnergy);

        return true;
    }
}

// NEW: Method to add bonus energy (called by ReferralService)
async addBonusTokens(userId, energy, source = "daily_award") {
    console.log('addBonusTokens', 'userId', userId, 'energy', energy, 'source', source);

    if (!energy || energy <= 0) return false;

    const result = await this.tokensRepository.addBonusEnergy(userId, energy, source);

    console.log('addBonusTokens', 'result', result);

    return result.success;
}

/**
 * Example usage in other parts of the code:
 *
 * // For spending (during API calls)
 * await completionsService.updateCompletionTokens(userId, 150, "subtract");
 *
 * // For adding purchased energy
 * await completionsService.updateCompletionTokens(userId, 10000, "add");
 *
 * // For adding bonus energy (from referrals, daily awards)
 * await completionsService.addBonusTokens(userId, 5000, "referral_activation");
 */

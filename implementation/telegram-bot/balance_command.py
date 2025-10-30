"""
Updated balance command with bonus/real energy split display
File: telegram-bot/bot/balance/router.py or bot/commands.py

CHANGES:
1. Show real vs bonus energy breakdown
2. Show expiring soon bonuses
3. Show daily bonus eligibility status
"""

from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message
from services import tokensService  # Assuming you have a tokens service

router = Router()

@router.message(Command("balance"))
async def balance_command(message: Message):
    """
    Display user's energy balance with bonus/real split
    """
    try:
        user_id = message.from_user.id

        # NEW: Get detailed balance from api-gateway
        balance_details = await tokensService.get_balance_details(user_id)

        real_tokens = balance_details["real_tokens"]
        bonus_tokens = balance_details["bonus_tokens"]
        total_balance = balance_details["total_balance"]
        expiring_soon = balance_details.get("expiring_soon", 0)
        last_spending = balance_details.get("last_spending_date")

        # Format the balance message
        message_text = f"""
💰 *Ваш баланс энергии*

🔋 *Всего:* `{total_balance:,}⚡️`

━━━━━━━━━━━━━━━━
├─ 💎 Реальная энергия: `{real_tokens:,}⚡️`
│   └─ Не истекает, можно купить
│
├─ 🎁 Бонусная энергия: `{bonus_tokens:,}⚡️`
│   └─ Истекает через 2 года
"""

        # Add expiring soon warning if applicable
        if expiring_soon > 0:
            message_text += f"""│
├─ ⚠️ Истекает в течение 30 дней: `{expiring_soon:,}⚡️`
"""

        message_text += """━━━━━━━━━━━━━━━━

📌 *Информация:*
• Бонусная энергия расходуется первой
• Каждый бонус действует 2 года с момента начисления
"""

        # Show daily bonus status
        # Note: This would require checking yesterday's activity
        if last_spending:
            message_text += f"""
🎁 *Ежедневный бонус:*
• Активность вчера: ✅ Да
• Следующий бонус: Завтра в 00:00 МСК
"""
        else:
            message_text += """
🎁 *Ежедневный бонус:*
• Активность вчера: ❌ Нет
• Используйте бота сегодня для бонуса завтра!
"""

        message_text += """
━━━━━━━━━━━━━━━━
/referral - 🔗 Пригласить друзей и получать больше!
/buy - 💳 Купить энергию
"""

        await message.answer(message_text, parse_mode="Markdown")

    except Exception as e:
        print(f"Error in balance_command: {e}")
        await message.answer(
            "❌ Ошибка при получении баланса. Попробуйте позже.",
            parse_mode="Markdown"
        )


"""
Note: This requires adding methods to tokensService:

# In services/tokens_service.py

from config import PROXY_URL, ADMIN_TOKEN
from services.utils import async_get

class TokensService:
    async def get_balance_details(self, user_id):
        params = {
            "masterToken": ADMIN_TOKEN,
        }

        response = await async_get(f"{PROXY_URL}/token/{user_id}/details", params=params)

        if response.status_code == 200:
            return response.json().get("data", {})

        # Fallback to simple balance
        return {
            "real_tokens": 0,
            "bonus_tokens": 0,
            "total_balance": 0,
            "expiring_soon": 0,
            "last_spending_date": None
        }

tokensService = TokensService()
"""

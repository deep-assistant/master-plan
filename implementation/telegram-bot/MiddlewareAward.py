"""
Updated MiddlewareAward with balance notifications
File: telegram-bot/bot/middlewares/MiddlewareAward.py

CHANGES:
1. Added notification for daily bonus grants
2. Added warning for expiring bonuses
3. Enhanced message formatting with bonus/real split
"""

from aiogram import BaseMiddleware
from aiogram.types import Message

from services import referralsService, tokensService  # Added tokensService

class MiddlewareAward(BaseMiddleware):
    async def __call__(self, handler, event, data):
        # Check for referral rewards
        reward = await referralsService.get_awards(event.from_user.id)

        print(reward)

        if reward["isAward"]:
            update_parents = reward["updateParents"]

            if len(update_parents) > 0:
                await event.bot.send_message(chat_id=event.from_user.id, text="""
🎉 Ваш аккаунт был подтвержден!
Пользователь, который пригласил вас получил *10000⚡️* и *+500⚡️* к ежедневному бесплатному пополнению!

/balance - ✨ Узнать баланс
/referral - 🔗 Приглашайте друзей - получайте больше бонусов!
""")

            for parent in update_parents:
                await event.bot.send_message(chat_id=parent, text="""
🎉 Ваш реферал был подтвержден!
Вы получили *10000⚡️*
И *+500⚡️* к ежедневному бесплатному пополнению!

/balance - ✨ Узнать баланс
/referral - 🔗 Подробности рефералки
""")

        # NEW: Check for pending notifications from api-gateway
        try:
            notifications = await tokensService.get_notifications(event.from_user.id)

            for notification in notifications:
                if notification["type"] == "daily_bonus":
                    amount = notification["amount"]
                    await event.bot.send_message(
                        chat_id=event.from_user.id,
                        text=f"""
🎁 *Ежедневный бонус получен!*

Вам начислено: *{amount:,}⚡️* бонусной энергии
Спасибо за активность вчера! 💪

📌 Бонусная энергия истекает через 2 года
📊 /balance - Узнать баланс
""",
                        parse_mode="Markdown"
                    )

                elif notification["type"] == "bonus_expiring_soon":
                    amount = notification["amount"]
                    days = notification.get("days", 30)
                    await event.bot.send_message(
                        chat_id=event.from_user.id,
                        text=f"""
⚠️ *Внимание: истекает бонусная энергия!*

Через {days} дней истекут: *{amount:,}⚡️*

Используйте энергию, чтобы не потерять бонус!
📊 /balance - Узнать баланс
""",
                        parse_mode="Markdown"
                    )

                elif notification["type"] == "bonus_expired":
                    amount = notification["amount"]
                    await event.bot.send_message(
                        chat_id=event.from_user.id,
                        text=f"""
❌ *Бонусная энергия истекла*

Истекло: *{amount:,}⚡️*

💡 Совет: используйте бонусы регулярно, они действуют 2 года!
📊 /balance - Узнать текущий баланс
""",
                        parse_mode="Markdown"
                    )

        except Exception as e:
            print(f"Error fetching notifications: {e}")

        return await handler(event, data)


"""
Note: This requires adding a tokensService with get_notifications() method:

# In services/tokens_service.py

class TokensService:
    async def get_notifications(self, user_id):
        params = {
            "masterToken": ADMIN_TOKEN,
            "userId": user_id,
        }

        response = await async_get(f"{PROXY_URL}/notifications/{user_id}", params=params)

        if response.status_code == 200:
            return response.json().get("notifications", [])
        return []

tokensService = TokensService()
"""

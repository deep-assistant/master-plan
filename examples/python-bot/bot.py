#!/usr/bin/env python3
"""
Minimal VK Bot Example (Python)

This is a proof-of-concept VK bot that demonstrates:
- Basic command handling (/start, /help)
- Keyboard layouts
- Integration with API Gateway for GPT chat
- User balance checking

This example is intended to be moved to the vk-bot repository.

Dependencies:
    pip install vkbottle aiohttp python-dotenv

Environment Variables:
    VK_GROUP_TOKEN - VK community access token
    API_GATEWAY_URL - API Gateway base URL
    API_GATEWAY_TOKEN - API Gateway authentication token
"""

import os
import asyncio
import aiohttp
from typing import Optional
from vkbottle.bot import Bot, Message
from vkbottle import Keyboard, KeyboardButtonColor, Text
from vkbottle import BaseStateGroup
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
VK_GROUP_TOKEN = os.getenv("VK_GROUP_TOKEN")
API_GATEWAY_URL = os.getenv("API_GATEWAY_URL", "https://api.deep-assistant.com")
API_GATEWAY_TOKEN = os.getenv("API_GATEWAY_TOKEN")

if not VK_GROUP_TOKEN:
    raise ValueError("VK_GROUP_TOKEN environment variable is required")

# Initialize bot
bot = Bot(token=VK_GROUP_TOKEN)

# State management for conversations
class ConversationState(BaseStateGroup):
    WAITING_FOR_MESSAGE = "waiting_for_message"


# API Gateway Service
class APIGatewayService:
    """Service for interacting with the API Gateway."""

    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.token = token
        self.session: Optional[aiohttp.ClientSession] = None

    async def init_session(self):
        """Initialize HTTP session."""
        if not self.session:
            self.session = aiohttp.ClientSession()

    async def close_session(self):
        """Close HTTP session."""
        if self.session:
            await self.session.close()

    async def chat_completion(
        self,
        user_id: int,
        message: str,
        model: str = "gpt-3.5-turbo"
    ) -> dict:
        """Send chat completion request."""
        await self.init_session()

        try:
            async with self.session.post(
                f"{self.base_url}/v1/chat/completions",
                headers={"Authorization": f"Bearer {self.token}"},
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": message}],
                    "user_id": str(user_id)
                },
                timeout=aiohttp.ClientTimeout(total=60)
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    error_text = await response.text()
                    raise Exception(f"API Gateway error: {response.status} - {error_text}")
        except asyncio.TimeoutError:
            raise Exception("API Gateway request timeout")

    async def get_user_balance(self, user_id: int) -> int:
        """Get user token balance."""
        await self.init_session()

        try:
            async with self.session.get(
                f"{self.base_url}/tokens/{user_id}",
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("balance", 0)
                else:
                    # If user doesn't exist, return 0
                    return 0
        except Exception as e:
            print(f"Error fetching balance: {e}")
            return 0


# Initialize API Gateway service
api_gateway = None
if API_GATEWAY_TOKEN:
    api_gateway = APIGatewayService(API_GATEWAY_URL, API_GATEWAY_TOKEN)


# Keyboard layouts
def get_main_keyboard() -> Keyboard:
    """Create main menu keyboard."""
    return (
        Keyboard()
        .add(Text("💬 Chat with GPT"), color=KeyboardButtonColor.PRIMARY)
        .row()
        .add(Text("🎨 Generate Image"), color=KeyboardButtonColor.POSITIVE)
        .row()
        .add(Text("💰 Balance"), color=KeyboardButtonColor.SECONDARY)
        .add(Text("⚙️ Settings"), color=KeyboardButtonColor.SECONDARY)
        .row()
        .add(Text("ℹ️ Help"), color=KeyboardButtonColor.SECONDARY)
    )


def get_cancel_keyboard() -> Keyboard:
    """Create keyboard with cancel button."""
    return Keyboard().add(Text("❌ Cancel"), color=KeyboardButtonColor.NEGATIVE)


# Command handlers
@bot.on.message(text="/start")
async def start_handler(message: Message):
    """Handle /start command."""
    await message.answer(
        "👋 Welcome to Deep Assistant VK Bot!\n\n"
        "I'm your AI assistant powered by multiple language models. "
        "I can help you with:\n\n"
        "💬 Chat with AI (GPT-4, Claude, Gemini, etc.)\n"
        "🎨 Generate images with DALL-E\n"
        "🔊 Transcribe audio messages\n"
        "📝 And much more!\n\n"
        "Choose an option below to get started:",
        keyboard=get_main_keyboard().get_json()
    )


@bot.on.message(text=["/help", "ℹ️ Help"])
async def help_handler(message: Message):
    """Handle /help command."""
    await message.answer(
        "📚 Help & Commands\n\n"
        "Available commands:\n"
        "/start - Start the bot\n"
        "/help - Show this help message\n"
        "/balance - Check your token balance\n"
        "/models - List available AI models\n\n"
        "Quick Actions:\n"
        "💬 Chat with GPT - Start a conversation with AI\n"
        "🎨 Generate Image - Create images from text\n"
        "💰 Balance - View your token balance\n"
        "⚙️ Settings - Configure bot preferences\n\n"
        "Need more help? Contact support or visit our documentation.",
        keyboard=get_main_keyboard().get_json()
    )


@bot.on.message(text=["/balance", "💰 Balance"])
async def balance_handler(message: Message):
    """Handle /balance command."""
    if not api_gateway:
        await message.answer(
            "⚠️ API Gateway is not configured. Please set up environment variables.",
            keyboard=get_main_keyboard().get_json()
        )
        return

    try:
        balance = await api_gateway.get_user_balance(message.from_id)
        await message.answer(
            f"💰 Your Balance\n\n"
            f"Current balance: {balance} tokens\n\n"
            f"Tokens are used for:\n"
            f"• AI chat messages (~10-100 tokens per message)\n"
            f"• Image generation (~100 tokens per image)\n"
            f"• Audio transcription (~50 tokens per minute)\n\n"
            f"{'⚠️ Low balance! Consider purchasing more tokens.' if balance < 100 else '✅ You have enough tokens to continue.'}",
            keyboard=get_main_keyboard().get_json()
        )
    except Exception as e:
        await message.answer(
            f"❌ Error fetching balance: {str(e)}",
            keyboard=get_main_keyboard().get_json()
        )


@bot.on.message(text="/models")
async def models_handler(message: Message):
    """Handle /models command."""
    await message.answer(
        "🤖 Available AI Models\n\n"
        "Chat Models:\n"
        "• GPT-4 - Most capable OpenAI model\n"
        "• GPT-3.5 Turbo - Fast and efficient\n"
        "• Claude 3 Opus - Anthropic's best model\n"
        "• Claude 3 Sonnet - Balanced performance\n"
        "• Gemini Pro - Google's AI model\n"
        "• Llama 3 - Meta's open model\n\n"
        "Image Models:\n"
        "• DALL-E 3 - High-quality image generation\n"
        "• Stable Diffusion - Open-source alternative\n\n"
        "Use /settings to change your default model.",
        keyboard=get_main_keyboard().get_json()
    )


@bot.on.message(text=["💬 Chat with GPT"])
async def chat_start_handler(message: Message):
    """Start GPT chat conversation."""
    await bot.state_dispenser.set(message.peer_id, ConversationState.WAITING_FOR_MESSAGE)

    await message.answer(
        "💬 Chat Mode Activated\n\n"
        "Send me any message and I'll respond using AI. "
        "Your conversation history will be maintained.\n\n"
        "Type '❌ Cancel' to return to the main menu.",
        keyboard=get_cancel_keyboard().get_json()
    )


@bot.on.message(text=["❌ Cancel"])
async def cancel_handler(message: Message):
    """Cancel current operation."""
    await bot.state_dispenser.delete(message.peer_id)

    await message.answer(
        "Operation cancelled. Returning to main menu.",
        keyboard=get_main_keyboard().get_json()
    )


@bot.on.message(state=ConversationState.WAITING_FOR_MESSAGE)
async def chat_message_handler(message: Message):
    """Handle messages in chat mode."""
    if not api_gateway:
        await message.answer(
            "⚠️ API Gateway is not configured.",
            keyboard=get_main_keyboard().get_json()
        )
        await bot.state_dispenser.delete(message.peer_id)
        return

    # Check balance
    try:
        balance = await api_gateway.get_user_balance(message.from_id)
        if balance < 10:
            await message.answer(
                "⚠️ Insufficient balance. You need at least 10 tokens to send a message.\n"
                "Use /balance to check your balance.",
                keyboard=get_main_keyboard().get_json()
            )
            await bot.state_dispenser.delete(message.peer_id)
            return
    except Exception as e:
        print(f"Error checking balance: {e}")

    # Send "typing" indicator
    await message.answer("🤔 Thinking...")

    # Send to API Gateway
    try:
        response = await api_gateway.chat_completion(
            user_id=message.from_id,
            message=message.text,
            model="gpt-3.5-turbo"
        )

        # Extract response text
        content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
        tokens_used = response.get("usage", {}).get("total_tokens", 0)

        if content:
            await message.answer(
                f"{content}\n\n"
                f"_Tokens used: {tokens_used}_",
                keyboard=get_cancel_keyboard().get_json()
            )
        else:
            await message.answer(
                "❌ Received empty response from API.",
                keyboard=get_cancel_keyboard().get_json()
            )

    except Exception as e:
        await message.answer(
            f"❌ Error: {str(e)}\n\n"
            "Please try again or contact support if the issue persists.",
            keyboard=get_main_keyboard().get_json()
        )
        await bot.state_dispenser.delete(message.peer_id)


@bot.on.message(text=["🎨 Generate Image"])
async def image_handler(message: Message):
    """Handle image generation request."""
    await message.answer(
        "🎨 Image Generation\n\n"
        "This feature will be available soon!\n\n"
        "You'll be able to generate images by describing what you want to see.",
        keyboard=get_main_keyboard().get_json()
    )


@bot.on.message(text=["⚙️ Settings"])
async def settings_handler(message: Message):
    """Handle settings request."""
    await message.answer(
        "⚙️ Settings\n\n"
        "Settings panel will be available soon!\n\n"
        "You'll be able to:\n"
        "• Choose your preferred AI model\n"
        "• Set language preference\n"
        "• Configure conversation history\n"
        "• And more!",
        keyboard=get_main_keyboard().get_json()
    )


@bot.on.message()
async def fallback_handler(message: Message):
    """Handle unknown messages."""
    await message.answer(
        "🤔 I didn't understand that command.\n\n"
        "Use the buttons below or type /help to see available commands.",
        keyboard=get_main_keyboard().get_json()
    )


# Main entry point
async def main():
    """Main function to run the bot."""
    print("🤖 VK Bot is starting...")
    print(f"📡 API Gateway URL: {API_GATEWAY_URL}")
    print(f"🔐 API Gateway configured: {'Yes' if API_GATEWAY_TOKEN else 'No'}")
    print("✅ Bot is ready!")

    try:
        await bot.run_polling()
    finally:
        if api_gateway:
            await api_gateway.close_session()


if __name__ == "__main__":
    asyncio.run(main())

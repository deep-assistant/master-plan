#!/usr/bin/env node
/**
 * Minimal VK Bot Example (JavaScript/Node.js)
 *
 * This is a proof-of-concept VK bot that demonstrates:
 * - Basic command handling (/start, /help)
 * - Keyboard layouts
 * - Integration with API Gateway for GPT chat
 * - User balance checking
 *
 * This example is intended to be moved to the vk-bot repository.
 *
 * Dependencies:
 *     npm install node-vk-bot-api axios dotenv
 *
 * Environment Variables:
 *     VK_GROUP_TOKEN - VK community access token
 *     API_GATEWAY_URL - API Gateway base URL
 *     API_GATEWAY_TOKEN - API Gateway authentication token
 */

const VkBot = require('node-vk-bot-api');
const axios = require('axios');
require('dotenv').config();

// Configuration
const VK_GROUP_TOKEN = process.env.VK_GROUP_TOKEN;
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'https://api.deep-assistant.com';
const API_GATEWAY_TOKEN = process.env.API_GATEWAY_TOKEN;

if (!VK_GROUP_TOKEN) {
  console.error('❌ VK_GROUP_TOKEN environment variable is required');
  process.exit(1);
}

// Initialize bot
const bot = new VkBot({
  token: VK_GROUP_TOKEN,
  confirmation: process.env.VK_CONFIRMATION_TOKEN // For webhook mode
});

// In-memory state storage (use Redis in production)
const userStates = new Map();

// API Gateway Service
class APIGatewayService {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl;
    this.token = token;
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });
  }

  async chatCompletion(userId, message, model = 'gpt-3.5-turbo') {
    try {
      const response = await this.client.post('/v1/chat/completions', {
        model: model,
        messages: [{ role: 'user', content: message }],
        user_id: String(userId)
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`API Gateway error: ${error.response.status} - ${error.response.data}`);
      }
      throw new Error(`API Gateway request failed: ${error.message}`);
    }
  }

  async getUserBalance(userId) {
    try {
      const response = await this.client.get(`/tokens/${userId}`);
      return response.data.balance || 0;
    } catch (error) {
      // If user doesn't exist, return 0
      if (error.response && error.response.status === 404) {
        return 0;
      }
      console.error(`Error fetching balance: ${error.message}`);
      return 0;
    }
  }
}

// Initialize API Gateway service
const apiGateway = API_GATEWAY_TOKEN
  ? new APIGatewayService(API_GATEWAY_URL, API_GATEWAY_TOKEN)
  : null;

// Keyboard Layouts
const Keyboard = VkBot.Keyboard;

function getMainKeyboard() {
  return Keyboard.keyboard([
    [
      Keyboard.textButton({
        label: '💬 Chat with GPT',
        color: Keyboard.PRIMARY_COLOR
      })
    ],
    [
      Keyboard.textButton({
        label: '🎨 Generate Image',
        color: Keyboard.POSITIVE_COLOR
      })
    ],
    [
      Keyboard.textButton({
        label: '💰 Balance',
        color: Keyboard.SECONDARY_COLOR
      }),
      Keyboard.textButton({
        label: '⚙️ Settings',
        color: Keyboard.SECONDARY_COLOR
      })
    ],
    [
      Keyboard.textButton({
        label: 'ℹ️ Help',
        color: Keyboard.SECONDARY_COLOR
      })
    ]
  ]);
}

function getCancelKeyboard() {
  return Keyboard.keyboard([
    [
      Keyboard.textButton({
        label: '❌ Cancel',
        color: Keyboard.NEGATIVE_COLOR
      })
    ]
  ]);
}

// Helper functions
function setUserState(userId, state) {
  userStates.set(userId, state);
}

function getUserState(userId) {
  return userStates.get(userId) || null;
}

function clearUserState(userId) {
  userStates.delete(userId);
}

// Command Handlers

// /start command
bot.command('/start', async (ctx) => {
  await ctx.reply(
    '👋 Welcome to Deep Assistant VK Bot!\n\n' +
    'I\'m your AI assistant powered by multiple language models. ' +
    'I can help you with:\n\n' +
    '💬 Chat with AI (GPT-4, Claude, Gemini, etc.)\n' +
    '🎨 Generate images with DALL-E\n' +
    '🔊 Transcribe audio messages\n' +
    '📝 And much more!\n\n' +
    'Choose an option below to get started:',
    null,
    getMainKeyboard()
  );
});

// /help command
bot.command('/help', async (ctx) => {
  await ctx.reply(
    '📚 Help & Commands\n\n' +
    'Available commands:\n' +
    '/start - Start the bot\n' +
    '/help - Show this help message\n' +
    '/balance - Check your token balance\n' +
    '/models - List available AI models\n\n' +
    'Quick Actions:\n' +
    '💬 Chat with GPT - Start a conversation with AI\n' +
    '🎨 Generate Image - Create images from text\n' +
    '💰 Balance - View your token balance\n' +
    '⚙️ Settings - Configure bot preferences\n\n' +
    'Need more help? Contact support or visit our documentation.',
    null,
    getMainKeyboard()
  );
});

// /balance command
bot.command('/balance', async (ctx) => {
  if (!apiGateway) {
    await ctx.reply(
      '⚠️ API Gateway is not configured. Please set up environment variables.',
      null,
      getMainKeyboard()
    );
    return;
  }

  try {
    const balance = await apiGateway.getUserBalance(ctx.message.from_id);
    const lowBalance = balance < 100;

    await ctx.reply(
      `💰 Your Balance\n\n` +
      `Current balance: ${balance} tokens\n\n` +
      `Tokens are used for:\n` +
      `• AI chat messages (~10-100 tokens per message)\n` +
      `• Image generation (~100 tokens per image)\n` +
      `• Audio transcription (~50 tokens per minute)\n\n` +
      (lowBalance
        ? '⚠️ Low balance! Consider purchasing more tokens.'
        : '✅ You have enough tokens to continue.'
      ),
      null,
      getMainKeyboard()
    );
  } catch (error) {
    await ctx.reply(
      `❌ Error fetching balance: ${error.message}`,
      null,
      getMainKeyboard()
    );
  }
});

// /models command
bot.command('/models', async (ctx) => {
  await ctx.reply(
    '🤖 Available AI Models\n\n' +
    'Chat Models:\n' +
    '• GPT-4 - Most capable OpenAI model\n' +
    '• GPT-3.5 Turbo - Fast and efficient\n' +
    '• Claude 3 Opus - Anthropic\'s best model\n' +
    '• Claude 3 Sonnet - Balanced performance\n' +
    '• Gemini Pro - Google\'s AI model\n' +
    '• Llama 3 - Meta\'s open model\n\n' +
    'Image Models:\n' +
    '• DALL-E 3 - High-quality image generation\n' +
    '• Stable Diffusion - Open-source alternative\n\n' +
    'Use /settings to change your default model.',
    null,
    getMainKeyboard()
  );
});

// Button handlers
bot.on((ctx) => {
  const text = ctx.message.text;

  // Help button
  if (text === 'ℹ️ Help') {
    return ctx.reply(
      '📚 Help & Commands\n\n' +
      'Available commands:\n' +
      '/start - Start the bot\n' +
      '/help - Show this help message\n' +
      '/balance - Check your token balance\n' +
      '/models - List available AI models\n\n' +
      'Quick Actions:\n' +
      '💬 Chat with GPT - Start a conversation with AI\n' +
      '🎨 Generate Image - Create images from text\n' +
      '💰 Balance - View your token balance\n' +
      '⚙️ Settings - Configure bot preferences\n\n' +
      'Need more help? Contact support or visit our documentation.',
      null,
      getMainKeyboard()
    );
  }

  // Balance button
  if (text === '💰 Balance') {
    return handleBalanceButton(ctx);
  }

  // Chat with GPT button
  if (text === '💬 Chat with GPT') {
    return handleChatStart(ctx);
  }

  // Cancel button
  if (text === '❌ Cancel') {
    return handleCancel(ctx);
  }

  // Generate Image button
  if (text === '🎨 Generate Image') {
    return ctx.reply(
      '🎨 Image Generation\n\n' +
      'This feature will be available soon!\n\n' +
      'You\'ll be able to generate images by describing what you want to see.',
      null,
      getMainKeyboard()
    );
  }

  // Settings button
  if (text === '⚙️ Settings') {
    return ctx.reply(
      '⚙️ Settings\n\n' +
      'Settings panel will be available soon!\n\n' +
      'You\'ll be able to:\n' +
      '• Choose your preferred AI model\n' +
      '• Set language preference\n' +
      '• Configure conversation history\n' +
      '• And more!',
      null,
      getMainKeyboard()
    );
  }

  // Handle chat messages in conversation state
  const state = getUserState(ctx.message.from_id);
  if (state === 'WAITING_FOR_MESSAGE') {
    return handleChatMessage(ctx);
  }

  // Fallback for unknown messages
  return ctx.reply(
    '🤔 I didn\'t understand that command.\n\n' +
    'Use the buttons below or type /help to see available commands.',
    null,
    getMainKeyboard()
  );
});

// Handler functions
async function handleBalanceButton(ctx) {
  if (!apiGateway) {
    await ctx.reply(
      '⚠️ API Gateway is not configured. Please set up environment variables.',
      null,
      getMainKeyboard()
    );
    return;
  }

  try {
    const balance = await apiGateway.getUserBalance(ctx.message.from_id);
    const lowBalance = balance < 100;

    await ctx.reply(
      `💰 Your Balance\n\n` +
      `Current balance: ${balance} tokens\n\n` +
      `Tokens are used for:\n` +
      `• AI chat messages (~10-100 tokens per message)\n` +
      `• Image generation (~100 tokens per image)\n` +
      `• Audio transcription (~50 tokens per minute)\n\n` +
      (lowBalance
        ? '⚠️ Low balance! Consider purchasing more tokens.'
        : '✅ You have enough tokens to continue.'
      ),
      null,
      getMainKeyboard()
    );
  } catch (error) {
    await ctx.reply(
      `❌ Error fetching balance: ${error.message}`,
      null,
      getMainKeyboard()
    );
  }
}

async function handleChatStart(ctx) {
  setUserState(ctx.message.from_id, 'WAITING_FOR_MESSAGE');

  await ctx.reply(
    '💬 Chat Mode Activated\n\n' +
    'Send me any message and I\'ll respond using AI. ' +
    'Your conversation history will be maintained.\n\n' +
    'Type \'❌ Cancel\' to return to the main menu.',
    null,
    getCancelKeyboard()
  );
}

async function handleCancel(ctx) {
  clearUserState(ctx.message.from_id);

  await ctx.reply(
    'Operation cancelled. Returning to main menu.',
    null,
    getMainKeyboard()
  );
}

async function handleChatMessage(ctx) {
  if (!apiGateway) {
    await ctx.reply(
      '⚠️ API Gateway is not configured.',
      null,
      getMainKeyboard()
    );
    clearUserState(ctx.message.from_id);
    return;
  }

  // Check balance
  try {
    const balance = await apiGateway.getUserBalance(ctx.message.from_id);
    if (balance < 10) {
      await ctx.reply(
        '⚠️ Insufficient balance. You need at least 10 tokens to send a message.\n' +
        'Use /balance to check your balance.',
        null,
        getMainKeyboard()
      );
      clearUserState(ctx.message.from_id);
      return;
    }
  } catch (error) {
    console.error(`Error checking balance: ${error.message}`);
  }

  // Send "thinking" indicator
  await ctx.reply('🤔 Thinking...');

  // Send to API Gateway
  try {
    const response = await apiGateway.chatCompletion(
      ctx.message.from_id,
      ctx.message.text,
      'gpt-3.5-turbo'
    );

    // Extract response text
    const content = response.choices?.[0]?.message?.content || '';
    const tokensUsed = response.usage?.total_tokens || 0;

    if (content) {
      await ctx.reply(
        `${content}\n\n_Tokens used: ${tokensUsed}_`,
        null,
        getCancelKeyboard()
      );
    } else {
      await ctx.reply(
        '❌ Received empty response from API.',
        null,
        getCancelKeyboard()
      );
    }
  } catch (error) {
    await ctx.reply(
      `❌ Error: ${error.message}\n\n` +
      'Please try again or contact support if the issue persists.',
      null,
      getMainKeyboard()
    );
    clearUserState(ctx.message.from_id);
  }
}

// Start bot
console.log('🤖 VK Bot is starting...');
console.log(`📡 API Gateway URL: ${API_GATEWAY_URL}`);
console.log(`🔐 API Gateway configured: ${apiGateway ? 'Yes' : 'No'}`);
console.log('✅ Bot is ready!');

bot.startPolling((error) => {
  if (error) {
    console.error('❌ Polling error:', error);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down bot...');
  process.exit(0);
});

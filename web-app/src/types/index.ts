// Message types following OpenAI chat format
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

// Chat completion request
export interface ChatCompletionRequest {
  model: string;
  messages: Message[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

// Chat completion response (non-streaming)
export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: Message;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Streaming chunk format
export interface ChatCompletionChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

// Token management
export interface TokenInfo {
  token: string;
  userId: string;
  balance: number;
}

// Model information
export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  contextWindow?: number;
  costPer1kTokens?: number;
  provider?: string;
  capabilities?: string[];
}

// Application state
export interface AppState {
  // Authentication
  token: string | null;
  tokenBalance: number;
  isAuthenticated: boolean;

  // Chat
  messages: Message[];
  currentModel: string;
  isStreaming: boolean;
  currentStreamingMessage: string;

  // UI
  isLoading: boolean;
  error: string | null;

  // Available models
  models: ModelInfo[];
}

// API Error response
export interface ApiError {
  error: {
    message: string;
    type?: string;
    code?: string;
  };
}

// Configuration
export interface AppConfig {
  apiGatewayUrl: string;
  appTitle: string;
  defaultModel: string;
  enableImageGeneration: boolean;
  enableAudioTranscription: boolean;
  enableTextToSpeech: boolean;
}

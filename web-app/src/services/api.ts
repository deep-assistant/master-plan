import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  TokenInfo,
  Message,
  ApiError,
} from '../types';
import { getApiUrl } from './config';

class ApiService {
  private token: string | null = null;

  // Set authentication token
  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('deep_assistant_token', token);
    } else {
      localStorage.removeItem('deep_assistant_token');
    }
  }

  // Get authentication token
  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('deep_assistant_token');
    }
    return this.token;
  }

  // Get authorization headers
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Handle API errors
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorData: ApiError = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch {
        // If can't parse error JSON, use default message
      }

      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Create chat completion (non-streaming)
  async createChatCompletion(
    messages: Message[],
    model: string,
    options: Partial<ChatCompletionRequest> = {}
  ): Promise<ChatCompletionResponse> {
    const request: ChatCompletionRequest = {
      model,
      messages,
      stream: false,
      ...options,
    };

    const response = await fetch(getApiUrl('/v1/chat/completions'), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    return this.handleResponse<ChatCompletionResponse>(response);
  }

  // Create streaming chat completion (returns EventSource URL)
  getStreamingUrl(
    messages: Message[],
    model: string,
    options: Partial<ChatCompletionRequest> = {}
  ): string {
    const request: ChatCompletionRequest = {
      model,
      messages,
      stream: true,
      ...options,
    };

    const token = this.getToken();
    const params = new URLSearchParams({
      request: JSON.stringify(request),
      ...(token ? { token } : {}),
    });

    return `${getApiUrl('/v1/chat/completions')}?${params.toString()}`;
  }

  // Validate token
  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(getApiUrl('/token/has'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  // Get token balance
  async getTokenBalance(): Promise<number> {
    const response = await fetch(getApiUrl('/token'), {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await this.handleResponse<TokenInfo>(response);
    return data.balance;
  }

  // Create new token
  async createToken(): Promise<string> {
    const response = await fetch(getApiUrl('/token'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await this.handleResponse<{ token: string }>(response);
    return data.token;
  }

  // Get conversation history
  async getConversation(): Promise<Message[]> {
    const response = await fetch(getApiUrl('/dialog'), {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await this.handleResponse<{ messages: Message[] }>(response);
    return data.messages || [];
  }

  // Clear conversation history
  async clearConversation(): Promise<void> {
    await fetch(getApiUrl('/dialog'), {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }
}

// Export singleton instance
export const api = new ApiService();

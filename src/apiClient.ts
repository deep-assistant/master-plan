import * as vscode from 'vscode';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface CompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    energy?: number;
  };
}

export class ApiClient {
  private getConfig() {
    return vscode.workspace.getConfiguration('deepAssistant');
  }

  private getApiBaseUrl(): string {
    return this.getConfig().get('apiBaseUrl', 'https://api.deep-assistant.com');
  }

  private getApiToken(): string {
    const token = this.getConfig().get('apiToken', '');
    if (!token) {
      vscode.window.showErrorMessage(
        'Deep Assistant: API token is not configured. Please set it in settings.'
      );
      return '';
    }
    return token as string;
  }

  private getDefaultModel(): string {
    return this.getConfig().get('defaultModel', 'gpt-4o-mini');
  }

  private getSystemMessage(): string {
    return this.getConfig().get(
      'systemMessage',
      'You are a helpful AI assistant integrated into VS Code.'
    );
  }

  async sendMessage(userMessage: string): Promise<string> {
    const apiToken = this.getApiToken();
    if (!apiToken) {
      return 'Error: API token not configured';
    }

    const apiBaseUrl = this.getApiBaseUrl();
    const model = this.getDefaultModel();
    const systemMessage = this.getSystemMessage();

    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ];

      const response = await fetch(`${apiBaseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);

        if (response.status === 401) {
          return 'Error: Invalid API token. Please check your settings.';
        } else if (response.status === 429) {
          return 'Error: Insufficient balance. Please top up your account.';
        }

        return `Error: API request failed with status ${response.status}`;
      }

      const data: CompletionResponse = await response.json();

      if (data.choices && data.choices.length > 0) {
        let result = data.choices[0].message.content;

        // Optionally show token usage
        if (this.getConfig().get('showTokenUsage', true) && data.usage) {
          const energy = data.usage.energy || 0;
          result += `\n\n_Token usage: ${data.usage.total_tokens} tokens (${energy.toFixed(2)} energy)_`;
        }

        return result;
      }

      return 'Error: No response from AI';
    } catch (error) {
      console.error('API client error:', error);
      return `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
    }
  }

  async clearDialog(): Promise<void> {
    const apiToken = this.getApiToken();
    if (!apiToken) {
      return;
    }

    const apiBaseUrl = this.getApiBaseUrl();

    try {
      // Get user ID from token (for now, we'll use a placeholder)
      // In production, this should be derived from the token or user profile
      const userId = 'vscode-user';

      const response = await fetch(`${apiBaseUrl}/dialog?masterToken=${apiToken}&userId=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.error('Failed to clear dialog:', response.statusText);
      }
    } catch (error) {
      console.error('Error clearing dialog:', error);
    }
  }
}

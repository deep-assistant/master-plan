import type { ChatCompletionChunk } from '../types';

export interface StreamingCallbacks {
  onChunk: (content: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export class StreamingService {
  private eventSource: EventSource | null = null;

  // Start streaming chat completion
  startStreaming(url: string, callbacks: StreamingCallbacks): void {
    // Clean up any existing stream
    this.stopStreaming();

    try {
      this.eventSource = new EventSource(url);

      this.eventSource.onmessage = (event) => {
        // Check for stream completion
        if (event.data === '[DONE]') {
          callbacks.onComplete();
          this.stopStreaming();
          return;
        }

        try {
          const chunk: ChatCompletionChunk = JSON.parse(event.data);

          // Extract content from delta
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            callbacks.onChunk(content);
          }

          // Check if this is the final chunk
          if (chunk.choices[0]?.finish_reason) {
            callbacks.onComplete();
            this.stopStreaming();
          }
        } catch (error) {
          console.error('Failed to parse streaming chunk:', error);
        }
      };

      this.eventSource.onerror = (event) => {
        const error = new Error('Streaming connection error');
        callbacks.onError(error);
        this.stopStreaming();
      };
    } catch (error) {
      callbacks.onError(error instanceof Error ? error : new Error('Failed to start streaming'));
    }
  }

  // Stop streaming
  stopStreaming(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  // Check if currently streaming
  isStreaming(): boolean {
    return this.eventSource !== null;
  }
}

// Export singleton instance
export const streamingService = new StreamingService();

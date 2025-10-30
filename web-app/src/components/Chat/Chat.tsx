import { useState, useEffect, useCallback } from 'react';
import type { Message } from '../../types';
import { api } from '../../services/api';
import { streamingService } from '../../services/streaming';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import styles from './Chat.module.css';

interface ChatProps {
  currentModel: string;
  onTokenBalanceUpdate?: (balance: number) => void;
}

export function Chat({ currentModel, onTokenBalanceUpdate }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load conversation history on mount
  useEffect(() => {
    loadConversation();
  }, []);

  const loadConversation = async () => {
    try {
      const history = await api.getConversation();
      setMessages(history);
    } catch (err) {
      console.error('Failed to load conversation:', err);
      // Don't show error for failed history load
    }
  };

  const handleSendMessage = useCallback(
    async (content: string) => {
      const userMessage: Message = {
        role: 'user',
        content,
        timestamp: new Date(),
      };

      // Add user message to UI
      setMessages((prev) => [...prev, userMessage]);
      setError(null);
      setIsStreaming(true);
      setStreamingMessage('');

      try {
        // Get streaming URL
        const allMessages = [...messages, userMessage];
        const streamUrl = api.getStreamingUrl(allMessages, currentModel);

        // Start streaming
        streamingService.startStreaming(streamUrl, {
          onChunk: (chunk) => {
            setStreamingMessage((prev) => prev + chunk);
          },
          onComplete: () => {
            // Add complete assistant message to messages
            setMessages((prev) => [
              ...prev,
              {
                role: 'assistant',
                content: streamingMessage,
                timestamp: new Date(),
              },
            ]);
            setStreamingMessage('');
            setIsStreaming(false);

            // Update token balance
            if (onTokenBalanceUpdate) {
              api.getTokenBalance().then(onTokenBalanceUpdate).catch(console.error);
            }
          },
          onError: (err) => {
            setError(err.message);
            setIsStreaming(false);
            setStreamingMessage('');
          },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
        setIsStreaming(false);
      }
    },
    [messages, currentModel, streamingMessage, onTokenBalanceUpdate]
  );

  return (
    <div className={styles.container}>
      {error && (
        <div className={styles.error}>
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      <MessageList messages={messages} isStreaming={isStreaming} streamingMessage={streamingMessage} />
      <ChatInput onSend={handleSendMessage} disabled={isStreaming} />
    </div>
  );
}

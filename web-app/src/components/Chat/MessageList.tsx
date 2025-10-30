import { useEffect, useRef } from 'react';
import type { Message as MessageType } from '../../types';
import { Message } from './Message';
import { Loading } from '../Common/Loading';
import styles from './MessageList.module.css';

interface MessageListProps {
  messages: MessageType[];
  isStreaming: boolean;
  streamingMessage?: string;
}

export function MessageList({ messages, isStreaming, streamingMessage }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  return (
    <div className={styles.container}>
      {messages.length === 0 && !isStreaming && (
        <div className={styles.empty}>
          <h2>Welcome to Deep Assistant</h2>
          <p>Start a conversation by typing a message below.</p>
        </div>
      )}

      {messages.map((message, index) => (
        <Message key={index} message={message} />
      ))}

      {isStreaming && streamingMessage && (
        <Message
          message={{
            role: 'assistant',
            content: streamingMessage,
            timestamp: new Date(),
          }}
        />
      )}

      {isStreaming && !streamingMessage && (
        <div className={styles.loadingContainer}>
          <Loading size="small" text="Thinking..." />
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

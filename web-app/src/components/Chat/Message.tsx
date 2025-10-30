import type { Message as MessageType } from '../../types';
import { renderMarkdown } from '../../utils/markdown';
import { formatTimestamp } from '../../utils/format';
import styles from './Message.module.css';

interface MessageProps {
  message: MessageType;
}

export function Message({ message }: MessageProps) {
  if (message.role === 'system') {
    return null; // Don't render system messages
  }

  const isUser = message.role === 'user';
  const htmlContent = isUser ? null : renderMarkdown(message.content);

  return (
    <div className={`${styles.message} ${isUser ? styles.user : styles.assistant}`}>
      <div className={styles.header}>
        <span className={styles.role}>{isUser ? 'You' : 'Assistant'}</span>
        {message.timestamp && (
          <span className={styles.timestamp}>{formatTimestamp(message.timestamp)}</span>
        )}
      </div>
      <div className={styles.content}>
        {isUser ? (
          <p className={styles.text}>{message.content}</p>
        ) : (
          <div
            className={styles.markdown}
            dangerouslySetInnerHTML={{ __html: htmlContent || '' }}
          />
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Input } from '../Common/Input';
import { Button } from '../Common/Button';
import { Loading } from '../Common/Loading';
import styles from './AuthScreen.module.css';

interface AuthScreenProps {
  onAuthenticate: (token: string) => void;
}

export function AuthScreen({ onAuthenticate }: AuthScreenProps) {
  const [token, setToken] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim().length === 32) {
      onAuthenticate(token.trim());
    } else {
      setError('Token must be exactly 32 characters');
    }
  };

  const handleGenerateToken = async () => {
    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to generate token');
      }

      const data = await response.json();
      setToken(data.token);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate token');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Welcome to Deep Assistant</h1>
        <p className={styles.subtitle}>
          Enter your authentication token or generate a new one to get started.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Authentication Token"
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter 32-character token"
            error={error}
            maxLength={32}
          />

          <div className={styles.buttons}>
            <Button type="submit" variant="primary" size="large" disabled={!token.trim()}>
              Sign In
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="large"
              onClick={handleGenerateToken}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate New Token'}
            </Button>
          </div>
        </form>

        {isGenerating && (
          <div className={styles.loading}>
            <Loading size="small" text="Generating token..." />
          </div>
        )}

        <div className={styles.info}>
          <h3>What is a token?</h3>
          <p>
            Your authentication token is a unique identifier that gives you access to the Deep
            Assistant platform. It also tracks your token balance for AI service usage.
          </p>
          <p>New tokens start with 10,000 free tokens to get you started!</p>
        </div>
      </div>
    </div>
  );
}

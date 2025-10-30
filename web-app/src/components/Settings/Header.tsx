import { formatTokenBalance } from '../../utils/format';
import { ModelSelector } from '../ModelSelector/ModelSelector';
import type { ModelInfo } from '../../types';
import styles from './Header.module.css';

interface HeaderProps {
  appTitle: string;
  tokenBalance: number;
  currentModel: string;
  models: ModelInfo[];
  onModelChange: (modelId: string) => void;
  onSignOut: () => void;
}

export function Header({
  appTitle,
  tokenBalance,
  currentModel,
  models,
  onModelChange,
  onSignOut,
}: HeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{appTitle}</h1>

      <div className={styles.controls}>
        <ModelSelector currentModel={currentModel} models={models} onModelChange={onModelChange} />

        <div className={styles.balance}>
          <span className={styles.balanceLabel}>Balance:</span>
          <span className={styles.balanceValue}>{formatTokenBalance(tokenBalance)}</span>
        </div>

        <button className={styles.signOutButton} onClick={onSignOut} title="Sign Out">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M13 3H16C16.5304 3 17.0391 3.21071 17.4142 3.58579C17.7893 3.96086 18 4.46957 18 5V15C18 15.5304 17.7893 16.0391 17.4142 16.4142C17.0391 16.7893 16.5304 17 16 17H13M7 13L3 10M3 10L7 7M3 10H13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}

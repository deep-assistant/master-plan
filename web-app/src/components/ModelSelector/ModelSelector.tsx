import { useState } from 'react';
import type { ModelInfo } from '../../types';
import styles from './ModelSelector.module.css';

interface ModelSelectorProps {
  currentModel: string;
  models: ModelInfo[];
  onModelChange: (modelId: string) => void;
}

export function ModelSelector({ currentModel, models, onModelChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentModelInfo = models.find((m) => m.id === currentModel);

  return (
    <div className={styles.container}>
      <button className={styles.trigger} onClick={() => setIsOpen(!isOpen)}>
        <span className={styles.modelName}>{currentModelInfo?.name || currentModel}</span>
        <svg
          className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setIsOpen(false)} />
          <div className={styles.dropdown}>
            {models.map((model) => (
              <button
                key={model.id}
                className={`${styles.option} ${model.id === currentModel ? styles.active : ''}`}
                onClick={() => {
                  onModelChange(model.id);
                  setIsOpen(false);
                }}
              >
                <div className={styles.optionContent}>
                  <span className={styles.optionName}>{model.name}</span>
                  {model.description && (
                    <span className={styles.optionDescription}>{model.description}</span>
                  )}
                </div>
                {model.id === currentModel && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M13 4L6 11L3 8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

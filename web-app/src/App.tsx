import { useState, useEffect } from 'react';
import { AuthScreen } from './components/Settings/AuthScreen';
import { Header } from './components/Settings/Header';
import { Chat } from './components/Chat/Chat';
import { Loading } from './components/Common/Loading';
import { api } from './services/api';
import { config } from './services/config';
import type { ModelInfo } from './types';
import './App.css';

// Default models (can be expanded)
const DEFAULT_MODELS: ModelInfo[] = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Fast and efficient for most tasks',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Most capable multimodal model',
  },
  {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Excellent for coding and analysis',
  },
  {
    id: 'claude-3.5-haiku',
    name: 'Claude 3.5 Haiku',
    description: 'Fast and cost-effective',
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    description: 'Advanced open-source model',
  },
];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [currentModel, setCurrentModel] = useState(config.defaultModel);
  const [models] = useState<ModelInfo[]>(DEFAULT_MODELS);

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = api.getToken();
      if (savedToken) {
        const isValid = await api.validateToken(savedToken);
        if (isValid) {
          setIsAuthenticated(true);
          // Load token balance
          try {
            const balance = await api.getTokenBalance();
            setTokenBalance(balance);
          } catch (err) {
            console.error('Failed to load token balance:', err);
          }
        } else {
          api.setToken(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleAuthenticate = async (token: string) => {
    setIsLoading(true);
    try {
      const isValid = await api.validateToken(token);
      if (isValid) {
        api.setToken(token);
        setIsAuthenticated(true);

        // Load token balance
        const balance = await api.getTokenBalance();
        setTokenBalance(balance);
      } else {
        alert('Invalid token. Please check and try again.');
      }
    } catch (err) {
      alert('Failed to authenticate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    api.setToken(null);
    setIsAuthenticated(false);
    setTokenBalance(0);
  };

  const handleModelChange = (modelId: string) => {
    setCurrentModel(modelId);
  };

  const handleTokenBalanceUpdate = (balance: number) => {
    setTokenBalance(balance);
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <Loading size="large" text="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen onAuthenticate={handleAuthenticate} />;
  }

  return (
    <div className="app">
      <Header
        appTitle={config.appTitle}
        tokenBalance={tokenBalance}
        currentModel={currentModel}
        models={models}
        onModelChange={handleModelChange}
        onSignOut={handleSignOut}
      />
      <Chat currentModel={currentModel} onTokenBalanceUpdate={handleTokenBalanceUpdate} />
    </div>
  );
}

export default App;

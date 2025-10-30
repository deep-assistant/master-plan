import type { AppConfig } from '../types';

// Load configuration from environment variables
export const config: AppConfig = {
  apiGatewayUrl: import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:3000',
  appTitle: import.meta.env.VITE_APP_TITLE || 'Deep Assistant',
  defaultModel: import.meta.env.VITE_DEFAULT_MODEL || 'gpt-4o-mini',
  enableImageGeneration: import.meta.env.VITE_ENABLE_IMAGE_GENERATION === 'true',
  enableAudioTranscription: import.meta.env.VITE_ENABLE_AUDIO_TRANSCRIPTION === 'true',
  enableTextToSpeech: import.meta.env.VITE_ENABLE_TEXT_TO_SPEECH === 'true',
};

// Helper to get API URL
export const getApiUrl = (path: string): string => {
  const baseUrl = config.apiGatewayUrl.replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');
  return `${baseUrl}/${cleanPath}`;
};

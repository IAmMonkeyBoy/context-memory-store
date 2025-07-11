import { EnvironmentConfig } from '@types';

export const config: EnvironmentConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/v1',
  wsBaseUrl: import.meta.env.VITE_WS_BASE_URL || '',
  environment: (import.meta.env.VITE_ENVIRONMENT as EnvironmentConfig['environment']) || 'development',
  features: {
    realTimeUpdates: import.meta.env.VITE_REAL_TIME_UPDATES === 'true',
    advancedAnalytics: import.meta.env.VITE_ADVANCED_ANALYTICS === 'true',
    debugMode: import.meta.env.VITE_DEBUG_MODE === 'true'
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Context Memory Store',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    description: import.meta.env.VITE_APP_DESCRIPTION || 'AI Coding Agent Memory Management System'
  }
};

export default config;
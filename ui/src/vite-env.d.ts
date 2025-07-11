/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_WS_BASE_URL: string
  readonly VITE_ENVIRONMENT: string
  readonly VITE_REAL_TIME_UPDATES: string
  readonly VITE_ADVANCED_ANALYTICS: string
  readonly VITE_DEBUG_MODE: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_APP_DESCRIPTION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Extend global crypto interface for randomUUID
declare global {
  interface Crypto {
    randomUUID(): string;
  }
}
// Re-export all types for easy importing
export * from './api';

// Application Types
export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  children?: NavigationItem[];
}

export interface AppState {
  theme: 'light' | 'dark';
  selectedProject: string;
  notifications: Notification[];
  connectionStatus: 'connected' | 'disconnected' | 'error';
}

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  details?: Record<string, any>;
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: Date;
  duration?: number; // Auto-dismiss duration in ms
}

// Environment Configuration
export interface EnvironmentConfig {
  apiBaseUrl: string;
  wsBaseUrl: string;
  environment: 'development' | 'staging' | 'production';
  features: {
    realTimeUpdates: boolean;
    advancedAnalytics: boolean;
    debugMode: boolean;
  };
  app: {
    name: string;
    version: string;
    description: string;
  };
}

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Form Types
export interface SearchFilters {
  query: string;
  documentTypes: string[];
  dateRange: { start: Date; end: Date };
  tags: string[];
  sourceTypes: string[];
  minScore: number;
}

export interface IngestionProgress {
  fileId: string;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  chunksCreated: number;
  relationshipsExtracted: number;
  error?: string;
  summary?: string;
}

// Chart Data Types
export interface MetricDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface ChartData {
  name: string;
  data: MetricDataPoint[];
  color?: string;
}
// API Response Types
export interface StandardResponse<T> {
  status: 'success' | 'error';
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
  };
  metadata?: {
    requestId: string;
    timestamp: string;
    version: string;
  };
}

// Health Types
export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
}

export interface DetailedHealthResponse {
  status: string;
  timestamp: string;
  version: string;
  dependencies: Record<string, any>;
  healthScore: number;
  trend: string;
}

// Document Types
export interface Document {
  id?: string;
  title: string;
  content: string;
  metadata: DocumentMetadata;
  source: DocumentSource;
}

export interface DocumentMetadata {
  filename?: string;
  size?: number;
  mimeType?: string;
  uploadedAt?: string;
  tags?: string[];
  summary?: string;
}

export interface DocumentSource {
  type: 'upload' | 'api' | 'import';
  uri?: string;
  originalPath?: string;
}

// Memory Types
export interface IngestDocumentsRequest {
  documents: Document[];
  options?: {
    autoSummarize: boolean;
    extractRelationships: boolean;
    chunkSize: number;
  };
}

export interface ContextQueryRequest {
  query: string;
  limit: number;
  includeRelationships: boolean;
  minScore: number;
}

export interface SearchQueryRequest {
  query: string;
  limit: number;
  offset: number;
  filter?: string;
  sort: 'relevance' | 'date' | 'title';
}

// Lifecycle Types
export interface StartEngineRequest {
  projectId: string;
  config?: Record<string, any>;
}

export interface StopEngineRequest {
  projectId: string;
  commitMessage?: string;
}

// Diagnostics Types
export interface SystemDiagnostics {
  timestamp: string;
  systemInfo: {
    platform: string;
    architecture: string;
    nodeVersion: string;
    totalMemory: number;
    freeMemory: number;
    uptime: number;
  };
  services: ServiceStatus[];
}

export interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  details?: Record<string, any>;
}

export interface SystemMetrics {
  timestamp: string;
  api: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
  };
  memory: {
    totalDocuments: number;
    totalChunks: number;
    vectorStoreSize: number;
    graphStoreSize: number;
  };
  performance: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  };
}

// Search Results
export interface SearchResult {
  id: string;
  title: string;
  content: string;
  score: number;
  metadata: DocumentMetadata;
  highlights: string[];
  relationships?: Relationship[];
}

export interface Relationship {
  type: string;
  source: string;
  target: string;
  weight: number;
  metadata?: Record<string, any>;
}

// Analysis Types
export interface AnalysisChunk {
  type: 'status' | 'analysis' | 'metadata' | 'done' | 'error';
  content: string;
  timestamp: string;
}
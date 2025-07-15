import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { config } from '../utils/config';
import {
  StandardResponse,
  HealthResponse,
  DetailedHealthResponse,
  SystemDiagnostics,
  SystemMetrics,
  IngestDocumentsRequest,
  ContextQueryRequest,
  SearchQueryRequest,
  StartEngineRequest,
  StopEngineRequest,
  SearchResult,
  LifecycleResult,
  SystemStatus,
  ProjectConfig,
} from '../../types';

// Advanced search filters interface
export interface AdvancedSearchFilters {
  types?: string[];
  tags?: string[];
  sources?: string[];
  minSize?: number;
  maxSize?: number;
  minRelevance?: number;
  sortBy?: string;
  sortOrder?: string;
  startDate?: string;
  endDate?: string;
}

// Create axios instance with default configuration
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: 30000, // 30 seconds
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor for logging and correlation IDs
  client.interceptors.request.use(
    (config) => {
      if (import.meta.env.DEV) {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
      }
      
      // Add correlation ID for request tracking
      config.headers['X-Correlation-ID'] = crypto.randomUUID();
      
      return config;
    },
    (error) => {
      console.error('[API] Request error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for logging and error handling
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      if (import.meta.env.DEV) {
        console.log(`[API] Response ${response.status}:`, response.data);
      }
      return response;
    },
    (error) => {
      console.error('[API] Response error:', error);
      
      // Handle common error scenarios
      if (error.response?.status === 401) {
        // Handle unauthorized (when auth is implemented)
        window.location.href = '/login';
      } else if (error.response?.status >= 500) {
        // Show user-friendly message for server errors
        console.error('Server error occurred. Please try again later.');
      }
      
      return Promise.reject(error);
    }
  );

  return client;
};

const apiClient = createApiClient();

// API Client class
export class ContextMemoryStoreClient {
  private client: AxiosInstance;

  constructor() {
    this.client = apiClient;
  }

  // Generic request methods
  private async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  private async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  private async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  private async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // Health endpoints
  health = {
    getBasic: () => this.get<HealthResponse>('/health'),
    getDetailed: () => this.get<DetailedHealthResponse>('/health/detailed'),
  };

  // Memory endpoints
  memory = {
    ingest: (request: IngestDocumentsRequest) =>
      this.post<StandardResponse<any>>('/memory/ingest', request),
    
    getContext: (params: ContextQueryRequest) =>
      this.get<StandardResponse<any>>('/memory/context', { params }),
    
    search: (params: SearchQueryRequest) =>
      this.get<StandardResponse<{ results: SearchResult[]; pagination: any }>>('/memory/search', { params }),
    
    // Advanced search with filters and pagination (fallback to basic search)
    searchAdvanced: (query: string, filters: AdvancedSearchFilters = {}, page: number = 1, pageSize: number = 20) => {
      // Map advanced search to basic search with filters as JSON
      const searchParams: SearchQueryRequest = {
        q: query,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        filter: Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined,
        sort: 'relevance'
      };
      return this.get<StandardResponse<{ results: SearchResult[]; pagination: any }>>('/memory/search', { params: searchParams });
    },
    
    // Document operations - not implemented in backend yet, return placeholder responses
    getDocument: (id: string) => {
      console.warn(`[API] getDocument(${id}) - Not implemented in backend, returning placeholder`);
      return Promise.resolve({
        success: false,
        message: 'Document retrieval not implemented',
        error_code: 'NOT_IMPLEMENTED',
        data: null
      } as StandardResponse<any>);
    },
    
    deleteDocument: (id: string) => {
      console.warn(`[API] deleteDocument(${id}) - Not implemented in backend, returning placeholder`);
      return Promise.resolve({
        success: false,
        message: 'Document deletion not implemented',
        error_code: 'NOT_IMPLEMENTED',
        data: null
      } as StandardResponse<any>);
    },
    
    getRelationships: (documentId: string) => {
      console.warn(`[API] getRelationships(${documentId}) - Not implemented in backend, returning placeholder`);
      return Promise.resolve({
        success: false,
        message: 'Relationship retrieval not implemented',
        error_code: 'NOT_IMPLEMENTED',
        data: []
      } as StandardResponse<any>);
    },
    
    // Search suggestions - not implemented in backend yet, return empty array
    getSuggestions: (query: string) => {
      console.warn(`[API] getSuggestions(${query}) - Not implemented in backend, returning empty suggestions`);
      return Promise.resolve({
        success: true,
        message: 'Search suggestions not implemented',
        error_code: null,
        data: []
      } as StandardResponse<string[]>);
    },
    
    // Memory analytics - not implemented in backend yet, return placeholder
    getAnalytics: () => {
      console.warn('[API] getAnalytics() - Not implemented in backend, returning placeholder data');
      return Promise.resolve({
        success: true,
        message: 'Analytics data (placeholder)',
        error_code: null,
        data: {
          totalDocuments: 0,
          totalChunks: 0,
          storageUsed: 0,
          indexSize: 0,
          memoryUsage: {
            vectorStore: 0,
            graphStore: 0
          },
          performance: {
            averageQueryTime: 0,
            indexingRate: 0
          }
        }
      } as StandardResponse<any>);
    },
    
    // Memory optimization - not implemented in backend yet, return placeholder
    optimize: () => {
      console.warn('[API] optimize() - Not implemented in backend, returning placeholder response');
      return Promise.resolve({
        success: true,
        message: 'Memory optimization not implemented',
        error_code: null,
        data: {
          optimizationResults: {
            duplicatesRemoved: 0,
            spaceReclaimed: 0,
            indexesRebuilt: 0
          }
        }
      } as StandardResponse<any>);
    },
    
    // Note: analyzeStream will be handled separately with EventSource
  };

  // Diagnostics endpoints (without /api prefix since we're already using /v1)
  diagnostics = {
    getSystem: () => this.get<SystemDiagnostics>('/diagnostics/system'),
    
    getPerformance: (timeRangeMinutes: number) =>
      this.get<any>('/diagnostics/performance', { 
        params: { timeRangeMinutes } 
      }),
    
    getConnectivity: () => this.get<any>('/diagnostics/connectivity'),
    
    getConfiguration: () => this.get<any>('/diagnostics/configuration'),
    
    getResources: () => this.get<any>('/diagnostics/resources'),
    
    getHealthCheck: () => this.get<any>('/diagnostics/health-check'),
    
    getRecommendations: () => this.get<any[]>('/diagnostics/recommendations'),
    
    getReport: () => this.get<any>('/diagnostics/report'),
    
    getMetrics: () => this.get<SystemMetrics>('/diagnostics/metrics'),
  };

  // Metrics endpoint (Prometheus format)
  metrics = {
    getPrometheus: () => this.get<string>('/metrics'),
  };

  // Lifecycle endpoints
  lifecycle = {
    start: (request: StartEngineRequest) => 
      this.post<StandardResponse<LifecycleResult>>('/lifecycle/start', request),
    
    stop: (request: StopEngineRequest) => 
      this.post<StandardResponse<LifecycleResult>>('/lifecycle/stop', request),
    
    getStatus: (projectId: string) => 
      this.get<StandardResponse<SystemStatus>>('/lifecycle/status', { params: { projectId } }),
  };
}

// Create and export singleton instance
export const api = new ContextMemoryStoreClient();
export default api;
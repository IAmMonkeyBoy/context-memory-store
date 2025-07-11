import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { api } from '@services';
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
  StopEngineRequest 
} from '@types';

// Query keys for consistent caching
export const queryKeys = {
  health: {
    basic: ['health', 'basic'] as const,
    detailed: ['health', 'detailed'] as const,
  },
  diagnostics: {
    system: ['diagnostics', 'system'] as const,
    performance: (timeRange: number) => ['diagnostics', 'performance', timeRange] as const,
    connectivity: ['diagnostics', 'connectivity'] as const,
    configuration: ['diagnostics', 'configuration'] as const,
    resources: ['diagnostics', 'resources'] as const,
    healthCheck: ['diagnostics', 'health-check'] as const,
    recommendations: ['diagnostics', 'recommendations'] as const,
    report: ['diagnostics', 'report'] as const,
    metrics: ['diagnostics', 'metrics'] as const,
  },
  memory: {
    context: (params: ContextQueryRequest) => ['memory', 'context', params] as const,
    search: (params: SearchQueryRequest) => ['memory', 'search', params] as const,
  },
  lifecycle: {
    status: (projectId: string) => ['lifecycle', 'status', projectId] as const,
  },
  metrics: {
    prometheus: ['metrics', 'prometheus'] as const,
  },
} as const;

// Default query configurations
const defaultQueryConfig = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  retry: 3,
  refetchOnWindowFocus: false,
};

const realtimeQueryConfig = {
  ...defaultQueryConfig,
  staleTime: 30 * 1000, // 30 seconds
  refetchInterval: 30 * 1000, // 30 seconds
};

const frequentQueryConfig = {
  ...defaultQueryConfig,
  staleTime: 10 * 1000, // 10 seconds
  refetchInterval: 10 * 1000, // 10 seconds
};

// Health hooks
export const useBasicHealth = (options?: UseQueryOptions<HealthResponse>) => {
  return useQuery({
    queryKey: queryKeys.health.basic,
    queryFn: () => api.health.getBasic(),
    ...realtimeQueryConfig,
    ...options,
  });
};

export const useDetailedHealth = (options?: UseQueryOptions<DetailedHealthResponse>) => {
  return useQuery({
    queryKey: queryKeys.health.detailed,
    queryFn: () => api.health.getDetailed(),
    ...realtimeQueryConfig,
    ...options,
  });
};

// Diagnostics hooks
export const useSystemDiagnostics = (options?: UseQueryOptions<SystemDiagnostics>) => {
  return useQuery({
    queryKey: queryKeys.diagnostics.system,
    queryFn: () => api.diagnostics.getSystem(),
    ...defaultQueryConfig,
    ...options,
  });
};

export const usePerformanceDiagnostics = (timeRangeMinutes: number, options?: UseQueryOptions<any>) => {
  return useQuery({
    queryKey: queryKeys.diagnostics.performance(timeRangeMinutes),
    queryFn: () => api.diagnostics.getPerformance(timeRangeMinutes),
    ...defaultQueryConfig,
    ...options,
  });
};

export const useSystemMetrics = (options?: UseQueryOptions<SystemMetrics>) => {
  return useQuery({
    queryKey: queryKeys.diagnostics.metrics,
    queryFn: () => api.diagnostics.getMetrics(),
    ...frequentQueryConfig,
    ...options,
  });
};

export const useTroubleshootingRecommendations = (options?: UseQueryOptions<any[]>) => {
  return useQuery({
    queryKey: queryKeys.diagnostics.recommendations,
    queryFn: () => api.diagnostics.getRecommendations(),
    ...defaultQueryConfig,
    ...options,
  });
};

// Memory hooks
export const useContextQuery = (params: ContextQueryRequest, options?: UseQueryOptions<StandardResponse<any>>) => {
  return useQuery({
    queryKey: queryKeys.memory.context(params),
    queryFn: () => api.memory.getContext(params),
    enabled: !!params.query,
    ...defaultQueryConfig,
    ...options,
  });
};

export const useMemorySearch = (params: SearchQueryRequest, options?: UseQueryOptions<StandardResponse<any>>) => {
  return useQuery({
    queryKey: queryKeys.memory.search(params),
    queryFn: () => api.memory.search(params),
    enabled: !!params.query,
    ...defaultQueryConfig,
    ...options,
  });
};

// Lifecycle hooks
export const useLifecycleStatus = (projectId: string, options?: UseQueryOptions<StandardResponse<any>>) => {
  return useQuery({
    queryKey: queryKeys.lifecycle.status(projectId),
    queryFn: () => api.lifecycle.getStatus(projectId),
    enabled: !!projectId,
    ...realtimeQueryConfig,
    ...options,
  });
};

// Mutation hooks
export const useIngestDocuments = (options?: UseMutationOptions<StandardResponse<any>, Error, IngestDocumentsRequest>) => {
  return useMutation({
    mutationFn: (request: IngestDocumentsRequest) => api.memory.ingest(request),
    ...options,
  });
};

export const useStartEngine = (options?: UseMutationOptions<StandardResponse<any>, Error, StartEngineRequest>) => {
  return useMutation({
    mutationFn: (request: StartEngineRequest) => api.lifecycle.start(request),
    ...options,
  });
};

export const useStopEngine = (options?: UseMutationOptions<StandardResponse<any>, Error, StopEngineRequest>) => {
  return useMutation({
    mutationFn: (request: StopEngineRequest) => api.lifecycle.stop(request),
    ...options,
  });
};
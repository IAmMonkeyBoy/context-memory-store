import { useState, useEffect, useCallback, useRef } from 'react';
import { sseService } from '@services';
import { AnalysisChunk } from '@types';
import { useDetailedHealth, useSystemMetrics } from './useApi';
import { parsePrometheusMetrics, convertToMetricsData, generateMockPrometheusMetrics } from '@utils';
import { config } from '../utils/config';

export type SSEConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error' | 'max_attempts_reached';

export interface SSEConnectionInfo {
  status: SSEConnectionStatus;
  isConnected: boolean;
  lastConnected: Date | null;
  reconnectAttempts: number;
  error: string | null;
}

// Enhanced generic SSE hook with better connection management
export const useServerSentEvents = (endpoint: string, enabled: boolean = true) => {
  const [data, setData] = useState<any[]>([]);
  const [connectionInfo, setConnectionInfo] = useState<SSEConnectionInfo>({
    status: 'disconnected',
    isConnected: false,
    lastConnected: null,
    reconnectAttempts: 0,
    error: null
  });
  
  const reconnectAttemptsRef = useRef(0);
  const lastConnectedRef = useRef<Date | null>(null);

  useEffect(() => {
    if (!enabled) {
      setConnectionInfo({
        status: 'disconnected',
        isConnected: false,
        lastConnected: lastConnectedRef.current,
        reconnectAttempts: reconnectAttemptsRef.current,
        error: null
      });
      return;
    }

    setConnectionInfo(prev => ({
      ...prev,
      status: 'connecting',
      error: null
    }));

    const handleMessage = (eventData: any) => {
      setData(prev => [...prev, eventData]);
      
      if (connectionInfo.status !== 'connected') {
        lastConnectedRef.current = new Date();
        reconnectAttemptsRef.current = 0;
        
        setConnectionInfo({
          status: 'connected',
          isConnected: true,
          lastConnected: lastConnectedRef.current,
          reconnectAttempts: 0,
          error: null
        });
      }
    };

    const handleError = (error: Event) => {
      reconnectAttemptsRef.current += 1;
      
      const isMaxAttempts = error.type === 'max_reconnect_attempts_reached';
      const newStatus: SSEConnectionStatus = isMaxAttempts ? 'max_attempts_reached' : 'reconnecting';
      
      setConnectionInfo({
        status: newStatus,
        isConnected: false,
        lastConnected: lastConnectedRef.current,
        reconnectAttempts: reconnectAttemptsRef.current,
        error: isMaxAttempts ? 'Maximum reconnection attempts reached' : 'Connection failed, attempting to reconnect...'
      });
    };

    sseService.connect(endpoint, handleMessage, handleError);

    return () => {
      sseService.disconnect();
      setConnectionInfo(prev => ({
        ...prev,
        status: 'disconnected',
        isConnected: false
      }));
    };
  }, [endpoint, enabled]);

  const clearData = useCallback(() => {
    setData([]);
  }, []);

  const reconnect = useCallback(() => {
    if (enabled) {
      reconnectAttemptsRef.current = 0;
      setConnectionInfo(prev => ({
        ...prev,
        status: 'connecting',
        reconnectAttempts: 0,
        error: null
      }));
    }
  }, [enabled]);

  return { 
    data, 
    connectionInfo,
    clearData,
    reconnect,
    // Legacy compatibility
    connectionStatus: connectionInfo.status === 'connected' ? 'connected' : connectionInfo.status === 'connecting' ? 'connecting' : 'error',
    error: connectionInfo.error
  };
};

// Streaming analysis hook
export const useStreamingAnalysis = (query: string, options: { limit: number; includeRelationships: boolean }) => {
  const [chunks, setChunks] = useState<AnalysisChunk[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startAnalysis = useCallback(async () => {
    if (!query.trim()) {
      setError('Query is required');
      return;
    }

    setIsStreaming(true);
    setChunks([]);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: query,
        limit: options.limit.toString(),
        includeRelationships: options.includeRelationships.toString()
      });
      
      const url = `${config.apiBaseUrl}/memory/analyze-stream?${params.toString()}`;

      const handleMessage = (eventData: any) => {
        const chunk: AnalysisChunk = {
          type: eventData.type || 'analysis',
          content: eventData.content || eventData.data || JSON.stringify(eventData),
          timestamp: new Date().toISOString()
        };

        setChunks(prev => [...prev, chunk]);

        if (chunk.type === 'done' || chunk.type === 'error') {
          setIsStreaming(false);
          sseService.disconnect();
        }
      };

      const handleError = (error: Event) => {
        setError('Connection to analysis stream failed');
        setIsStreaming(false);
        console.error('[SSE] Analysis stream error:', error);
      };

      sseService.connect(url, handleMessage, handleError);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setIsStreaming(false);
    }
  }, [query, options]);

  const stopAnalysis = useCallback(() => {
    sseService.disconnect();
    setIsStreaming(false);
  }, []);

  const clearAnalysis = useCallback(() => {
    setChunks([]);
    setError(null);
  }, []);

  return { 
    chunks, 
    isStreaming, 
    error, 
    startAnalysis, 
    stopAnalysis, 
    clearAnalysis 
  };
};

// Real-time health monitoring hook with polling fallback
export const useRealtimeHealth = (interval: number = 30000, useSSE: boolean = true) => {
  const [healthData, setHealthData] = useState<any>(null);
  const [healthHistory, setHealthHistory] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [pollingEnabled, setPollingEnabled] = useState(!useSSE);
  
  // SSE connection for real-time updates
  const { data: sseData, connectionInfo, reconnect } = useServerSentEvents(
    `${config.apiBaseUrl}/health/stream`, 
    useSSE && !pollingEnabled
  );

  // Polling fallback using existing API hook
  const { data: polledData, refetch } = useDetailedHealth();

  // Handle SSE data
  useEffect(() => {
    if (sseData.length > 0) {
      const latestHealth = sseData[sseData.length - 1];
      setHealthData(latestHealth);
      setHealthHistory(prev => [...prev.slice(-19), { ...latestHealth, timestamp: new Date() }]);
      setLastUpdate(new Date());
    }
  }, [sseData]);

  // Handle SSE connection failures - fallback to polling
  useEffect(() => {
    if (connectionInfo.status === 'max_attempts_reached' || connectionInfo.status === 'error') {
      setPollingEnabled(true);
    } else if (connectionInfo.status === 'connected') {
      setPollingEnabled(false);
    }
  }, [connectionInfo.status]);

  // Polling mechanism
  useEffect(() => {
    if (!pollingEnabled) return;

    const poll = async () => {
      try {
        const data = await refetch();
        if (data.data) {
          setHealthData(data.data);
          setHealthHistory(prev => [...prev.slice(-19), { ...data.data, timestamp: new Date() }]);
          setLastUpdate(new Date());
        }
      } catch (error) {
        console.error('[Health] Polling failed:', error);
      }
    };

    // Initial poll
    poll();

    // Set up interval
    const intervalId = setInterval(poll, interval);

    return () => clearInterval(intervalId);
  }, [pollingEnabled, interval, refetch]);

  const retrySSE = useCallback(() => {
    setPollingEnabled(false);
    reconnect();
  }, [reconnect]);

  return {
    healthData,
    healthHistory,
    lastUpdate,
    connectionInfo,
    isPolling: pollingEnabled,
    retrySSE,
    isConnected: connectionInfo.isConnected || pollingEnabled
  };
};

// Real-time metrics monitoring hook with Prometheus support
export const useRealtimeMetrics = (interval: number = 10000) => {
  const [metricsData, setMetricsData] = useState<any>(null);
  const [metricsHistory, setMetricsHistory] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [usePrometheus, setUsePrometheus] = useState(true);

  // Use polling for metrics (Prometheus endpoint doesn't typically support SSE)
  const { data: polledData, refetch } = useSystemMetrics();

  // Fetch Prometheus metrics directly
  const fetchPrometheusMetrics = useCallback(async () => {
    try {
      // Try /v1/metrics first (the correct endpoint)
      const metricsUrl = `${config.apiBaseUrl}/metrics`;
      console.debug(`[Metrics] Fetching Prometheus metrics from: ${metricsUrl}`);
      
      const response = await fetch(metricsUrl);
      if (!response.ok) {
        console.warn(`[Metrics] Failed to fetch from ${metricsUrl}, status: ${response.status}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const metricsText = await response.text();
      console.debug(`[Metrics] Received ${metricsText.length} characters of Prometheus metrics data`);
      
      if (metricsText.length === 0) {
        console.warn('[Metrics] Received empty Prometheus metrics response');
        return null;
      }
      
      const parsedMetrics = parsePrometheusMetrics(metricsText);
      console.debug('[Metrics] Parsed Prometheus metrics:', Object.keys(parsedMetrics));
      
      const convertedData = convertToMetricsData(parsedMetrics);
      
      if (convertedData) {
        console.debug('[Metrics] Successfully converted Prometheus metrics:', {
          api: convertedData.api,
          memory: convertedData.memory,
          performance: convertedData.performance,
          timestamp: convertedData.timestamp
        });
      } else {
        console.warn('[Metrics] Converted data is null or undefined');
      }
      
      return convertedData;
    } catch (error) {
      console.error('[Metrics] Failed to fetch Prometheus metrics:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const poll = async () => {
      try {
        console.debug(`[Metrics] Starting poll cycle, usePrometheus: ${usePrometheus}`);
        let newMetricsData = null;

        if (usePrometheus) {
          // Try Prometheus first
          newMetricsData = await fetchPrometheusMetrics();
          
          if (!newMetricsData) {
            console.warn('[Metrics] Prometheus fetch failed, falling back to regular API');
            setUsePrometheus(false);
          } else {
            console.debug('[Metrics] Successfully fetched Prometheus metrics');
          }
        }

        if (!newMetricsData) {
          // Try /v1/diagnostics/metrics endpoint as backup
          console.debug('[Metrics] Trying /v1/diagnostics/metrics as backup');
          try {
            const diagnosticsUrl = `${config.apiBaseUrl}/diagnostics/metrics`;
            console.debug(`[Metrics] Fetching diagnostics metrics from: ${diagnosticsUrl}`);
            
            const diagnosticsResponse = await fetch(diagnosticsUrl);
            if (diagnosticsResponse.ok) {
              const diagnosticsData = await diagnosticsResponse.json();
              console.debug('[Metrics] Diagnostics metrics data:', diagnosticsData);
              
              // Convert diagnostics format to metrics format
              if (diagnosticsData) {
                newMetricsData = {
                  timestamp: new Date(diagnosticsData.timestamp || new Date()),
                  api: {
                    totalRequests: diagnosticsData.requests?.totalRequests || 0,
                    successfulRequests: diagnosticsData.requests?.successfulRequests || 0,
                    failedRequests: diagnosticsData.requests?.failedRequests || 0,
                    averageResponseTime: diagnosticsData.requests?.averageResponseTime || 0,
                  },
                  memory: {
                    totalDocuments: diagnosticsData.business?.documentsIngested || 0,
                    totalChunks: diagnosticsData.database?.recordsProcessed || 0,
                    vectorStoreSize: Math.round(diagnosticsData.memoryUsageBytes * 0.7) || 0,
                    graphStoreSize: Math.round(diagnosticsData.memoryUsageBytes * 0.3) || 0,
                  },
                  performance: {
                    cpuUsage: Math.max(0, diagnosticsData.cpuUsagePercent || 0),
                    memoryUsage: Math.min(100, (diagnosticsData.memoryUsageBytes / (1024 * 1024 * 512)) * 100), // Estimate as % of 512MB
                    diskUsage: Math.min(50, Math.max(10, (diagnosticsData.memoryUsageBytes / (1024 * 1024 * 1024)) * 5)), // Rough estimate
                  }
                };
                console.debug('[Metrics] Converted diagnostics data to metrics format:', newMetricsData);
              }
            } else {
              console.warn(`[Metrics] Diagnostics endpoint failed: ${diagnosticsResponse.status}`);
            }
          } catch (diagnosticsError) {
            console.warn('[Metrics] Failed to fetch diagnostics metrics:', diagnosticsError);
          }
        }

        if (!newMetricsData) {
          // Use regular API as final fallback
          console.debug('[Metrics] Using regular API as final fallback');
          const data = await refetch();
          if (data.data) {
            newMetricsData = { ...data.data, timestamp: new Date() };
            console.debug('[Metrics] Regular API data:', newMetricsData);
          } else {
            console.warn('[Metrics] No data from regular API');
          }
        }

        if (newMetricsData) {
          const timestampedData = { ...newMetricsData, timestamp: new Date() };
          setMetricsData(timestampedData);
          setMetricsHistory(prev => {
            const newHistory = [...prev.slice(-29), timestampedData]; // Keep 30 data points
            console.debug(`[Metrics] Updated metrics history, now has ${newHistory.length} data points`);
            return newHistory;
          });
          setLastUpdate(new Date());
        } else {
          console.warn('[Metrics] No metrics data available from any source');
        }
      } catch (error) {
        console.error('[Metrics] Polling failed:', error);
        // Try fallback to regular API
        if (usePrometheus) {
          console.warn('[Metrics] Disabling Prometheus due to error');
          setUsePrometheus(false);
        }
      }
    };

    // Initial poll
    console.debug(`[Metrics] Setting up polling with interval: ${interval}ms`);
    poll();

    // Set up interval
    const intervalId = setInterval(poll, interval);

    return () => {
      console.debug('[Metrics] Cleaning up polling interval');
      clearInterval(intervalId);
    };
  }, [interval, refetch, usePrometheus, fetchPrometheusMetrics]);

  const retryPrometheus = useCallback(() => {
    setUsePrometheus(true);
  }, []);

  return {
    metricsData,
    metricsHistory,
    lastUpdate,
    isConnected: true, // Always true for polling
    usingPrometheus: usePrometheus,
    retryPrometheus
  };
};

// Dashboard real-time updates hook (enhanced)
export const useDashboardStream = (enabled: boolean = true) => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { data, connectionInfo } = useServerSentEvents(`${config.apiBaseUrl}/dashboard/stream`, enabled);

  useEffect(() => {
    if (data.length > 0) {
      const latestData = data[data.length - 1];
      setDashboardData(latestData);
      setLastUpdate(new Date());
    }
  }, [data]);

  return {
    data: dashboardData,
    connectionInfo,
    lastUpdate,
    isConnected: connectionInfo.isConnected
  };
};
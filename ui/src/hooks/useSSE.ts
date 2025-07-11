import { useState, useEffect, useCallback } from 'react';
import { sseService } from '@services';
import { AnalysisChunk } from '@types';

// Generic SSE hook
export const useServerSentEvents = (endpoint: string, enabled: boolean = true) => {
  const [data, setData] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setConnectionStatus('connecting');
      return;
    }

    const handleMessage = (eventData: any) => {
      setData(prev => [...prev, eventData]);
      if (connectionStatus !== 'connected') {
        setConnectionStatus('connected');
      }
    };

    const handleError = (error: Event) => {
      setConnectionStatus('error');
      setError('Connection to server failed');
      console.error('[SSE] Connection error:', error);
    };

    sseService.connect(endpoint, handleMessage, handleError);

    return () => {
      sseService.disconnect();
      setConnectionStatus('connecting');
    };
  }, [endpoint, enabled, connectionStatus]);

  const clearData = useCallback(() => {
    setData([]);
  }, []);

  return { data, connectionStatus, error, clearData };
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
      
      const url = `/v1/memory/analyze-stream?${params.toString()}`;

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

// Dashboard real-time updates hook
export const useDashboardStream = (enabled: boolean = true) => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { data, connectionStatus, error } = useServerSentEvents('/v1/dashboard/stream', enabled);

  useEffect(() => {
    if (data.length > 0) {
      const latestData = data[data.length - 1];
      setDashboardData(latestData);
      setLastUpdate(new Date());
    }
  }, [data]);

  return {
    data: dashboardData,
    connectionStatus,
    error,
    lastUpdate,
    isConnected: connectionStatus === 'connected'
  };
};
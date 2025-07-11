export { api, ContextMemoryStoreClient } from './api';

// Server-Sent Events service
export class SSEService {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  connect(url: string, onMessage: (data: any) => void, onError?: (error: Event) => void): void {
    this.disconnect(); // Ensure clean state
    
    try {
      this.eventSource = new EventSource(url);
      
      this.eventSource.onopen = () => {
        console.log('[SSE] Connected to', url);
        this.reconnectAttempts = 0; // Reset on successful connection
      };
      
      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('[SSE] Failed to parse message:', error);
          onMessage({ type: 'error', content: 'Failed to parse server message' });
        }
      };
      
      this.eventSource.onerror = (error) => {
        console.error('[SSE] Connection error:', error);
        
        if (onError) {
          onError(error);
        }
        
        // Attempt to reconnect with exponential backoff
        this.handleReconnect(url, onMessage, onError);
      };
      
    } catch (error) {
      console.error('[SSE] Failed to create EventSource:', error);
      if (onError) {
        onError(error as Event);
      }
    }
  }

  private handleReconnect(url: string, onMessage: (data: any) => void, onError?: (error: Event) => void): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
      
      console.log(`[SSE] Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(url, onMessage, onError);
      }, delay);
    } else {
      console.error('[SSE] Max reconnection attempts reached');
      if (onError) {
        onError(new Event('max_reconnect_attempts_reached'));
      }
    }
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log('[SSE] Disconnected');
    }
  }

  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}

// Export singleton instance
export const sseService = new SSEService();
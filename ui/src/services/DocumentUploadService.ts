import { UploadFile } from '../components/Documents/DocumentUpload';
import { config } from '../utils/config';

export interface UploadProgress {
  fileId: string;
  progress: number;
  status: 'uploading' | 'success' | 'error' | 'cancelled';
  error?: string;
}

export interface BatchUploadOptions {
  concurrentUploads?: number;
  retryAttempts?: number;
  chunkSize?: number;
  onProgress?: (progress: UploadProgress) => void;
  onComplete?: (fileId: string, success: boolean, error?: string) => void;
  signal?: AbortSignal;
}

export interface DocumentMetadata {
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  checksum?: string;
  tags?: string[];
  category?: string;
}

export interface UploadResponse {
  success: boolean;
  documentId?: string;
  metadata?: DocumentMetadata;
  error?: string;
}

export class DocumentUploadService {
  private activeUploads = new Map<string, AbortController>();
  private uploadQueue: UploadFile[] = [];
  private isProcessing = false;

  async uploadFile(
    uploadFile: UploadFile,
    options: BatchUploadOptions = {}
  ): Promise<UploadResponse> {
    const {
      retryAttempts = 3,
      chunkSize = 1024 * 1024, // 1MB chunks
      onProgress,
      signal,
    } = options;

    const controller = new AbortController();
    this.activeUploads.set(uploadFile.id, controller);

    // Combine external signal with internal controller
    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    try {
      // Validate file
      const validationError = this.validateFile(uploadFile.file);
      if (validationError) {
        throw new Error(validationError);
      }

      // Calculate checksum for integrity verification
      const checksum = await this.calculateChecksum(uploadFile.file);

      let attempt = 0;
      let lastError: Error | null = null;

      while (attempt < retryAttempts) {
        try {
          const response = await this.performUpload(
            uploadFile,
            {
              signal: controller.signal,
              onProgress,
              chunkSize,
              checksum,
            }
          );

          if (response.ok) {
            const result: UploadResponse = await response.json();
            onProgress?.({
              fileId: uploadFile.id,
              progress: 100,
              status: 'success',
            });
            return result;
          } else {
            const errorData = await response.json();
            throw new Error(errorData.message || `Upload failed with status ${response.status}`);
          }
        } catch (error) {
          lastError = error as Error;
          attempt++;

          if (attempt < retryAttempts && !controller.signal.aborted) {
            // Exponential backoff
            await this.delay(Math.pow(2, attempt) * 1000);
            onProgress?.({
              fileId: uploadFile.id,
              progress: 0,
              status: 'uploading',
              error: `Retry ${attempt}/${retryAttempts}: ${lastError.message}`,
            });
          }
        }
      }

      throw lastError || new Error('Upload failed after all retry attempts');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (controller.signal.aborted) {
        onProgress?.({
          fileId: uploadFile.id,
          progress: 0,
          status: 'cancelled',
        });
        return { success: false, error: 'Upload cancelled' };
      }

      onProgress?.({
        fileId: uploadFile.id,
        progress: 0,
        status: 'error',
        error: errorMessage,
      });

      return { success: false, error: errorMessage };
    } finally {
      this.activeUploads.delete(uploadFile.id);
    }
  }

  async batchUpload(
    files: UploadFile[],
    options: BatchUploadOptions = {}
  ): Promise<Map<string, UploadResponse>> {
    const { concurrentUploads = 3 } = options;
    const results = new Map<string, UploadResponse>();
    
    // Add files to queue
    this.uploadQueue.push(...files);
    
    // If already processing, wait for current batch to complete then process new files
    if (this.isProcessing) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.isProcessing) {
            clearInterval(checkInterval);
            // Process the newly queued files
            this.batchUpload([], options).then(resolve);
          }
        }, 100);
      });
    }

    this.isProcessing = true;

    try {
      // Process uploads in batches
      while (this.uploadQueue.length > 0) {
        const batch = this.uploadQueue.splice(0, concurrentUploads);
        const uploadPromises = batch.map(async (uploadFile) => {
          const result = await this.uploadFile(uploadFile, options);
          results.set(uploadFile.id, result);
          options.onComplete?.(uploadFile.id, result.success, result.error);
          return result;
        });

        await Promise.allSettled(uploadPromises);
      }
    } finally {
      this.isProcessing = false;
    }

    return results;
  }

  cancelUpload(fileId: string): void {
    const controller = this.activeUploads.get(fileId);
    if (controller) {
      controller.abort();
    }

    // Remove from queue if not started
    this.uploadQueue = this.uploadQueue.filter(f => f.id !== fileId);
  }

  cancelAllUploads(): void {
    // Cancel active uploads
    this.activeUploads.forEach(controller => controller.abort());
    this.activeUploads.clear();

    // Clear queue
    this.uploadQueue = [];
    this.isProcessing = false;
  }

  private async performUpload(
    uploadFile: UploadFile,
    options: {
      signal: AbortSignal;
      onProgress?: (progress: UploadProgress) => void;
      chunkSize: number;
      checksum: string;
    }
  ): Promise<Response> {
    const { signal, onProgress, checksum } = options;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress?.({
            fileId: uploadFile.id,
            progress,
            status: 'uploading',
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            ok: true,
            status: xhr.status,
            json: async () => JSON.parse(xhr.responseText),
          } as Response);
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      signal.addEventListener('abort', () => {
        xhr.abort();
      });

      // Use the actual API endpoint when backend is ready
      xhr.open('POST', `${config.apiBaseUrl}/memory/ingest`);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Accept', 'application/json');
      
      // Convert file upload to memory ingest format
      // Note: This is a simplified implementation - in production you'd want to read file content properly
      const mockRequestBody = JSON.stringify({
        documents: [{
          id: uploadFile.id,
          content: `File upload: ${uploadFile.file.name}`, // Placeholder - would read actual file content
          metadata: {
            title: uploadFile.file.name,
            type: uploadFile.file.type || 'text/plain',
            size: uploadFile.file.size,
            checksum: checksum
          },
          source: {
            type: 'file_upload',
            path: uploadFile.file.name,
            originalName: uploadFile.file.name
          }
        }],
        options: {
          autoSummarize: true,
          extractRelationships: true,
          chunkSize: options.chunkSize
        }
      });
      
      xhr.send(mockRequestBody);
    });
  }

  private validateFile(file: File): string | null {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/json',
      'application/x-yaml',
      'text/yaml',
    ];

    if (file.size > maxSize) {
      return `File size exceeds maximum limit of ${maxSize / 1024 / 1024}MB`;
    }

    if (!allowedTypes.includes(file.type) && 
        !file.name.match(/\.(txt|md|pdf|doc|docx|json|yaml|yml)$/i)) {
      return 'File type not supported';
    }

    return null;
  }

  private async calculateChecksum(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getUploadStatus(): {
    activeUploads: number;
    queuedUploads: number;
    isProcessing: boolean;
  } {
    return {
      activeUploads: this.activeUploads.size,
      queuedUploads: this.uploadQueue.length,
      isProcessing: this.isProcessing,
    };
  }
}

export const documentUploadService = new DocumentUploadService();
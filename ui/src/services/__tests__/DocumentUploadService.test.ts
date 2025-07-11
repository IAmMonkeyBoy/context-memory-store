import { documentUploadService, DocumentUploadService } from '../DocumentUploadService';
import { UploadFile } from '../../components/Documents/DocumentUpload';

// Mock crypto.subtle for checksum calculation
const mockDigest = jest.fn();
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: mockDigest,
    },
  },
});

// Mock XMLHttpRequest
const mockXMLHttpRequest = {
  open: jest.fn(),
  send: jest.fn(),
  setRequestHeader: jest.fn(),
  addEventListener: jest.fn(),
  abort: jest.fn(),
  upload: {
    addEventListener: jest.fn(),
  },
  status: 200,
  responseText: '{"success": true, "documentId": "test-id"}',
};

(global as any).XMLHttpRequest = jest.fn(() => mockXMLHttpRequest);

describe('DocumentUploadService', () => {
  let service: DocumentUploadService;
  let mockFile: File;
  let mockUploadFile: UploadFile;

  beforeEach(() => {
    service = new DocumentUploadService();
    
    // Create a proper File mock with arrayBuffer method
    mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    Object.defineProperty(mockFile, 'arrayBuffer', {
      value: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
    });
    
    mockUploadFile = {
      id: 'test-id',
      file: mockFile,
      status: 'pending',
      progress: 0,
    };

    // Reset mocks
    jest.clearAllMocks();
    mockDigest.mockResolvedValue(new ArrayBuffer(32));
  });

  describe('uploadFile', () => {
    it('should successfully upload a file', async () => {
      const onProgress = jest.fn();
      
      // Mock successful upload
      mockXMLHttpRequest.addEventListener.mockImplementation((event, callback) => {
        if (event === 'load') {
          setTimeout(() => callback(), 0);
        }
      });

      const result = await service.uploadFile(mockUploadFile, { onProgress });

      expect(result.success).toBe(true);
      expect(onProgress).toHaveBeenCalledWith({
        fileId: 'test-id',
        progress: 100,
        status: 'success',
      });
    });

    it('should handle upload errors with retry', async () => {
      const onProgress = jest.fn();
      
      // Mock failed upload
      mockXMLHttpRequest.addEventListener.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback(), 0);
        }
      });

      const result = await service.uploadFile(mockUploadFile, { 
        onProgress,
        retryAttempts: 1 
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should validate file size', async () => {
      const largeFile = new File(['x'.repeat(60 * 1024 * 1024)], 'large.txt');
      const largeUploadFile = { ...mockUploadFile, file: largeFile };

      const result = await service.uploadFile(largeUploadFile);

      expect(result.success).toBe(false);
      expect(result.error).toContain('File size exceeds maximum limit');
    });

    it('should validate file type', async () => {
      const invalidFile = new File(['test'], 'test.exe', { type: 'application/exe' });
      const invalidUploadFile = { ...mockUploadFile, file: invalidFile };

      const result = await service.uploadFile(invalidUploadFile);

      expect(result.success).toBe(false);
      expect(result.error).toBe('File type not supported');
    });

    it('should handle cancellation', async () => {
      const controller = new AbortController();
      const onProgress = jest.fn();

      // Mock aborted upload
      mockXMLHttpRequest.addEventListener.mockImplementation((event, callback) => {
        if (event === 'abort') {
          setTimeout(() => callback(), 0);
        }
      });

      // Cancel immediately
      setTimeout(() => controller.abort(), 0);

      const result = await service.uploadFile(mockUploadFile, { 
        onProgress,
        signal: controller.signal 
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Upload cancelled');
    });

    it('should calculate file checksum', async () => {
      const mockArrayBuffer = new ArrayBuffer(32);
      const mockUint8Array = new Uint8Array(mockArrayBuffer);
      mockUint8Array.fill(255); // Fill with 0xFF for predictable hash

      mockDigest.mockResolvedValue(mockArrayBuffer);
      
      // Mock successful upload to complete the flow
      mockXMLHttpRequest.addEventListener.mockImplementation((event, callback) => {
        if (event === 'load') {
          setTimeout(() => callback(), 0);
        }
      });

      await service.uploadFile(mockUploadFile);

      expect(mockDigest).toHaveBeenCalledWith('SHA-256', expect.any(ArrayBuffer));
    });
  });

  describe('batchUpload', () => {
    it('should process multiple files with concurrency limit', async () => {
      const files = [
        { ...mockUploadFile, id: 'file1' },
        { ...mockUploadFile, id: 'file2' },
        { ...mockUploadFile, id: 'file3' },
      ];

      const onComplete = jest.fn();

      // Mock successful uploads
      mockXMLHttpRequest.addEventListener.mockImplementation((event, callback) => {
        if (event === 'load') {
          setTimeout(() => callback(), 10);
        }
      });

      const results = await service.batchUpload(files, {
        concurrentUploads: 2,
        onComplete,
      });

      expect(results.size).toBe(3);
      expect(onComplete).toHaveBeenCalledTimes(3);
    });

    it('should handle mixed success and failure in batch', async () => {
      const files = [
        { ...mockUploadFile, id: 'success-file' },
        { ...mockUploadFile, id: 'error-file' },
      ];

      let callCount = 0;
      mockXMLHttpRequest.addEventListener.mockImplementation((event, callback) => {
        callCount++;
        if (callCount === 1 && event === 'load') {
          // First file succeeds
          setTimeout(() => callback(), 0);
        } else if (callCount === 2 && event === 'error') {
          // Second file fails
          setTimeout(() => callback(), 0);
        }
      });

      const results = await service.batchUpload(files);

      expect(results.get('success-file')?.success).toBe(true);
      expect(results.get('error-file')?.success).toBe(false);
    });

    it('should queue files when already processing and process them after completion', async () => {
      const firstBatch = [{ ...mockUploadFile, id: 'batch1-file1' }];
      const secondBatch = [{ ...mockUploadFile, id: 'batch2-file1' }];

      // Mock successful uploads with delay
      mockXMLHttpRequest.addEventListener.mockImplementation((event, callback) => {
        if (event === 'load') {
          setTimeout(() => callback(), 50);
        }
      });

      // Start first batch
      const firstPromise = service.batchUpload(firstBatch);
      
      // Immediately start second batch (should queue)
      const secondPromise = service.batchUpload(secondBatch);

      const [firstResults, secondResults] = await Promise.all([firstPromise, secondPromise]);

      expect(firstResults.size).toBe(1);
      expect(secondResults.size).toBe(1);
      expect(firstResults.get('batch1-file1')?.success).toBe(true);
      expect(secondResults.get('batch2-file1')?.success).toBe(true);
    });
  });

  describe('cancelUpload', () => {
    it('should cancel active upload', () => {
      const fileId = 'test-file';
      
      // Simulate active upload
      service['activeUploads'].set(fileId, new AbortController());

      service.cancelUpload(fileId);

      expect(service['activeUploads'].has(fileId)).toBe(false);
    });

    it('should remove file from queue if not started', () => {
      service['uploadQueue'] = [mockUploadFile];

      service.cancelUpload(mockUploadFile.id);

      expect(service['uploadQueue']).toHaveLength(0);
    });
  });

  describe('cancelAllUploads', () => {
    it('should cancel all active uploads and clear queue', () => {
      // Add mock active uploads
      service['activeUploads'].set('file1', new AbortController());
      service['activeUploads'].set('file2', new AbortController());
      service['uploadQueue'] = [mockUploadFile];

      service.cancelAllUploads();

      expect(service['activeUploads'].size).toBe(0);
      expect(service['uploadQueue']).toHaveLength(0);
      expect(service['isProcessing']).toBe(false);
    });
  });

  describe('getUploadStatus', () => {
    it('should return current upload status', () => {
      service['activeUploads'].set('file1', new AbortController());
      service['uploadQueue'] = [mockUploadFile, mockUploadFile];
      service['isProcessing'] = true;

      const status = service.getUploadStatus();

      expect(status).toEqual({
        activeUploads: 1,
        queuedUploads: 2,
        isProcessing: true,
      });
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(documentUploadService).toBeInstanceOf(DocumentUploadService);
    });
  });
});
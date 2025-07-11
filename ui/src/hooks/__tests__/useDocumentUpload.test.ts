import { renderHook, act } from '@testing-library/react';
import { useDocumentUpload } from '../useDocumentUpload';
import { documentUploadService } from '../../services/DocumentUploadService';

// Mock the DocumentUploadService
jest.mock('../../services/DocumentUploadService', () => ({
  documentUploadService: {
    batchUpload: jest.fn(),
    cancelUpload: jest.fn(),
    cancelAllUploads: jest.fn(),
    getUploadStatus: jest.fn(),
  },
}));

const mockDocumentUploadService = documentUploadService as jest.Mocked<typeof documentUploadService>;

describe('useDocumentUpload', () => {
  let mockFile: File;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    // Default mock implementations
    mockDocumentUploadService.batchUpload.mockResolvedValue(new Map());
    mockDocumentUploadService.getUploadStatus.mockReturnValue({
      activeUploads: 0,
      queuedUploads: 0,
      isProcessing: false,
    });
  });

  describe('addFiles', () => {
    it('should add files to upload state', () => {
      const { result } = renderHook(() => useDocumentUpload());

      act(() => {
        result.current.addFiles([mockFile]);
      });

      expect(result.current.uploads).toHaveLength(1);
      expect(result.current.uploads[0].file).toBe(mockFile);
      expect(result.current.uploads[0].status).toBe('pending');
    });

    it('should auto-start uploads when autoStart is true', () => {
      renderHook(() => useDocumentUpload({ autoStart: true }));

      act(() => {
        // The addFiles will trigger autoStart
      });

      expect(mockDocumentUploadService.batchUpload).toHaveBeenCalled();
    });

    it('should not auto-start uploads when autoStart is false', () => {
      const { result } = renderHook(() => useDocumentUpload({ autoStart: false }));

      act(() => {
        result.current.addFiles([mockFile]);
      });

      expect(mockDocumentUploadService.batchUpload).not.toHaveBeenCalled();
    });

    it('should generate unique IDs for files', () => {
      const { result } = renderHook(() => useDocumentUpload());

      act(() => {
        result.current.addFiles([mockFile, mockFile]);
      });

      expect(result.current.uploads).toHaveLength(2);
      expect(result.current.uploads[0].id).not.toBe(result.current.uploads[1].id);
    });
  });

  describe('startUpload', () => {
    it('should start upload for pending files', async () => {
      const { result } = renderHook(() => useDocumentUpload({ autoStart: false }));

      act(() => {
        result.current.addFiles([mockFile]);
      });

      await act(async () => {
        await result.current.startUpload();
      });

      expect(mockDocumentUploadService.batchUpload).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            file: mockFile,
            status: 'pending',
          }),
        ]),
        expect.any(Object)
      );
    });

    it('should set isUploading state during upload', async () => {
      const { result } = renderHook(() => useDocumentUpload({ autoStart: false }));

      act(() => {
        result.current.addFiles([mockFile]);
      });

      // Mock a long-running upload
      mockDocumentUploadService.batchUpload.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(new Map()), 100))
      );

      act(() => {
        result.current.startUpload();
      });

      expect(result.current.isUploading).toBe(true);

      // Wait for upload to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(result.current.isUploading).toBe(false);
    });
  });

  describe('cancelUpload', () => {
    it('should cancel individual file upload', () => {
      const { result } = renderHook(() => useDocumentUpload());

      act(() => {
        result.current.addFiles([mockFile]);
      });

      const fileId = result.current.uploads[0].id;

      act(() => {
        result.current.cancelUpload(fileId);
      });

      expect(mockDocumentUploadService.cancelUpload).toHaveBeenCalledWith(fileId);
      expect(result.current.uploads[0].status).toBe('cancelled');
    });
  });

  describe('cancelAllUploads', () => {
    it('should cancel all uploads', () => {
      const { result } = renderHook(() => useDocumentUpload());

      act(() => {
        result.current.addFiles([mockFile, mockFile]);
      });

      act(() => {
        result.current.cancelAllUploads();
      });

      expect(mockDocumentUploadService.cancelAllUploads).toHaveBeenCalled();
      expect(result.current.uploads.every(f => f.status === 'cancelled')).toBe(true);
      expect(result.current.isUploading).toBe(false);
    });
  });

  describe('removeFile', () => {
    it('should remove file from uploads', () => {
      const { result } = renderHook(() => useDocumentUpload());

      act(() => {
        result.current.addFiles([mockFile]);
      });

      const fileId = result.current.uploads[0].id;

      act(() => {
        result.current.removeFile(fileId);
      });

      expect(result.current.uploads).toHaveLength(0);
      expect(mockDocumentUploadService.cancelUpload).toHaveBeenCalledWith(fileId);
    });
  });

  describe('retryUpload', () => {
    it('should retry failed upload', async () => {
      const { result } = renderHook(() => useDocumentUpload({ autoStart: false }));

      act(() => {
        result.current.addFiles([mockFile]);
      });

      const fileId = result.current.uploads[0].id;

      // Simulate failed upload
      act(() => {
        result.current['updateUploadFile'](fileId, { status: 'error', error: 'Upload failed' });
      });

      await act(async () => {
        result.current.retryUpload(fileId);
      });

      expect(result.current.uploads[0].status).toBe('pending');
      expect(result.current.uploads[0].error).toBeUndefined();
    });

    it('should auto-start retry when autoStart is true', async () => {
      const { result } = renderHook(() => useDocumentUpload({ autoStart: true }));

      act(() => {
        result.current.addFiles([mockFile]);
      });

      const fileId = result.current.uploads[0].id;

      // Clear the initial batchUpload call
      mockDocumentUploadService.batchUpload.mockClear();

      // Simulate failed upload
      act(() => {
        result.current['updateUploadFile'](fileId, { status: 'error' });
      });

      await act(async () => {
        result.current.retryUpload(fileId);
      });

      expect(mockDocumentUploadService.batchUpload).toHaveBeenCalled();
    });
  });

  describe('clearCompleted', () => {
    it('should remove completed and cancelled files', () => {
      const { result } = renderHook(() => useDocumentUpload());

      act(() => {
        result.current.addFiles([mockFile, mockFile, mockFile]);
      });

      // Set different statuses
      act(() => {
        result.current['updateUploadFile'](result.current.uploads[0].id, { status: 'success' });
        result.current['updateUploadFile'](result.current.uploads[1].id, { status: 'cancelled' });
        // uploads[2] remains pending
      });

      act(() => {
        result.current.clearCompleted();
      });

      expect(result.current.uploads).toHaveLength(1);
      expect(result.current.uploads[0].status).toBe('pending');
    });
  });

  describe('upload statistics', () => {
    it('should calculate upload statistics correctly', () => {
      const { result } = renderHook(() => useDocumentUpload());

      act(() => {
        result.current.addFiles([mockFile, mockFile, mockFile, mockFile]);
      });

      // Set different statuses
      act(() => {
        result.current['updateUploadFile'](result.current.uploads[0].id, { status: 'success' });
        result.current['updateUploadFile'](result.current.uploads[1].id, { status: 'error' });
        result.current['updateUploadFile'](result.current.uploads[2].id, { status: 'cancelled' });
        // uploads[3] remains pending
      });

      const stats = result.current.uploadStats;

      expect(stats.totalFiles).toBe(4);
      expect(stats.completedFiles).toBe(1);
      expect(stats.failedFiles).toBe(1);
      expect(stats.cancelledFiles).toBe(1);
    });

    it('should track hasUploads and hasPendingUploads correctly', () => {
      const { result } = renderHook(() => useDocumentUpload());

      expect(result.current.hasUploads).toBe(false);
      expect(result.current.hasPendingUploads).toBe(false);

      act(() => {
        result.current.addFiles([mockFile]);
      });

      expect(result.current.hasUploads).toBe(true);
      expect(result.current.hasPendingUploads).toBe(true);

      act(() => {
        result.current['updateUploadFile'](result.current.uploads[0].id, { status: 'success' });
      });

      expect(result.current.hasUploads).toBe(true);
      expect(result.current.hasPendingUploads).toBe(false);
    });
  });

  describe('progress handling', () => {
    it('should update file progress when onProgress is called', () => {
      const { result } = renderHook(() => useDocumentUpload());

      act(() => {
        result.current.addFiles([mockFile]);
      });

      const fileId = result.current.uploads[0].id;

      act(() => {
        result.current['handleProgress']({
          fileId,
          progress: 50,
          status: 'uploading',
        });
      });

      expect(result.current.uploads[0].progress).toBe(50);
      expect(result.current.uploads[0].status).toBe('uploading');
    });

    it('should call onUploadComplete callback', () => {
      const onUploadComplete = jest.fn();
      const { result } = renderHook(() => useDocumentUpload({ onUploadComplete }));

      act(() => {
        result.current.addFiles([mockFile]);
      });

      const fileId = result.current.uploads[0].id;

      act(() => {
        result.current['handleComplete'](fileId, true);
      });

      expect(onUploadComplete).toHaveBeenCalledWith(fileId, true, undefined);
      expect(result.current.uploads[0].status).toBe('success');
    });
  });

  describe('service status integration', () => {
    it('should return service status', () => {
      const mockStatus = {
        activeUploads: 2,
        queuedUploads: 1,
        isProcessing: true,
      };

      mockDocumentUploadService.getUploadStatus.mockReturnValue(mockStatus);

      const { result } = renderHook(() => useDocumentUpload());

      expect(result.current.serviceStatus).toEqual(mockStatus);
    });
  });
});
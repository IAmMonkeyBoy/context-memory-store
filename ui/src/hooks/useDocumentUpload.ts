import { useState, useCallback, useRef } from 'react';
import { 
  documentUploadService, 
  BatchUploadOptions, 
  UploadProgress, 
  UploadResponse 
} from '../services/DocumentUploadService';
import { UploadFile } from '../components/Documents/DocumentUpload';

export interface UseDocumentUploadOptions {
  concurrentUploads?: number;
  retryAttempts?: number;
  autoStart?: boolean;
  onUploadComplete?: (fileId: string, success: boolean, error?: string) => void;
}

export interface DocumentUploadState {
  uploads: Map<string, UploadFile>;
  isUploading: boolean;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  cancelledFiles: number;
}

export const useDocumentUpload = (options: UseDocumentUploadOptions = {}) => {
  const {
    concurrentUploads = 3,
    retryAttempts = 3,
    autoStart = true,
    onUploadComplete,
  } = options;

  const [uploads, setUploads] = useState<Map<string, UploadFile>>(new Map());
  const [isUploading, setIsUploading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const updateUploadFile = useCallback((fileId: string, updates: Partial<UploadFile>) => {
    setUploads(prev => {
      const newMap = new Map(prev);
      const existingFile = newMap.get(fileId);
      if (existingFile) {
        newMap.set(fileId, { ...existingFile, ...updates });
      }
      return newMap;
    });
  }, []);

  const handleProgress = useCallback((progress: UploadProgress) => {
    updateUploadFile(progress.fileId, {
      status: progress.status,
      progress: progress.progress,
      error: progress.error,
      uploadedAt: progress.status === 'success' ? new Date() : undefined,
    });
  }, [updateUploadFile]);

  const handleComplete = useCallback((fileId: string, success: boolean, error?: string) => {
    updateUploadFile(fileId, {
      status: success ? 'success' : 'error',
      error: error,
      uploadedAt: success ? new Date() : undefined,
    });

    onUploadComplete?.(fileId, success, error);
  }, [updateUploadFile, onUploadComplete]);

  const addFiles = useCallback((files: File[]) => {
    const newUploadFiles: UploadFile[] = files.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      status: 'pending',
      progress: 0,
    }));

    setUploads(prev => {
      const newMap = new Map(prev);
      newUploadFiles.forEach(uploadFile => {
        newMap.set(uploadFile.id, uploadFile);
      });
      return newMap;
    });

    if (autoStart) {
      startUpload(newUploadFiles);
    }

    return newUploadFiles;
  }, [autoStart]);

  const startUpload = useCallback(async (filesToUpload?: UploadFile[]) => {
    const uploadFiles = filesToUpload || Array.from(uploads.values()).filter(f => 
      f.status === 'pending' || f.status === 'error'
    );

    if (uploadFiles.length === 0) {
      return;
    }

    setIsUploading(true);
    abortControllerRef.current = new AbortController();

    try {
      const batchOptions: BatchUploadOptions = {
        concurrentUploads,
        retryAttempts,
        onProgress: handleProgress,
        onComplete: handleComplete,
        signal: abortControllerRef.current.signal,
      };

      await documentUploadService.batchUpload(uploadFiles, batchOptions);
    } catch (error) {
      console.error('Batch upload failed:', error);
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  }, [uploads, concurrentUploads, retryAttempts, handleProgress, handleComplete]);

  const cancelUpload = useCallback((fileId: string) => {
    documentUploadService.cancelUpload(fileId);
    updateUploadFile(fileId, { status: 'cancelled' });
  }, [updateUploadFile]);

  const cancelAllUploads = useCallback(() => {
    documentUploadService.cancelAllUploads();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setUploads(prev => {
      const newMap = new Map(prev);
      newMap.forEach((uploadFile, fileId) => {
        if (uploadFile.status === 'pending' || uploadFile.status === 'uploading') {
          newMap.set(fileId, { ...uploadFile, status: 'cancelled' });
        }
      });
      return newMap;
    });
    
    setIsUploading(false);
  }, []);

  const removeFile = useCallback((fileId: string) => {
    cancelUpload(fileId);
    setUploads(prev => {
      const newMap = new Map(prev);
      newMap.delete(fileId);
      return newMap;
    });
  }, [cancelUpload]);

  const retryUpload = useCallback((fileId: string) => {
    const uploadFile = uploads.get(fileId);
    if (uploadFile) {
      updateUploadFile(fileId, { 
        status: 'pending', 
        progress: 0, 
        error: undefined 
      });
      
      if (autoStart) {
        startUpload([{ ...uploadFile, status: 'pending', progress: 0 }]);
      }
    }
  }, [uploads, updateUploadFile, autoStart, startUpload]);

  const clearCompleted = useCallback(() => {
    setUploads(prev => {
      const newMap = new Map(prev);
      const toRemove: string[] = [];
      
      newMap.forEach((uploadFile, fileId) => {
        if (uploadFile.status === 'success' || uploadFile.status === 'cancelled') {
          toRemove.push(fileId);
        }
      });
      
      toRemove.forEach(fileId => newMap.delete(fileId));
      return newMap;
    });
  }, []);

  const getUploadStats = useCallback((): DocumentUploadState => {
    const uploadArray = Array.from(uploads.values());
    
    return {
      uploads,
      isUploading,
      totalFiles: uploadArray.length,
      completedFiles: uploadArray.filter(f => f.status === 'success').length,
      failedFiles: uploadArray.filter(f => f.status === 'error').length,
      cancelledFiles: uploadArray.filter(f => f.status === 'cancelled').length,
    };
  }, [uploads, isUploading]);

  const getServiceStatus = useCallback(() => {
    return documentUploadService.getUploadStatus();
  }, []);

  return {
    // State
    uploads: Array.from(uploads.values()),
    uploadStats: getUploadStats(),
    serviceStatus: getServiceStatus(),

    // Actions
    addFiles,
    startUpload,
    cancelUpload,
    cancelAllUploads,
    removeFile,
    retryUpload,
    clearCompleted,

    // Computed properties
    isUploading,
    hasUploads: uploads.size > 0,
    hasPendingUploads: Array.from(uploads.values()).some(f => 
      f.status === 'pending' || f.status === 'error'
    ),
  };
};
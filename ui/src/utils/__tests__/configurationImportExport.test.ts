/**
 * Configuration Import/Export Tests
 * Phase 7.4.5 - Comprehensive tests for import/export and security features
 */

import { vi } from 'vitest';
import {
  ConfigurationExporter,
  ConfigurationImporter,
  ConfigurationFormatHandler,
  generateExportFilename,
  validateConfigurationFormat,
  getSupportedFormats,
  getFormatMimeType
} from '../configurationImportExport';
import {
  ConfigurationEncryption,
  ConfigurationAccessControl,
  ConfigurationAuditLogger,
  ConfigurationSecurityValidator
} from '../configurationSecurity';
import {
  ConfigurationBackupManager,
  ConfigurationVersionManager
} from '../configurationBackup';
import {
  ConfigurationOptimizationEngine
} from '../configurationOptimization';
import {
  ConfigurationHealthMonitor
} from '../configurationHealthMonitoring';

import type { SystemConfiguration } from '../../types/configuration';
import type {
  ConfigurationExportOptions,
  ConfigurationImportOptions,
  EncryptionSettings,
  AccessControlSettings,
  BackupOptions
} from '../../types/configurationImportExport';

// Mock fetch for testing
global.fetch = vi.fn();

// Mock crypto API
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn(),
      encrypt: vi.fn(),
      decrypt: vi.fn(),
      importKey: vi.fn(),
      deriveKey: vi.fn(),
      deriveBits: vi.fn()
    },
    getRandomValues: vi.fn()
  },
  writable: true
});

// Sample configuration for testing
const mockConfiguration: SystemConfiguration = {
  version: '1.0.0',
  api: {
    baseUrl: 'http://localhost:3000',
    port: 3000,
    cors: {
      enabled: true,
      origins: ['http://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      maxAge: 86400
    },
    rateLimiting: {
      enabled: true,
      requestsPerMinute: 100,
      burstLimit: 10,
      windowMs: 60000,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      message: 'Too many requests'
    },
    authentication: {
      enabled: false,
      provider: 'jwt'
    },
    swagger: {
      enabled: true,
      path: '/swagger',
      title: 'Context Memory Store API',
      version: '1.0.0'
    },
    compression: {
      enabled: true,
      threshold: 1024,
      algorithms: ['gzip', 'deflate']
    },
    staticFiles: {
      enabled: true,
      path: '/static',
      maxAge: 86400
    }
  },
  services: {
    qdrant: {
      url: 'http://localhost:6333',
      collection: 'context_vectors',
      vectorSize: 768,
      distance: 'cosine',
      timeout: 30000,
      retryAttempts: 3
    },
    neo4j: {
      uri: 'bolt://localhost:7687',
      username: 'neo4j',
      password: 'contextmemory',
      database: 'neo4j',
      maxConnectionLifetime: 300000,
      maxConnectionPoolSize: 10
    },
    ollama: {
      baseUrl: 'http://localhost:11434',
      chatModel: 'llama3',
      embeddingModel: 'mxbai-embed-large',
      timeout: 60000,
      maxRetries: 3,
      streamingEnabled: true
    }
  },
  features: {
    realTimeUpdates: true,
    advancedAnalytics: true,
    experimentalFeatures: false,
    batchProcessing: {
      enabled: true,
      batchSize: 100,
      maxConcurrency: 5
    },
    caching: {
      enabled: true,
      ttl: 3600,
      maxSize: 10000
    },
    debugMode: false
  },
  security: {
    https: {
      enabled: false
    },
    headers: {
      contentSecurityPolicy: "default-src 'self'",
      strictTransportSecurity: 'max-age=31536000',
      xFrameOptions: 'DENY'
    },
    dataProtection: {
      hashSaltRounds: 12
    }
  },
  monitoring: {
    prometheus: {
      enabled: true,
      endpoint: '/metrics',
      scrapeInterval: 15000
    },
    logging: {
      level: 'info',
      format: 'json',
      outputs: ['console']
    }
  },
  performance: {
    memoryLimit: 1024,
    timeouts: {
      request: 30000,
      database: 60000,
      cache: 5000
    },
    concurrency: {
      maxConnections: 100,
      maxConcurrentRequests: 50
    }
  }
};

describe('Configuration Import/Export System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock crypto.subtle.digest
    vi.mocked(crypto.subtle.digest).mockResolvedValue(new ArrayBuffer(32));
  });

  describe('ConfigurationExporter', () => {
    it('should export configuration in JSON format', async () => {
      const options: ConfigurationExportOptions = {
        format: 'json',
        scope: 'full',
        includeComments: false,
        includeSensitive: true,
        maskSensitive: false,
        minifyOutput: false,
        validateExport: false
      };

      const result = await ConfigurationExporter.exportConfiguration(mockConfiguration, options);

      expect(result.success).toBe(true);
      expect(result.format).toBe('json');
      expect(typeof result.data).toBe('string');
      expect(result.metadata.format).toBe('json');
      expect(result.metadata.scope).toBe('full');
    });

    it('should mask sensitive fields when requested', async () => {
      const options: ConfigurationExportOptions = {
        format: 'json',
        scope: 'full',
        includeComments: false,
        includeSensitive: true,
        maskSensitive: true,
        minifyOutput: false,
        validateExport: false
      };

      const result = await ConfigurationExporter.exportConfiguration(mockConfiguration, options);
      const exportedData = JSON.parse(result.data as string);

      expect(result.success).toBe(true);
      // Password should be masked
      expect(exportedData.services.neo4j.password).toMatch(/^co\*+ry$/);
    });

    it('should exclude sensitive fields when not included', async () => {
      const options: ConfigurationExportOptions = {
        format: 'json',
        scope: 'full',
        includeComments: false,
        includeSensitive: false,
        maskSensitive: false,
        minifyOutput: false,
        validateExport: false
      };

      const result = await ConfigurationExporter.exportConfiguration(mockConfiguration, options);
      const exportedData = JSON.parse(result.data as string);

      expect(result.success).toBe(true);
      expect(exportedData.services.neo4j.password).toBeUndefined();
    });

    it('should export specific scope only', async () => {
      const options: ConfigurationExportOptions = {
        format: 'json',
        scope: 'services',
        includeComments: false,
        includeSensitive: true,
        maskSensitive: false,
        minifyOutput: false,
        validateExport: false
      };

      const result = await ConfigurationExporter.exportConfiguration(mockConfiguration, options);
      const exportedData = JSON.parse(result.data as string);

      expect(result.success).toBe(true);
      expect(exportedData.services).toBeDefined();
      expect(exportedData.api).toBeUndefined();
      expect(exportedData.features).toBeUndefined();
    });
  });

  describe('ConfigurationImporter', () => {
    it('should import JSON configuration', async () => {
      const importData = JSON.stringify({
        version: '1.1.0',
        services: {
          qdrant: {
            url: 'http://localhost:6333',
            timeout: 45000
          }
        }
      });

      const options: ConfigurationImportOptions = {
        format: 'json',
        mergeStrategy: 'merge',
        validateImport: false,
        backupBeforeImport: false,
        skipValidation: false,
        dryRun: false,
        conflictResolution: 'overwrite'
      };

      const result = await ConfigurationImporter.importConfiguration(
        importData,
        'json',
        mockConfiguration,
        options
      );

      expect(result.success).toBe(true);
      expect(result.imported).toBe(true);
      expect(result.changes.length).toBeGreaterThan(0);
    });

    it('should detect conflicts during import', async () => {
      const importData = JSON.stringify({
        services: {
          qdrant: {
            timeout: 15000 // Different from current 30000
          }
        }
      });

      const options: ConfigurationImportOptions = {
        format: 'json',
        mergeStrategy: 'merge',
        validateImport: false,
        backupBeforeImport: false,
        skipValidation: false,
        dryRun: false,
        conflictResolution: 'prompt'
      };

      const result = await ConfigurationImporter.importConfiguration(
        importData,
        'json',
        mockConfiguration,
        options
      );

      expect(result.success).toBe(true);
      expect(result.conflicts.length).toBeGreaterThan(0);
    });

    it('should perform dry run without applying changes', async () => {
      const importData = JSON.stringify({
        version: '2.0.0',
        features: {
          newFeature: true
        }
      });

      const options: ConfigurationImportOptions = {
        format: 'json',
        mergeStrategy: 'merge',
        validateImport: false,
        backupBeforeImport: false,
        skipValidation: false,
        dryRun: true,
        conflictResolution: 'overwrite'
      };

      const result = await ConfigurationImporter.importConfiguration(
        importData,
        'json',
        mockConfiguration,
        options
      );

      expect(result.success).toBe(true);
      expect(result.imported).toBe(false);
      expect(result.warnings).toContain('Dry run - no changes applied');
    });
  });

  describe('Utility Functions', () => {
    it('should generate correct export filename', () => {
      const filename = generateExportFilename('json', 'full', '2023-12-25T10:30:00.000Z');
      expect(filename).toBe('config-full-2023-12-25-10-30-00.json');
    });

    it('should validate configuration format', () => {
      const validJson = '{"version": "1.0.0"}';
      const invalidJson = '{"version": "1.0.0"';

      expect(validateConfigurationFormat(validJson, 'json')).toBe(true);
      expect(validateConfigurationFormat(invalidJson, 'json')).toBe(false);
    });

    it('should return supported formats', () => {
      const formats = getSupportedFormats();
      expect(formats).toContain('json');
      expect(formats).toContain('yaml');
      expect(formats).toContain('env');
    });

    it('should return correct MIME types', () => {
      expect(getFormatMimeType('json')).toBe('application/json');
      expect(getFormatMimeType('yaml')).toBe('application/x-yaml');
      expect(getFormatMimeType('xml')).toBe('application/xml');
    });
  });
});

describe('Configuration Security System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock crypto methods
    vi.mocked(crypto.subtle.importKey).mockResolvedValue({} as CryptoKey);
    vi.mocked(crypto.subtle.deriveKey).mockResolvedValue({} as CryptoKey);
    vi.mocked(crypto.subtle.encrypt).mockResolvedValue(new ArrayBuffer(32));
    vi.mocked(crypto.subtle.decrypt).mockResolvedValue(new ArrayBuffer(16));
    vi.mocked(crypto.getRandomValues).mockImplementation((array: any) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    });
  });

  describe('ConfigurationEncryption', () => {
    it('should encrypt configuration with enabled encryption', async () => {
      const encryptionSettings: EncryptionSettings = {
        enabled: true,
        algorithm: 'aes-256-gcm',
        keyDerivation: 'pbkdf2',
        keySize: 256,
        iterationCount: 100000,
        saltLength: 32,
        encryptSensitiveFields: true,
        encryptionFields: ['services.neo4j.password'],
        rotationPolicy: {
          enabled: false,
          intervalDays: 90,
          autoRotate: false
        }
      };

      const result = await ConfigurationEncryption.encryptConfiguration(
        mockConfiguration,
        'testpassword123',
        encryptionSettings
      );

      expect(result.encryptedConfig).toBeDefined();
      expect(result.encryptionMetadata.encryptedFields).toContain('services.neo4j.password');
      expect(result.encryptionMetadata.algorithm).toBe('aes-256-gcm');
    });

    it('should skip encryption when disabled', async () => {
      const encryptionSettings: EncryptionSettings = {
        enabled: false,
        algorithm: 'aes-256-gcm',
        keyDerivation: 'pbkdf2',
        keySize: 256,
        iterationCount: 100000,
        saltLength: 32,
        encryptSensitiveFields: true,
        encryptionFields: [],
        rotationPolicy: {
          enabled: false,
          intervalDays: 90,
          autoRotate: false
        }
      };

      const result = await ConfigurationEncryption.encryptConfiguration(
        mockConfiguration,
        'testpassword123',
        encryptionSettings
      );

      expect(result.encryptedConfig).toEqual(mockConfiguration);
      expect(result.encryptionMetadata.encryptedFields).toHaveLength(0);
    });
  });

  describe('ConfigurationAccessControl', () => {
    it('should authenticate valid user', async () => {
      const accessSettings: AccessControlSettings = {
        enabled: true,
        requireAuthentication: true,
        roleBasedAccess: true,
        allowedUsers: ['testuser'],
        allowedRoles: ['admin'],
        adminUsers: ['admin'],
        readOnlyUsers: ['readonly'],
        sessionTimeout: 3600000,
        maxFailedAttempts: 3,
        lockoutDuration: 900000
      };

      const result = await ConfigurationAccessControl.authenticateUser(
        'testuser',
        'password123',
        accessSettings
      );

      expect(result.success).toBe(true);
      expect(result.sessionToken).toBeDefined();
      expect(result.permissions).toContain('read');
    });

    it('should reject invalid credentials', async () => {
      const accessSettings: AccessControlSettings = {
        enabled: true,
        requireAuthentication: true,
        roleBasedAccess: true,
        allowedUsers: ['testuser'],
        allowedRoles: ['admin'],
        adminUsers: ['admin'],
        readOnlyUsers: ['readonly'],
        sessionTimeout: 3600000,
        maxFailedAttempts: 3,
        lockoutDuration: 900000
      };

      const result = await ConfigurationAccessControl.authenticateUser(
        'invaliduser',
        'wrongpassword',
        accessSettings
      );

      expect(result.success).toBe(false);
      expect(result.sessionToken).toBeUndefined();
    });

    it('should bypass authentication when disabled', async () => {
      const accessSettings: AccessControlSettings = {
        enabled: false,
        requireAuthentication: false,
        roleBasedAccess: false,
        allowedUsers: [],
        allowedRoles: [],
        adminUsers: [],
        readOnlyUsers: [],
        sessionTimeout: 3600000,
        maxFailedAttempts: 3,
        lockoutDuration: 900000
      };

      const result = await ConfigurationAccessControl.authenticateUser(
        'anyuser',
        'anypassword',
        accessSettings
      );

      expect(result.success).toBe(true);
      expect(result.permissions).toContain('admin');
    });
  });

  describe('ConfigurationSecurityValidator', () => {
    it('should identify security issues', () => {
      const result = ConfigurationSecurityValidator.validateSecurity(mockConfiguration);

      expect(result.score).toBeLessThan(100);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some(issue => issue.description.includes('HTTPS'))).toBe(true);
      expect(result.issues.some(issue => issue.description.includes('authentication'))).toBe(true);
    });

    it('should provide security recommendations', () => {
      const result = ConfigurationSecurityValidator.validateSecurity(mockConfiguration);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(rec => rec.includes('HTTPS'))).toBe(true);
    });
  });
});

describe('Configuration Backup System', () => {
  describe('ConfigurationBackupManager', () => {
    it('should create a backup', async () => {
      const options: Partial<BackupOptions> = {
        includeSecrets: true,
        compress: false,
        validateBackup: true,
        tags: ['test']
      };

      const backup = await ConfigurationBackupManager.createBackup(
        mockConfiguration,
        options,
        'manual',
        'testuser'
      );

      expect(backup.id).toBeDefined();
      expect(backup.type).toBe('manual');
      expect(backup.createdBy).toBe('testuser');
      expect(backup.configuration).toEqual(mockConfiguration);
      expect(backup.tags).toContain('test');
    });

    it('should restore from backup', async () => {
      // First create a backup
      const backup = await ConfigurationBackupManager.createBackup(
        mockConfiguration,
        {},
        'manual',
        'testuser'
      );

      // Modify configuration
      const modifiedConfig = { ...mockConfiguration, version: '2.0.0' };

      // Restore from backup
      const result = await ConfigurationBackupManager.restoreFromBackup(backup.id, {
        currentConfig: modifiedConfig,
        backupCurrent: false,
        user: 'testuser'
      });

      expect(result.success).toBe(true);
      expect(result.restoredConfiguration.version).toBe('1.0.0'); // Original version
      expect(result.changes.length).toBeGreaterThan(0);
    });

    it('should list backups with filtering', async () => {
      // Create test backups
      await ConfigurationBackupManager.createBackup(mockConfiguration, { tags: ['test1'] }, 'manual');
      await ConfigurationBackupManager.createBackup(mockConfiguration, { tags: ['test2'] }, 'scheduled');

      const allBackups = ConfigurationBackupManager.listBackups();
      expect(allBackups.length).toBeGreaterThanOrEqual(2);

      const manualBackups = ConfigurationBackupManager.listBackups({ type: 'manual' });
      expect(manualBackups.every(b => b.type === 'manual')).toBe(true);

      const taggedBackups = ConfigurationBackupManager.listBackups({ tags: ['test1'] });
      expect(taggedBackups.some(b => b.tags.includes('test1'))).toBe(true);
    });
  });

  describe('ConfigurationVersionManager', () => {
    it('should create a configuration version', () => {
      const version = ConfigurationVersionManager.createVersion(mockConfiguration, {
        version: '1.0.0',
        name: 'Initial Version',
        description: 'Initial configuration version',
        user: 'testuser'
      });

      expect(version.id).toBeDefined();
      expect(version.version).toBe('1.0.0');
      expect(version.createdBy).toBe('testuser');
      expect(version.configuration).toEqual(mockConfiguration);
    });

    it('should activate a version', () => {
      const version = ConfigurationVersionManager.createVersion(mockConfiguration, {
        version: '1.0.0',
        user: 'testuser'
      });

      const activated = ConfigurationVersionManager.activateVersion(version.id);
      expect(activated).toBe(true);

      const activeVersion = ConfigurationVersionManager.getActiveVersion();
      expect(activeVersion?.id).toBe(version.id);
      expect(activeVersion?.status).toBe('active');
    });

    it('should compare versions', () => {
      const version1 = ConfigurationVersionManager.createVersion(mockConfiguration, {
        version: '1.0.0',
        user: 'testuser'
      });

      const modifiedConfig = { ...mockConfiguration, version: '1.1.0' };
      const version2 = ConfigurationVersionManager.createVersion(modifiedConfig, {
        version: '1.1.0',
        user: 'testuser'
      });

      const comparison = ConfigurationVersionManager.compareVersions(version1.id, version2.id);
      
      expect(comparison).toBeDefined();
      expect(comparison?.changes.length).toBeGreaterThan(0);
      expect(comparison?.summary.totalChanges).toBeGreaterThan(0);
    });
  });
});

describe('Configuration Optimization Engine', () => {
  it('should analyze configuration and provide recommendations', () => {
    const optimization = ConfigurationOptimizationEngine.analyzeConfiguration(
      mockConfiguration,
      'development'
    );

    expect(optimization.recommendations).toBeDefined();
    expect(optimization.performance).toBeDefined();
    expect(optimization.security).toBeDefined();
    expect(optimization.maintenance).toBeDefined();
    expect(optimization.cost).toBeDefined();
    expect(optimization.summary).toBeDefined();

    expect(optimization.performance.score).toBeGreaterThanOrEqual(0);
    expect(optimization.security.score).toBeGreaterThanOrEqual(0);
    expect(optimization.summary.overall_score).toBeGreaterThanOrEqual(0);
  });

  it('should identify performance bottlenecks', () => {
    const optimization = ConfigurationOptimizationEngine.analyzeConfiguration(
      mockConfiguration,
      'production'
    );

    expect(optimization.performance.bottlenecks).toBeDefined();
    expect(optimization.performance.improvements).toBeDefined();
    expect(optimization.performance.benchmarks).toBeDefined();
  });

  it('should provide security optimization recommendations', () => {
    const optimization = ConfigurationOptimizationEngine.analyzeConfiguration(
      mockConfiguration,
      'production'
    );

    expect(optimization.security.vulnerabilities.length).toBeGreaterThan(0);
    expect(optimization.security.improvements.length).toBeGreaterThan(0);
    
    // Should identify HTTPS and authentication issues
    expect(optimization.security.vulnerabilities.some(v => 
      v.description.includes('HTTPS') || v.description.includes('authentication')
    )).toBe(true);
  });
});

describe('Configuration Health Monitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch for service health checks
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok' })
    } as Response);
  });

  it('should monitor configuration health', async () => {
    const health = await ConfigurationHealthMonitor.monitorHealth(
      mockConfiguration,
      'development'
    );

    expect(health.overall).toBeDefined();
    expect(health.components).toBeDefined();
    expect(health.metrics).toBeDefined();
    expect(health.alerts).toBeDefined();
    expect(health.trends).toBeDefined();
    expect(health.recommendations).toBeDefined();

    expect(health.overall.score).toBeGreaterThanOrEqual(0);
    expect(health.overall.score).toBeLessThanOrEqual(100);
    expect(health.components.length).toBeGreaterThan(0);
  });

  it('should assess individual component health', async () => {
    const health = await ConfigurationHealthMonitor.monitorHealth(mockConfiguration);

    const componentNames = health.components.map(c => c.component);
    expect(componentNames).toContain('Qdrant Vector Store');
    expect(componentNames).toContain('Neo4j Graph Database');
    expect(componentNames).toContain('Ollama LLM Service');
    expect(componentNames).toContain('API Server');

    health.components.forEach(component => {
      expect(component.score).toBeGreaterThanOrEqual(0);
      expect(component.score).toBeLessThanOrEqual(100);
      expect(['healthy', 'warning', 'critical', 'unknown']).toContain(component.status);
    });
  });

  it('should generate health alerts for issues', async () => {
    // Create a configuration with issues that should trigger alerts
    const problematicConfig = {
      ...mockConfiguration,
      services: {
        ...mockConfiguration.services,
        qdrant: {
          ...mockConfiguration.services.qdrant,
          timeout: 5000 // Very low timeout
        }
      }
    };

    const health = await ConfigurationHealthMonitor.monitorHealth(problematicConfig);

    // Should have some alerts due to configuration issues
    expect(health.alerts).toBeDefined();
  });

  it('should manage alerts lifecycle', () => {
    const alertId = 'test-alert-1';
    
    // Should be able to acknowledge alerts
    const acknowledged = ConfigurationHealthMonitor.acknowledgeAlert(alertId, 'testuser');
    
    // Should be able to resolve alerts
    const resolved = ConfigurationHealthMonitor.resolveAlert(alertId, 'testuser');
    
    // Should be able to get active alerts
    const activeAlerts = ConfigurationHealthMonitor.getActiveAlerts();
    expect(Array.isArray(activeAlerts)).toBe(true);
  });
});

describe('Integration Tests', () => {
  it('should perform end-to-end configuration management workflow', async () => {
    // 1. Create backup
    const backup = await ConfigurationBackupManager.createBackup(
      mockConfiguration,
      { validateBackup: true },
      'manual',
      'testuser'
    );
    expect(backup.id).toBeDefined();

    // 2. Create version
    const version = ConfigurationVersionManager.createVersion(mockConfiguration, {
      version: '1.0.0',
      user: 'testuser'
    });
    expect(version.id).toBeDefined();

    // 3. Export configuration
    const exportResult = await ConfigurationExporter.exportConfiguration(mockConfiguration, {
      format: 'json',
      scope: 'full',
      includeComments: false,
      includeSensitive: false,
      maskSensitive: false,
      minifyOutput: false,
      validateExport: true
    });
    expect(exportResult.success).toBe(true);

    // 4. Analyze optimization
    const optimization = ConfigurationOptimizationEngine.analyzeConfiguration(mockConfiguration);
    expect(optimization.summary.overall_score).toBeGreaterThanOrEqual(0);

    // 5. Monitor health
    const health = await ConfigurationHealthMonitor.monitorHealth(mockConfiguration);
    expect(health.overall.score).toBeGreaterThanOrEqual(0);

    // 6. Validate security
    const securityValidation = ConfigurationSecurityValidator.validateSecurity(mockConfiguration);
    expect(securityValidation.score).toBeGreaterThanOrEqual(0);
  });

  it('should handle configuration updates with proper tracking', async () => {
    // Start with initial configuration
    const initialBackup = await ConfigurationBackupManager.createBackup(
      mockConfiguration,
      {},
      'manual',
      'testuser'
    );

    // Create modified configuration
    const modifiedConfig = {
      ...mockConfiguration,
      version: '1.1.0',
      services: {
        ...mockConfiguration.services,
        qdrant: {
          ...mockConfiguration.services.qdrant,
          timeout: 45000
        }
      }
    };

    // Import the modified configuration
    const importResult = await ConfigurationImporter.importConfiguration(
      JSON.stringify(modifiedConfig),
      'json',
      mockConfiguration,
      {
        format: 'json',
        mergeStrategy: 'merge',
        validateImport: true,
        backupBeforeImport: true,
        skipValidation: false,
        dryRun: false,
        conflictResolution: 'overwrite'
      }
    );

    expect(importResult.success).toBe(true);
    expect(importResult.changes.length).toBeGreaterThan(0);

    // Verify changes were tracked
    const changes = importResult.changes;
    const versionChange = changes.find(c => c.field === 'version');
    const timeoutChange = changes.find(c => c.path === 'services.qdrant.timeout');

    expect(versionChange).toBeDefined();
    expect(timeoutChange).toBeDefined();
  });
});
/**
 * Configuration Validation Tests
 * Phase 7.4.1 - Comprehensive test coverage for configuration validation system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  ConfigurationValidator, 
  createDefaultConfiguration,
  configurationValidator 
} from '../configurationValidation';
import type { SystemConfiguration } from '../../types/configuration';

describe('ConfigurationValidator', () => {
  let validator: ConfigurationValidator;
  let validConfig: SystemConfiguration;

  beforeEach(() => {
    validator = new ConfigurationValidator();
    validConfig = createDefaultConfiguration();
  });

  describe('Schema Validation', () => {
    it('should validate a correct default configuration', async () => {
      const result = await validator.validate(validConfig);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata.durationMs).toBeGreaterThan(0);
      expect(result.metadata.schemaVersion).toBe('1.0.0');
    });

    it('should reject configuration with invalid version format', async () => {
      const invalidConfig = {
        ...validConfig,
        version: 'invalid-version'
      };

      const result = await validator.validate(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].path).toBe('version');
      expect(result.errors[0].code).toBe('invalid_format');
    });

    it('should reject configuration with invalid port number', async () => {
      const invalidConfig = {
        ...validConfig,
        api: {
          ...validConfig.api,
          port: 70000 // Invalid port number
        }
      };

      const result = await validator.validate(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => 
        error.path === 'api.port' && error.code === 'too_big'
      )).toBe(true);
    });

    it('should reject configuration with invalid URL', async () => {
      const invalidConfig = {
        ...validConfig,
        api: {
          ...validConfig.api,
          baseUrl: 'not-a-valid-url'
        }
      };

      const result = await validator.validate(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => 
        error.path === 'api.baseUrl'
      )).toBe(true);
    });

    it('should validate nested configuration objects', async () => {
      const invalidConfig = {
        ...validConfig,
        services: {
          ...validConfig.services,
          qdrant: {
            ...validConfig.services.qdrant,
            vectorSize: -1 // Invalid vector size
          }
        }
      };

      const result = await validator.validate(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => 
        error.path === 'services.qdrant.vectorSize'
      )).toBe(true);
    });

    it('should validate enum values', async () => {
      const invalidConfig = {
        ...validConfig,
        services: {
          ...validConfig.services,
          qdrant: {
            ...validConfig.services.qdrant,
            distance: 'invalid-distance' as any
          }
        }
      };

      const result = await validator.validate(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => 
        error.path === 'services.qdrant.distance'
      )).toBe(true);
    });
  });

  describe('Dependency Validation', () => {
    it('should require JWT secret when JWT authentication is enabled', async () => {
      const invalidConfig = {
        ...validConfig,
        api: {
          ...validConfig.api,
          authentication: {
            enabled: true,
            provider: 'jwt' as const
            // Missing jwtSecret
          }
        }
      };

      const result = await validator.validate(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => 
        error.code === 'DEPENDENCY_VIOLATION' &&
        error.message.includes('JWT authentication requires a secret key')
      )).toBe(true);
    });

    it('should require OAuth config when OAuth authentication is enabled', async () => {
      const invalidConfig = {
        ...validConfig,
        api: {
          ...validConfig.api,
          authentication: {
            enabled: true,
            provider: 'oauth' as const
            // Missing oauth config
          }
        }
      };

      const result = await validator.validate(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => 
        error.code === 'DEPENDENCY_VIOLATION'
      )).toBe(true);
    });

    it('should require certificate paths when HTTPS is enabled', async () => {
      const invalidConfig = {
        ...validConfig,
        security: {
          ...validConfig.security,
          https: {
            enabled: true,
            redirectHttp: true,
            minTlsVersion: '1.2' as const
            // Missing certificatePath and keyPath
          }
        }
      };

      const result = await validator.validate(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => 
        error.code === 'DEPENDENCY_VIOLATION' &&
        error.message.includes('certificate')
      )).toBe(true);
    });

    it('should require Redis URL when Redis caching is enabled', async () => {
      const invalidConfig = {
        ...validConfig,
        features: {
          ...validConfig.features,
          caching: {
            ...validConfig.features.caching,
            layers: {
              ...validConfig.features.caching.layers,
              redis: {
                enabled: true,
                ttl: 3600
                // Missing url
              } as any
            }
          }
        }
      };

      const result = await validator.validate(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => 
        error.code === 'DEPENDENCY_VIOLATION'
      )).toBe(true);
    });
  });

  describe('Cross-Reference Validation', () => {
    it('should detect port conflicts between services', async () => {
      const conflictConfig = {
        ...validConfig,
        api: {
          ...validConfig.api,
          port: 6333,
          baseUrl: 'http://localhost:6333'
        },
        services: {
          ...validConfig.services,
          qdrant: {
            ...validConfig.services.qdrant,
            url: 'http://localhost:6333' // Same port as API
          }
        }
      };

      const result = await validator.validate(conflictConfig);
      
      expect(result.errors.some(error => 
        error.code === 'PORT_CONFLICT'
      )).toBe(true);
    });

    it('should warn about unavailable models', async () => {
      const invalidConfig = {
        ...validConfig,
        services: {
          ...validConfig.services,
          ollama: {
            ...validConfig.services.ollama,
            chatModel: 'non-existent-model',
            models: {
              chat: ['llama3'],
              embedding: ['mxbai-embed-large']
            }
          }
        }
      };

      const result = await validator.validate(invalidConfig);
      
      expect(result.warnings.some(warning => 
        warning.code === 'MODEL_NOT_AVAILABLE' &&
        warning.path === 'services.ollama.chatModel'
      )).toBe(true);
    });
  });

  describe('Performance Validation', () => {
    it('should warn about connection timeout greater than request timeout', async () => {
      const invalidConfig = {
        ...validConfig,
        performance: {
          ...validConfig.performance,
          timeouts: {
            ...validConfig.performance.timeouts,
            connection: 60000,
            request: 30000 // Connection timeout > request timeout
          }
        }
      };

      const result = await validator.validate(invalidConfig);
      
      expect(result.warnings.some(warning => 
        warning.code === 'TIMEOUT_MISMATCH'
      )).toBe(true);
    });

    it('should suggest increasing low memory limits', async () => {
      const lowMemoryConfig = {
        ...validConfig,
        performance: {
          ...validConfig.performance,
          resourceLimits: {
            ...validConfig.performance.resourceLimits,
            maxMemoryMb: 256 // Very low memory
          }
        }
      };

      const result = await validator.validate(lowMemoryConfig);
      
      expect(result.suggestions.some(suggestion => 
        suggestion.code === 'LOW_MEMORY_LIMIT'
      )).toBe(true);
    });

    it('should validate connection pool settings', async () => {
      const invalidConfig = {
        ...validConfig,
        performance: {
          ...validConfig.performance,
          connectionPools: {
            ...validConfig.performance.connectionPools,
            minConnections: 50,
            maxConnections: 10 // Min > Max
          }
        }
      };

      const result = await validator.validate(invalidConfig);
      
      expect(result.errors.some(error => 
        error.path === 'performance.connectionPools.minConnections'
      )).toBe(true);
    });
  });

  describe('Security Validation', () => {
    it('should suggest enabling HTTPS', async () => {
      const httpConfig = {
        ...validConfig,
        security: {
          ...validConfig.security,
          https: {
            ...validConfig.security.https,
            enabled: false
          }
        }
      };

      const result = await validator.validate(httpConfig);
      
      expect(result.suggestions.some(suggestion => 
        suggestion.code === 'HTTPS_RECOMMENDED'
      )).toBe(true);
    });

    it('should warn about disabled authentication', async () => {
      const noAuthConfig = {
        ...validConfig,
        api: {
          ...validConfig.api,
          authentication: {
            ...validConfig.api.authentication,
            enabled: false
          }
        }
      };

      const result = await validator.validate(noAuthConfig);
      
      expect(result.warnings.some(warning => 
        warning.code === 'NO_AUTHENTICATION'
      )).toBe(true);
    });

    it('should warn about weak JWT secrets', async () => {
      const weakSecretConfig = {
        ...validConfig,
        api: {
          ...validConfig.api,
          authentication: {
            enabled: true,
            provider: 'jwt' as const,
            jwtSecret: 'weak-secret' // Too short
          }
        }
      };

      const result = await validator.validate(weakSecretConfig);
      
      expect(result.warnings.some(warning => 
        warning.code === 'WEAK_JWT_SECRET'
      )).toBe(true);
    });

    it('should warn about permissive CORS settings', async () => {
      const permissiveCorsConfig = {
        ...validConfig,
        api: {
          ...validConfig.api,
          cors: {
            ...validConfig.api.cors,
            origins: ['*'] // Allow all origins
          }
        }
      };

      const result = await validator.validate(permissiveCorsConfig);
      
      expect(result.warnings.some(warning => 
        warning.code === 'PERMISSIVE_CORS'
      )).toBe(true);
    });
  });

  describe('Custom Dependencies', () => {
    it('should allow adding custom dependency rules', async () => {
      validator.addDependency({
        source: 'features.debugMode',
        target: 'monitoring.logging.level',
        type: 'requires',
        condition: (debugMode, logLevel) => debugMode === true && logLevel !== 'debug',
        message: 'Debug mode requires debug log level'
      });

      const invalidConfig = {
        ...validConfig,
        features: {
          ...validConfig.features,
          debugMode: true
        },
        monitoring: {
          ...validConfig.monitoring,
          logging: {
            ...validConfig.monitoring.logging,
            level: 'info' as const
          }
        }
      };

      const result = await validator.validate(invalidConfig);
      
      expect(result.errors.some(error => 
        error.message === 'Debug mode requires debug log level'
      )).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation exceptions gracefully', async () => {
      // Create a config that will cause an exception during validation
      const problematicConfig = null as any;

      const result = await validator.validate(problematicConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => 
        error.code === 'VALIDATION_EXCEPTION'
      )).toBe(true);
    });

    it('should handle dependency check failures', async () => {
      // Add a dependency with a problematic condition that will throw
      validator.addDependency({
        source: 'nonexistent.path',
        target: 'another.nonexistent.path',
        type: 'requires',
        condition: () => { throw new Error('Test error'); },
        message: 'This will fail'
      });

      const result = await validator.validate(validConfig);
      
      expect(result.warnings.some(warning => 
        warning.code === 'DEPENDENCY_CHECK_FAILED'
      )).toBe(true);
    });
  });

  describe('Configuration Factory', () => {
    it('should create a valid default configuration', () => {
      const defaultConfig = createDefaultConfiguration();
      
      expect(defaultConfig.version).toBe('1.0.0');
      expect(defaultConfig.api.port).toBe(8080);
      expect(defaultConfig.services.qdrant.url).toBe('http://localhost:6333');
      expect(defaultConfig.services.neo4j.uri).toBe('bolt://localhost:7687');
      expect(defaultConfig.services.ollama.baseUrl).toBe('http://host.docker.internal:11434');
    });

    it('should create configuration with sensible defaults', () => {
      const defaultConfig = createDefaultConfiguration();
      
      // Check that security defaults are appropriate for development
      expect(defaultConfig.security.https.enabled).toBe(false);
      expect(defaultConfig.api.authentication.enabled).toBe(false);
      
      // Check that features are enabled appropriately
      expect(defaultConfig.features.realTimeUpdates).toBe(true);
      expect(defaultConfig.features.debugMode).toBe(false);
      
      // Check that performance settings are reasonable
      expect(defaultConfig.performance.timeouts.request).toBe(30000);
      expect(defaultConfig.performance.resourceLimits.maxMemoryMb).toBe(2048);
    });
  });

  describe('Validation Result Metadata', () => {
    it('should include complete metadata in validation results', async () => {
      const result = await validator.validate(validConfig);
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.metadata.schemaVersion).toBe('1.0.0');
      expect(result.metadata.timestamp).toBeTruthy();
      expect(result.metadata.validatorVersion).toBe('1.0.0');
    });

    it('should provide detailed error information', async () => {
      const invalidConfig = {
        ...validConfig,
        api: {
          ...validConfig.api,
          port: 'not-a-number' as any
        }
      };

      const result = await validator.validate(invalidConfig);
      
      const portError = result.errors.find(error => error.path === 'api.port');
      expect(portError).toBeDefined();
      expect(portError?.severity).toBe('error');
      expect(portError?.message).toBeTruthy();
    });
  });

  describe('Integration with Global Validator', () => {
    it('should use the global validator instance correctly', async () => {
      const result = await configurationValidator.validate(validConfig);
      
      expect(result.isValid).toBe(true);
      expect(result.metadata.validatorVersion).toBe('1.0.0');
    });
  });
});
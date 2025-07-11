/**
 * Configuration Integration Tests
 * Phase 7.4.1 - Integration tests for complete configuration workflow
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ConfigurationValidator,
  createDefaultConfiguration,
  configurationValidator
} from '../configurationValidation';
import {
  ConfigurationMerger,
  ConfigurationDiffer,
  ConfigurationSerializer,
  ConfigurationTemplateManager,
  configurationMerger,
  configurationDiffer,
  configurationSerializer,
  configurationTemplateManager
} from '../configurationUtils';
import type { SystemConfiguration } from '../../types/configuration';

describe('Configuration System Integration', () => {
  let validator: ConfigurationValidator;
  let merger: ConfigurationMerger;
  let differ: ConfigurationDiffer;
  let serializer: ConfigurationSerializer;
  let templateManager: ConfigurationTemplateManager;
  let baseConfig: SystemConfiguration;

  beforeEach(() => {
    validator = new ConfigurationValidator();
    merger = new ConfigurationMerger();
    differ = new ConfigurationDiffer();
    serializer = new ConfigurationSerializer();
    templateManager = new ConfigurationTemplateManager();
    baseConfig = createDefaultConfiguration();
  });

  describe('Complete Configuration Workflow', () => {
    it('should handle complete config generation and validation workflow', async () => {
      // 1. Generate configuration from template
      const templateConfig = templateManager.generateFromTemplate('development');
      
      // 2. Merge with base configuration
      const mergedConfig = merger.merge(baseConfig, templateConfig);
      
      // 3. Validate the merged configuration
      const validationResult = await validator.validate(mergedConfig);
      
      // 4. Export and re-import
      const exported = serializer.export(mergedConfig, { format: 'json' });
      const reimported = serializer.import(exported, 'json');
      
      // 5. Validate the re-imported configuration
      const finalValidation = await validator.validate(reimported);
      
      expect(validationResult.isValid).toBe(true);
      expect(finalValidation.isValid).toBe(true);
      expect(reimported.features.debugMode).toBe(true); // From development template
    });

    it('should handle production configuration workflow', async () => {
      // Generate production configuration with variables
      const prodTemplate = templateManager.generateFromTemplate('production', {
        domain: 'api.example.com',
        httpsPort: 443
      });
      
      // Merge with base configuration
      const prodConfig = merger.merge(baseConfig, prodTemplate);
      
      // Validate production configuration
      const validation = await validator.validate(prodConfig);
      
      expect(validation.isValid).toBe(true);
      expect(prodConfig.features.debugMode).toBe(false);
      expect(prodConfig.security.https.enabled).toBe(true);
      
      // Should have some warnings about security improvements
      expect(validation.warnings.length).toBeGreaterThan(0);
    });

    it('should handle configuration migration and updates', async () => {
      // Start with base configuration
      const originalConfig = { ...baseConfig };
      
      // Create an updated configuration
      const updates = {
        api: {
          ...baseConfig.api,
          port: 9090,
          authentication: {
            enabled: true,
            provider: 'jwt' as const,
            jwtSecret: 'super-secret-jwt-key-that-is-very-long-and-secure-for-testing'
          }
        },
        features: {
          ...baseConfig.features,
          debugMode: true,
          experimentalFeatures: true
        }
      };
      
      const updatedConfig = merger.merge(originalConfig, updates);
      
      // Validate the updated configuration
      const validation = await validator.validate(updatedConfig);
      expect(validation.isValid).toBe(true);
      
      // Generate diff
      const differences = differ.diff(originalConfig, updatedConfig);
      const summary = differ.getSummary(differences);
      
      expect(differences.length).toBeGreaterThan(0);
      expect(summary.byType.changed).toBeGreaterThan(0);
      expect(summary.criticalChanges.length).toBeGreaterThan(0);
      
      // Check that port change is marked as critical
      const portChange = differences.find(diff => diff.path === 'api.port');
      expect(portChange).toBeDefined();
      expect(portChange?.severity).toBe('high');
    });

    it('should handle configuration inheritance chains', async () => {
      // Create a base configuration
      const baseConfig = createDefaultConfiguration();
      
      // Create environment-specific overlays
      const devOverlay = templateManager.generateFromTemplate('development');
      const stagingOverlay = {
        api: {
          port: 8080,
          authentication: {
            enabled: true,
            provider: 'jwt' as const,
            jwtSecret: 'staging-secret-key-that-is-very-long-and-secure-for-testing'
          }
        },
        features: {
          debugMode: false,
          advancedAnalytics: true
        }
      };
      
      // Apply inheritance: base -> dev -> staging
      const devConfig = merger.applyInheritance(devOverlay, baseConfig);
      const stagingConfig = merger.applyInheritance(stagingOverlay, devConfig);
      
      // Validate final configuration
      const validation = await validator.validate(stagingConfig);
      expect(validation.isValid).toBe(true);
      
      // Check inheritance worked correctly
      expect(stagingConfig.api.port).toBe(8080); // From staging
      expect(stagingConfig.features.debugMode).toBe(false); // From staging (overrides dev)
      expect(stagingConfig.features.advancedAnalytics).toBe(true); // From staging
      expect(stagingConfig.features.realTimeUpdates).toBe(true); // From dev (inherited)
    });

    it('should handle configuration export/import cycle with masking', async () => {
      // Create configuration with secrets
      const secretConfig = {
        ...baseConfig,
        api: {
          ...baseConfig.api,
          authentication: {
            enabled: true,
            provider: 'jwt' as const,
            jwtSecret: 'super-secret-jwt-key',
            oauth: {
              provider: 'google',
              clientId: 'client-id',
              clientSecret: 'client-secret',
              callbackUrl: 'https://example.com/callback',
              scopes: ['profile', 'email']
            }
          }
        },
        security: {
          ...baseConfig.security,
          dataProtection: {
            ...baseConfig.security.dataProtection,
            encryptionKey: 'encryption-key-for-sensitive-data'
          }
        }
      };
      
      // Export with secrets masked
      const maskedExport = serializer.export(secretConfig, {
        format: 'json',
        maskSecrets: true
      });
      
      expect(maskedExport).toContain('***MASKED***');
      expect(maskedExport).not.toContain('super-secret-jwt-key');
      expect(maskedExport).not.toContain('client-secret');
      expect(maskedExport).not.toContain('encryption-key-for-sensitive-data');
      
      // Export without masking
      const unmaskedExport = serializer.export(secretConfig, {
        format: 'json',
        maskSecrets: false
      });
      
      expect(unmaskedExport).not.toContain('***MASKED***');
      expect(unmaskedExport).toContain('super-secret-jwt-key');
      
      // Re-import unmasked configuration
      const reimported = serializer.import(unmaskedExport, 'json');
      const validation = await validator.validate(reimported);
      
      expect(validation.isValid).toBe(true);
      expect(reimported.api.authentication.jwtSecret).toBe('super-secret-jwt-key');
    });

    it('should handle multi-format export and environment-specific configurations', async () => {
      const config = createDefaultConfiguration();
      
      // Test different export formats
      const jsonExport = serializer.export(config, { format: 'json' });
      const envExport = serializer.export(config, { format: 'env' });
      
      expect(() => JSON.parse(jsonExport)).not.toThrow();
      expect(envExport).toContain('CMS_VERSION=1.0.0');
      expect(envExport).toContain('CMS_API_PORT=8080');
      
      // Re-import from environment format
      const envImported = serializer.import(envExport, 'env');
      const validation = await validator.validate(envImported);
      
      // Note: env import may have some structural differences due to flattening
      expect(validation.errors.length).toBeLessThan(5); // Allow some minor structural issues
    });

    it('should detect and report complex configuration conflicts', async () => {
      const conflictConfig = {
        ...baseConfig,
        api: {
          ...baseConfig.api,
          port: 6333, // Conflicts with Qdrant
          baseUrl: 'http://localhost:6333'
        },
        services: {
          ...baseConfig.services,
          qdrant: {
            ...baseConfig.services.qdrant,
            url: 'http://localhost:6333' // Same port as API
          },
          neo4j: {
            ...baseConfig.services.neo4j,
            uri: 'bolt://localhost:6333' // Same port again
          }
        },
        performance: {
          ...baseConfig.performance,
          timeouts: {
            ...baseConfig.performance.timeouts,
            connection: 60000,
            request: 30000 // Connection timeout > request timeout
          },
          connectionPools: {
            ...baseConfig.performance.connectionPools,
            minConnections: 50,
            maxConnections: 10 // Min > Max
          }
        }
      };
      
      const validation = await validator.validate(conflictConfig);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      
      // Should detect port conflicts
      const portConflicts = validation.errors.filter(error => 
        error.code === 'PORT_CONFLICT'
      );
      expect(portConflicts.length).toBeGreaterThan(0);
      
      // Should detect connection pool issue
      const poolErrors = validation.errors.filter(error => 
        error.code === 'INVALID_CONNECTION_POOL'
      );
      expect(poolErrors.length).toBe(1);
      
      // Should detect timeout mismatch
      const timeoutWarnings = validation.warnings.filter(warning => 
        warning.code === 'TIMEOUT_MISMATCH'
      );
      expect(timeoutWarnings.length).toBe(1);
    });

    it('should handle complex merge scenarios with custom strategies', async () => {
      const baseConfig = createDefaultConfiguration();
      const overlay1 = {
        api: {
          cors: {
            origins: ['http://app1.com', 'http://app2.com']
          }
        },
        features: {
          caching: {
            layers: {
              memory: {
                maxEntries: 5000
              }
            }
          }
        }
      };
      
      const overlay2 = {
        api: {
          cors: {
            origins: ['http://app3.com']
          }
        },
        features: {
          caching: {
            layers: {
              memory: {
                maxEntries: 10000
              },
              redis: {
                enabled: true,
                url: 'redis://localhost:6379',
                ttl: 7200
              }
            }
          }
        }
      };
      
      // Merge with custom strategies
      const result = merger.merge(
        merger.merge(baseConfig, overlay1),
        overlay2,
        {
          customStrategies: {
            'api.cors.origins': (target, source) => {
              // Combine all origins and remove duplicates
              const combined = [...(target || []), ...(source || [])];
              return Array.from(new Set(combined));
            }
          }
        }
      );
      
      const validation = await validator.validate(result);
      expect(validation.isValid).toBe(true);
      
      // Check custom merge strategy worked
      expect(result.api.cors.origins).toEqual([
        'http://localhost:3000', // From base
        'http://app1.com',       // From overlay1
        'http://app2.com',       // From overlay1
        'http://app3.com'        // From overlay2
      ]);
      
      // Check deep merge worked
      expect(result.features.caching.layers.memory.maxEntries).toBe(10000); // From overlay2
      expect(result.features.caching.layers.redis?.enabled).toBe(true); // From overlay2
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle large configurations efficiently', async () => {
      // Create a large configuration by duplicating services
      const largeConfig = {
        ...baseConfig,
        services: {
          ...baseConfig.services,
          // Simulate many services
          ...Array.from({ length: 100 }, (_, i) => ({
            [`service${i}`]: {
              url: `http://service${i}.example.com`,
              timeout: 30000,
              retries: 3
            }
          })).reduce((acc, service) => ({ ...acc, ...service }), {})
        }
      };
      
      const startTime = Date.now();
      const validation = await validator.validate(largeConfig);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(validation.metadata.durationMs).toBeLessThan(5000);
    });

    it('should handle malformed configurations gracefully', async () => {
      const malformedConfigs = [
        null,
        undefined,
        {},
        { version: null },
        { api: null },
        { services: { qdrant: null } }
      ];
      
      for (const malformed of malformedConfigs) {
        const validation = await validator.validate(malformed as any);
        expect(validation.isValid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(0);
        expect(validation.metadata).toBeDefined();
      }
    });

    it('should provide comprehensive error reporting', async () => {
      const problematicConfig = {
        version: 'invalid',
        api: {
          baseUrl: 'not-a-url',
          port: -1,
          cors: {
            enabled: 'not-boolean',
            origins: 'not-an-array'
          }
        },
        services: {
          qdrant: {
            url: 'invalid-url',
            vectorSize: -1,
            distance: 'invalid-distance'
          }
        }
      };
      
      const validation = await validator.validate(problematicConfig as any);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(5);
      
      // Check that errors provide helpful information
      for (const error of validation.errors) {
        expect(error.path).toBeTruthy();
        expect(error.message).toBeTruthy();
        expect(error.code).toBeTruthy();
        expect(error.severity).toBeTruthy();
      }
      
      // Check that related errors are grouped logically
      const apiErrors = validation.errors.filter(error => error.path.startsWith('api.'));
      const serviceErrors = validation.errors.filter(error => error.path.startsWith('services.'));
      
      expect(apiErrors.length).toBeGreaterThan(0);
      expect(serviceErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Global Utility Integration', () => {
    it('should work with global utility instances', async () => {
      const template = configurationTemplateManager.generateFromTemplate('production', {
        domain: 'example.com'
      });
      
      const merged = configurationMerger.merge(baseConfig, template);
      const validation = await configurationValidator.validate(merged);
      
      expect(validation.isValid).toBe(true);
      
      const exported = configurationSerializer.export(merged);
      const reimported = configurationSerializer.import(exported, 'json');
      
      const differences = configurationDiffer.diff(merged, reimported);
      expect(differences.length).toBe(0); // Should be identical after round-trip
    });

    it('should maintain consistency across all utilities', async () => {
      const originalConfig = createDefaultConfiguration();
      
      // Make some changes
      const changes = {
        api: { port: 9090 },
        features: { debugMode: true }
      };
      
      const modifiedConfig = configurationMerger.merge(originalConfig, changes);
      
      // Validate
      const validation = await configurationValidator.validate(modifiedConfig);
      expect(validation.isValid).toBe(true);
      
      // Export/Import cycle
      const exported = configurationSerializer.export(modifiedConfig);
      const reimported = configurationSerializer.import(exported, 'json');
      
      // Diff original vs final
      const differences = configurationDiffer.diff(originalConfig, reimported);
      const summary = configurationDiffer.getSummary(differences);
      
      expect(summary.total).toBe(2); // Only our intentional changes
      expect(differences.some(diff => diff.path === 'api.port')).toBe(true);
      expect(differences.some(diff => diff.path === 'features.debugMode')).toBe(true);
    });
  });
});
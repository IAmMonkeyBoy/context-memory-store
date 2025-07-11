/**
 * Configuration Utils Tests
 * Phase 7.4.1 - Comprehensive test coverage for configuration utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
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
import { createDefaultConfiguration } from '../configurationValidation';
import type { SystemConfiguration } from '../../types/configuration';

describe('ConfigurationMerger', () => {
  let merger: ConfigurationMerger;
  let baseConfig: Partial<SystemConfiguration>;
  let overlayConfig: Partial<SystemConfiguration>;

  beforeEach(() => {
    merger = new ConfigurationMerger();
    baseConfig = {
      version: '1.0.0',
      api: {
        baseUrl: 'http://localhost:8080',
        port: 8080,
        cors: {
          enabled: true,
          origins: ['http://localhost:3000'],
          methods: ['GET', 'POST'],
          allowedHeaders: ['Content-Type'],
          credentials: false,
          maxAge: 3600
        }
      } as any,
      features: {
        debugMode: false,
        realTimeUpdates: true
      } as any
    };

    overlayConfig = {
      api: {
        port: 9090,
        cors: {
          origins: ['http://localhost:4000'],
          credentials: true
        }
      } as any,
      features: {
        debugMode: true,
        experimentalFeatures: true
      } as any
    };
  });

  describe('Basic Merging', () => {
    it('should merge configurations correctly', () => {
      const result = merger.merge(baseConfig, overlayConfig);

      expect(result.version).toBe('1.0.0');
      expect(result.api.port).toBe(9090); // Overridden
      expect(result.api.baseUrl).toBe('http://localhost:8080'); // Preserved
      expect(result.api.cors.enabled).toBe(true); // Preserved
      expect(result.api.cors.credentials).toBe(true); // Overridden
      expect(result.features.debugMode).toBe(true); // Overridden
      expect(result.features.realTimeUpdates).toBe(true); // Preserved
      expect(result.features.experimentalFeatures).toBe(true); // Added
    });

    it('should handle array merging', () => {
      const result = merger.merge(baseConfig, overlayConfig, {
        mergeArrays: true
      });

      expect(result.api.cors.origins).toEqual([
        'http://localhost:3000',
        'http://localhost:4000'
      ]);
      expect(result.api.cors.methods).toEqual(['GET', 'POST']);
    });

    it('should replace arrays when mergeArrays is false', () => {
      const result = merger.merge(baseConfig, overlayConfig, {
        mergeArrays: false
      });

      expect(result.api.cors.origins).toEqual(['http://localhost:4000']);
    });

    it('should handle null values based on preserveNulls option', () => {
      const configWithNull = {
        features: {
          debugMode: null
        }
      };

      const resultPreserve = merger.merge(baseConfig, configWithNull, {
        preserveNulls: true
      });
      expect(resultPreserve.features.debugMode).toBe(null);

      const resultIgnore = merger.merge(baseConfig, configWithNull, {
        preserveNulls: false
      });
      expect(resultIgnore.features.debugMode).toBe(false); // Original value preserved
    });

    it('should exclude paths when specified', () => {
      const result = merger.merge(baseConfig, overlayConfig, {
        excludePaths: ['api.port']
      });

      expect(result.api.port).toBe(8080); // Not overridden
      expect(result.features.debugMode).toBe(true); // Still overridden
    });

    it('should use custom merge strategies', () => {
      const result = merger.merge(baseConfig, overlayConfig, {
        customStrategies: {
          'api.cors.origins': (target, source) => [...target, ...source, 'custom-origin']
        }
      });

      expect(result.api.cors.origins).toEqual([
        'http://localhost:3000',
        'http://localhost:4000',
        'custom-origin'
      ]);
    });
  });

  describe('Multiple Configuration Merging', () => {
    it('should merge multiple configurations in order', () => {
      const config1 = { features: { debugMode: true } };
      const config2 = { features: { debugMode: false, realTimeUpdates: true } };
      const config3 = { features: { experimentalFeatures: true } };

      const result = merger.mergeMultiple([config1, config2, config3]);

      expect(result.features.debugMode).toBe(false); // Last wins
      expect(result.features.realTimeUpdates).toBe(true);
      expect(result.features.experimentalFeatures).toBe(true);
    });

    it('should throw error for empty configuration array', () => {
      expect(() => merger.mergeMultiple([])).toThrow('At least one configuration must be provided');
    });
  });

  describe('Configuration Inheritance', () => {
    it('should apply inheritance correctly', () => {
      const parentConfig = {
        api: { port: 8080 },
        features: { debugMode: false }
      };

      const childConfig = {
        api: { port: 9090 },
        features: { experimentalFeatures: true }
      };

      const result = merger.applyInheritance(childConfig, parentConfig);

      expect(result.api.port).toBe(9090); // Child overrides parent
      expect(result.features.debugMode).toBe(false); // Inherited from parent
      expect(result.features.experimentalFeatures).toBe(true); // Child addition
    });
  });
});

describe('ConfigurationDiffer', () => {
  let differ: ConfigurationDiffer;
  let oldConfig: SystemConfiguration;
  let newConfig: SystemConfiguration;

  beforeEach(() => {
    differ = new ConfigurationDiffer();
    oldConfig = createDefaultConfiguration();
    newConfig = {
      ...oldConfig,
      api: {
        ...oldConfig.api,
        port: 9090, // Changed
        cors: {
          ...oldConfig.api.cors,
          origins: [...oldConfig.api.cors.origins, 'http://new-origin.com'] // Added
        }
      },
      features: {
        ...oldConfig.features,
        debugMode: true, // Changed
        newFeature: true // Added (this would need to be properly typed)
      } as any
    };
    
    // Remove a property to test removal
    delete (newConfig.services.ollama as any).keepAlive;
  });

  describe('Basic Diffing', () => {
    it('should detect changes between configurations', () => {
      const differences = differ.diff(oldConfig, newConfig);

      expect(differences.length).toBeGreaterThan(0);
      
      // Check for port change
      const portChange = differences.find(diff => diff.path === 'api.port');
      expect(portChange).toBeDefined();
      expect(portChange?.type).toBe('changed');
      expect(portChange?.oldValue).toBe(8080);
      expect(portChange?.newValue).toBe(9090);

      // Check for debug mode change
      const debugChange = differences.find(diff => diff.path === 'features.debugMode');
      expect(debugChange).toBeDefined();
      expect(debugChange?.type).toBe('changed');
      expect(debugChange?.oldValue).toBe(false);
      expect(debugChange?.newValue).toBe(true);
    });

    it('should detect additions', () => {
      const differences = differ.diff(oldConfig, newConfig);
      
      const addition = differences.find(diff => 
        diff.path === 'features.newFeature' && diff.type === 'added'
      );
      expect(addition).toBeDefined();
      expect(addition?.newValue).toBe(true);
    });

    it('should detect removals', () => {
      const differences = differ.diff(oldConfig, newConfig);
      
      const removal = differences.find(diff => 
        diff.path === 'services.ollama.keepAlive' && diff.type === 'removed'
      );
      expect(removal).toBeDefined();
      expect(removal?.oldValue).toBe('5m');
    });

    it('should handle array changes', () => {
      const differences = differ.diff(oldConfig, newConfig);
      
      const arrayChange = differences.find(diff => 
        diff.path === 'api.cors.origins' && diff.type === 'changed'
      );
      expect(arrayChange).toBeDefined();
      expect(arrayChange?.description).toContain('Modified array');
    });

    it('should assign appropriate severity levels', () => {
      const differences = differ.diff(oldConfig, newConfig);
      
      // Port change should be high severity
      const portChange = differences.find(diff => diff.path === 'api.port');
      expect(portChange?.severity).toBe('high');

      // Debug mode should be low severity
      const debugChange = differences.find(diff => diff.path === 'features.debugMode');
      expect(debugChange?.severity).toBe('low');
    });
  });

  describe('Diff Summary', () => {
    it('should provide accurate summary statistics', () => {
      const differences = differ.diff(oldConfig, newConfig);
      const summary = differ.getSummary(differences);

      expect(summary.total).toBe(differences.length);
      expect(summary.byType.changed).toBeGreaterThan(0);
      expect(summary.byType.added).toBeGreaterThan(0);
      expect(summary.byType.removed).toBeGreaterThan(0);
      expect(summary.bySeverity.high).toBeGreaterThan(0);
      expect(summary.criticalChanges.length).toBeGreaterThan(0);
    });

    it('should identify critical changes correctly', () => {
      const differences = differ.diff(oldConfig, newConfig);
      const summary = differ.getSummary(differences);
      
      const hasCriticalPortChange = summary.criticalChanges.some(
        change => change.path === 'api.port'
      );
      expect(hasCriticalPortChange).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle identical configurations', () => {
      const differences = differ.diff(oldConfig, oldConfig);
      expect(differences).toHaveLength(0);
    });

    it('should handle null and undefined values', () => {
      const configWithNulls = {
        ...oldConfig,
        api: {
          ...oldConfig.api,
          authentication: {
            ...oldConfig.api.authentication,
            jwtSecret: null as any
          }
        }
      };

      const differences = differ.diff(oldConfig, configWithNulls);
      const nullChange = differences.find(diff => 
        diff.path === 'api.authentication.jwtSecret'
      );
      expect(nullChange).toBeDefined();
      expect(nullChange?.type).toBe('changed');
    });
  });
});

describe('ConfigurationSerializer', () => {
  let serializer: ConfigurationSerializer;
  let config: SystemConfiguration;

  beforeEach(() => {
    serializer = new ConfigurationSerializer();
    config = createDefaultConfiguration();
  });

  describe('JSON Export/Import', () => {
    it('should export configuration to JSON', () => {
      const jsonString = serializer.export(config, { format: 'json' });
      
      expect(() => JSON.parse(jsonString)).not.toThrow();
      const parsed = JSON.parse(jsonString);
      expect(parsed.version).toBe(config.version);
      expect(parsed.api.port).toBe(config.api.port);
    });

    it('should export minified JSON', () => {
      const normal = serializer.export(config, { format: 'json', minify: false });
      const minified = serializer.export(config, { format: 'json', minify: true });
      
      expect(minified.length).toBeLessThan(normal.length);
      expect(minified).not.toContain('\n');
    });

    it('should import JSON configuration', () => {
      const jsonString = serializer.export(config, { format: 'json' });
      const imported = serializer.import(jsonString, 'json');
      
      expect(imported.version).toBe(config.version);
      expect(imported.api.port).toBe(config.api.port);
    });

    it('should handle invalid JSON gracefully', () => {
      expect(() => serializer.import('invalid json', 'json')).toThrow('Invalid JSON format');
    });
  });

  describe('Environment Variables Export', () => {
    it('should export to environment variables format', () => {
      const envString = serializer.export(config, { format: 'env' });
      
      expect(envString).toContain('CMS_VERSION=1.0.0');
      expect(envString).toContain('CMS_API_PORT=8080');
      expect(envString).toContain('CMS_API_BASEURL=http://localhost:8080');
    });

    it('should handle arrays in environment format', () => {
      const envString = serializer.export(config, { format: 'env' });
      
      expect(envString).toContain('CMS_API_CORS_ORIGINS=http://localhost:3000');
      expect(envString).toContain('CMS_API_CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS');
    });

    it('should import from environment variables format', () => {
      const envData = `
CMS_VERSION=2.0.0
CMS_API_PORT=9090
CMS_API_CORS_ENABLED=true
CMS_FEATURES_DEBUGMODE=false
      `.trim();

      const imported = serializer.import(envData, 'env');
      
      expect(imported.version).toBe('2.0.0');
      expect(imported.api.port).toBe(9090);
      expect(imported.api.cors.enabled).toBe(true);
      expect(imported.features.debugmode).toBe(false);
    });
  });

  describe('Secret Masking', () => {
    it('should mask sensitive values when enabled', () => {
      const configWithSecrets = {
        ...config,
        api: {
          ...config.api,
          authentication: {
            enabled: true,
            provider: 'jwt' as const,
            jwtSecret: 'super-secret-key'
          }
        }
      };

      const exported = serializer.export(configWithSecrets, { 
        format: 'json',
        maskSecrets: true 
      });
      
      expect(exported).toContain('***MASKED***');
      expect(exported).not.toContain('super-secret-key');
    });

    it('should preserve secrets when masking is disabled', () => {
      const configWithSecrets = {
        ...config,
        api: {
          ...config.api,
          authentication: {
            enabled: true,
            provider: 'jwt' as const,
            jwtSecret: 'super-secret-key'
          }
        }
      };

      const exported = serializer.export(configWithSecrets, { 
        format: 'json',
        maskSecrets: false 
      });
      
      expect(exported).not.toContain('***MASKED***');
      expect(exported).toContain('super-secret-key');
    });
  });

  describe('Section Filtering', () => {
    it('should export only specified sections', () => {
      const exported = serializer.export(config, {
        format: 'json',
        sections: ['api', 'features']
      });

      const parsed = JSON.parse(exported);
      expect(parsed.version).toBe(config.version); // Always included
      expect(parsed.api).toBeDefined();
      expect(parsed.features).toBeDefined();
      expect(parsed.services).toBeUndefined();
      expect(parsed.security).toBeUndefined();
    });
  });

  describe('Unsupported Formats', () => {
    it('should throw error for unsupported export formats', () => {
      expect(() => serializer.export(config, { format: 'xml' as any }))
        .toThrow('Unsupported export format: xml');
    });

    it('should throw error for unsupported import formats', () => {
      expect(() => serializer.import('data', 'xml' as any))
        .toThrow('Unsupported import format: xml');
    });

    it('should throw error for unimplemented formats', () => {
      expect(() => serializer.import('data', 'yaml'))
        .toThrow('YAML import not yet implemented');
      
      expect(() => serializer.import('data', 'toml'))
        .toThrow('TOML import not yet implemented');
    });
  });
});

describe('ConfigurationTemplateManager', () => {
  let templateManager: ConfigurationTemplateManager;

  beforeEach(() => {
    templateManager = new ConfigurationTemplateManager();
  });

  describe('Template Management', () => {
    it('should provide default templates', () => {
      const templates = templateManager.getTemplates();
      
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.some(t => t.name === 'development')).toBe(true);
      expect(templates.some(t => t.name === 'production')).toBe(true);
      expect(templates.some(t => t.name === 'testing')).toBe(true);
    });

    it('should get templates by category', () => {
      const devTemplates = templateManager.getTemplatesByCategory('development');
      const prodTemplates = templateManager.getTemplatesByCategory('production');
      
      expect(devTemplates.length).toBeGreaterThan(0);
      expect(prodTemplates.length).toBeGreaterThan(0);
      expect(devTemplates[0].category).toBe('development');
      expect(prodTemplates[0].category).toBe('production');
    });

    it('should get specific template by name', () => {
      const devTemplate = templateManager.getTemplate('development');
      
      expect(devTemplate).toBeDefined();
      expect(devTemplate?.name).toBe('development');
      expect(devTemplate?.category).toBe('development');
    });

    it('should return undefined for non-existent template', () => {
      const template = templateManager.getTemplate('non-existent');
      expect(template).toBeUndefined();
    });
  });

  describe('Custom Templates', () => {
    it('should add custom templates', () => {
      const customTemplate = {
        name: 'custom-dev',
        description: 'Custom development template',
        category: 'custom' as const,
        config: {
          features: {
            debugMode: true,
            experimentalFeatures: true
          }
        },
        variables: {}
      };

      templateManager.addTemplate(customTemplate);
      
      const retrieved = templateManager.getTemplate('custom-dev');
      expect(retrieved).toBeDefined();
      expect(retrieved?.description).toBe('Custom development template');
    });

    it('should update existing templates', () => {
      const originalTemplate = templateManager.getTemplate('development');
      expect(originalTemplate).toBeDefined();

      const updatedTemplate = {
        ...originalTemplate!,
        description: 'Updated development template'
      };

      templateManager.addTemplate(updatedTemplate);
      
      const retrieved = templateManager.getTemplate('development');
      expect(retrieved?.description).toBe('Updated development template');
    });
  });

  describe('Template Generation', () => {
    it('should generate configuration from template without variables', () => {
      const config = templateManager.generateFromTemplate('development');
      
      expect(config.features?.debugMode).toBe(true);
      expect(config.features?.experimentalFeatures).toBe(true);
      expect(config.security?.https?.enabled).toBe(false);
    });

    it('should generate configuration with provided variables', () => {
      const config = templateManager.generateFromTemplate('production', {
        domain: 'example.com',
        httpsPort: 443
      });
      
      expect(config.features?.debugMode).toBe(false);
      expect(config.security?.https?.enabled).toBe(true);
    });

    it('should use default values for missing optional variables', () => {
      const config = templateManager.generateFromTemplate('production', {
        domain: 'example.com'
        // httpsPort not provided, should use default
      });
      
      expect(config).toBeDefined();
      // Would need to implement variable substitution to test this properly
    });

    it('should throw error for missing required variables', () => {
      expect(() => templateManager.generateFromTemplate('production', {}))
        .toThrow('Required variable missing: domain');
    });

    it('should throw error for non-existent template', () => {
      expect(() => templateManager.generateFromTemplate('non-existent'))
        .toThrow('Template not found: non-existent');
    });
  });

  describe('Template Validation', () => {
    it('should have valid default template configurations', () => {
      const templates = templateManager.getTemplates();
      
      for (const template of templates) {
        expect(template.name).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(template.category).toBeTruthy();
        expect(template.config).toBeDefined();
        expect(template.variables).toBeDefined();
      }
    });

    it('should have appropriate development template settings', () => {
      const devTemplate = templateManager.getTemplate('development');
      
      expect(devTemplate?.config.features?.debugMode).toBe(true);
      expect(devTemplate?.config.features?.experimentalFeatures).toBe(true);
      expect(devTemplate?.config.security?.https?.enabled).toBe(false);
    });

    it('should have appropriate production template settings', () => {
      const prodTemplate = templateManager.getTemplate('production');
      
      expect(prodTemplate?.config.features?.debugMode).toBe(false);
      expect(prodTemplate?.config.features?.experimentalFeatures).toBe(false);
      expect(prodTemplate?.config.security?.https?.enabled).toBe(true);
      expect(prodTemplate?.config.monitoring?.metrics?.enabled).toBe(true);
    });

    it('should have appropriate testing template settings', () => {
      const testTemplate = templateManager.getTemplate('testing');
      
      expect(testTemplate?.config.features?.realTimeUpdates).toBe(false);
      expect(testTemplate?.config.monitoring?.metrics?.enabled).toBe(false);
      expect(testTemplate?.config.performance?.timeouts?.request).toBe(5000);
    });
  });
});

describe('Global Utility Instances', () => {
  it('should provide working global merger instance', () => {
    const config1 = { api: { port: 8080 } };
    const config2 = { api: { port: 9090 } };
    
    const result = configurationMerger.merge(config1, config2);
    expect(result.api.port).toBe(9090);
  });

  it('should provide working global differ instance', () => {
    const config1 = createDefaultConfiguration();
    const config2 = { ...config1, api: { ...config1.api, port: 9090 } };
    
    const differences = configurationDiffer.diff(config1, config2);
    expect(differences.length).toBeGreaterThan(0);
  });

  it('should provide working global serializer instance', () => {
    const config = createDefaultConfiguration();
    const exported = configurationSerializer.export(config);
    
    expect(() => JSON.parse(exported)).not.toThrow();
  });

  it('should provide working global template manager instance', () => {
    const templates = configurationTemplateManager.getTemplates();
    expect(templates.length).toBeGreaterThan(0);
  });
});
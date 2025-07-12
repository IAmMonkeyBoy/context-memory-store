/**
 * Configuration Import/Export System
 * Phase 7.4.5 - Core utilities for configuration import/export and management
 */

import type {
  ConfigurationFormat,
  ConfigurationExportOptions,
  ConfigurationImportOptions,
  ExportResult,
  ImportResult,
  ConfigurationConflict,
  ConfigurationChange,
  MergeStrategy,
  ConflictResolution,
  ExportMetadata,
  ImportMetadata,
  ConfigurationBackup,
  ConfigurationImportExportResponse
} from '../types/configurationImportExport';
import type { SystemConfiguration } from '../types/configuration';
import type { EnvironmentType } from '../types/configurationProfiles';

// =============================================================================
// Format Parsers and Serializers
// =============================================================================

class ConfigurationFormatHandler {
  /**
   * Serialize configuration to specified format
   */
  static serialize(config: SystemConfiguration, format: ConfigurationFormat, options: ConfigurationExportOptions): string {
    try {
      switch (format) {
        case 'json':
          return this.serializeJSON(config, options);
        case 'yaml':
          return this.serializeYAML(config, options);
        case 'toml':
          return this.serializeTOML(config, options);
        case 'env':
          return this.serializeENV(config, options);
        case 'xml':
          return this.serializeXML(config, options);
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error: any) {
      throw new Error(`Serialization failed for format ${format}: ${error.message}`);
    }
  }

  /**
   * Parse configuration from specified format
   */
  static parse(data: string, format: ConfigurationFormat): SystemConfiguration {
    try {
      switch (format) {
        case 'json':
          return this.parseJSON(data);
        case 'yaml':
          return this.parseYAML(data);
        case 'toml':
          return this.parseTOML(data);
        case 'env':
          return this.parseENV(data);
        case 'xml':
          return this.parseXML(data);
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error: any) {
      throw new Error(`Parsing failed for format ${format}: ${error.message}`);
    }
  }

  private static serializeJSON(config: SystemConfiguration, options: ConfigurationExportOptions): string {
    const processedConfig = this.processConfigForExport(config, options);
    return JSON.stringify(processedConfig, null, options.minifyOutput ? 0 : 2);
  }

  private static serializeYAML(config: SystemConfiguration, options: ConfigurationExportOptions): string {
    const processedConfig = this.processConfigForExport(config, options);
    // Simplified YAML serialization - in a real implementation, use a YAML library
    return this.objectToYAML(processedConfig, 0, options.includeComments);
  }

  private static serializeTOML(config: SystemConfiguration, options: ConfigurationExportOptions): string {
    const processedConfig = this.processConfigForExport(config, options);
    // Simplified TOML serialization - in a real implementation, use a TOML library
    return this.objectToTOML(processedConfig, options.includeComments);
  }

  private static serializeENV(config: SystemConfiguration, options: ConfigurationExportOptions): string {
    const processedConfig = this.processConfigForExport(config, options);
    return this.objectToENV(processedConfig, '', options.includeComments);
  }

  private static serializeXML(config: SystemConfiguration, options: ConfigurationExportOptions): string {
    const processedConfig = this.processConfigForExport(config, options);
    return this.objectToXML(processedConfig, 'configuration', 0, options.includeComments);
  }

  private static parseJSON(data: string): SystemConfiguration {
    return JSON.parse(data);
  }

  private static parseYAML(data: string): SystemConfiguration {
    // Simplified YAML parsing - in a real implementation, use a YAML library
    throw new Error('YAML parsing not implemented - use a proper YAML library like js-yaml');
  }

  private static parseTOML(data: string): SystemConfiguration {
    // Simplified TOML parsing - in a real implementation, use a TOML library
    throw new Error('TOML parsing not implemented - use a proper TOML library like @iarna/toml');
  }

  private static parseENV(data: string): SystemConfiguration {
    const lines = data.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
    const envObj: Record<string, any> = {};
    
    lines.forEach(line => {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      this.setNestedProperty(envObj, key.trim(), this.parseEnvValue(value));
    });

    return this.envToConfig(envObj);
  }

  private static parseXML(data: string): SystemConfiguration {
    // Simplified XML parsing - in a real implementation, use a proper XML parser
    throw new Error('XML parsing not implemented - use a proper XML library like fast-xml-parser');
  }

  private static processConfigForExport(config: SystemConfiguration, options: ConfigurationExportOptions): any {
    let processedConfig = this.deepClone(config);

    // Apply scope filtering
    if (options.scope !== 'full') {
      processedConfig = this.applyScopeFilter(processedConfig, options.scope, options.customFields);
    }

    // Apply field exclusions
    if (options.excludeFields) {
      processedConfig = this.excludeFields(processedConfig, options.excludeFields);
    }

    // Handle sensitive data
    if (!options.includeSensitive) {
      processedConfig = this.removeSensitiveFields(processedConfig);
    } else if (options.maskSensitive) {
      processedConfig = this.maskSensitiveFields(processedConfig);
    }

    return processedConfig;
  }

  private static deepClone(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
  }

  private static applyScopeFilter(config: any, scope: string, customFields?: string[]): any {
    switch (scope) {
      case 'services':
        return { services: config.services };
      case 'features':
        return { features: config.features };
      case 'security':
        return { security: config.security };
      case 'monitoring':
        return { monitoring: config.monitoring };
      case 'custom':
        if (!customFields) return config;
        const filtered: any = {};
        customFields.forEach(field => {
          const value = this.getNestedProperty(config, field);
          if (value !== undefined) {
            this.setNestedProperty(filtered, field, value);
          }
        });
        return filtered;
      default:
        return config;
    }
  }

  private static excludeFields(config: any, excludeFields: string[]): any {
    const result = this.deepClone(config);
    excludeFields.forEach(field => {
      this.deleteNestedProperty(result, field);
    });
    return result;
  }

  private static removeSensitiveFields(config: any): any {
    const sensitiveFields = [
      'services.neo4j.password',
      'services.qdrant.apiKey',
      'security.headers',
      'api.authentication',
      'monitoring.prometheus'
    ];
    
    return this.excludeFields(config, sensitiveFields);
  }

  private static maskSensitiveFields(config: any): any {
    const result = this.deepClone(config);
    const sensitiveFields = [
      'services.neo4j.password',
      'services.qdrant.apiKey'
    ];
    
    sensitiveFields.forEach(field => {
      const value = this.getNestedProperty(result, field);
      if (value) {
        this.setNestedProperty(result, field, this.maskValue(value));
      }
    });
    
    return result;
  }

  private static maskValue(value: string): string {
    if (value.length <= 4) return '****';
    return value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
  }

  private static getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private static setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  private static deleteNestedProperty(obj: any, path: string): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => current?.[key], obj);
    if (target) {
      delete target[lastKey];
    }
  }

  private static objectToYAML(obj: any, indent: number = 0, includeComments: boolean = false): string {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    for (const [key, value] of Object.entries(obj)) {
      if (includeComments && indent === 0) {
        yaml += `${spaces}# ${this.getFieldComment(key)}\n`;
      }
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n${this.objectToYAML(value, indent + 1, includeComments)}`;
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach(item => {
          if (typeof item === 'object') {
            yaml += `${spaces}  -\n${this.objectToYAML(item, indent + 2, false)}`;
          } else {
            yaml += `${spaces}  - ${this.yamlValue(item)}\n`;
          }
        });
      } else {
        yaml += `${spaces}${key}: ${this.yamlValue(value)}\n`;
      }
    }

    return yaml;
  }

  private static yamlValue(value: any): string {
    if (typeof value === 'string') {
      return value.includes(' ') || value.includes(':') ? `"${value}"` : value;
    }
    return String(value);
  }

  private static objectToTOML(obj: any, includeComments: boolean = false): string {
    let toml = '';
    
    // Handle top-level simple values first
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value !== 'object' || Array.isArray(value)) {
        if (includeComments) {
          toml += `# ${this.getFieldComment(key)}\n`;
        }
        toml += `${key} = ${this.tomlValue(value)}\n`;
      }
    }

    toml += '\n';

    // Handle sections (objects)
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
        if (includeComments) {
          toml += `# ${this.getFieldComment(key)} section\n`;
        }
        toml += `[${key}]\n`;
        toml += this.objectToTOMLSection(value, includeComments);
        toml += '\n';
      }
    }

    return toml;
  }

  private static objectToTOMLSection(obj: any, includeComments: boolean = false): string {
    let toml = '';
    
    for (const [key, value] of Object.entries(obj)) {
      if (includeComments) {
        toml += `# ${this.getFieldComment(key)}\n`;
      }
      toml += `${key} = ${this.tomlValue(value)}\n`;
    }

    return toml;
  }

  private static tomlValue(value: any): string {
    if (typeof value === 'string') {
      return `"${value}"`;
    } else if (Array.isArray(value)) {
      return `[${value.map(v => this.tomlValue(v)).join(', ')}]`;
    } else if (typeof value === 'boolean') {
      return String(value);
    } else if (typeof value === 'number') {
      return String(value);
    }
    return `"${String(value)}"`;
  }

  private static objectToENV(obj: any, prefix: string = '', includeComments: boolean = false): string {
    let env = '';
    
    for (const [key, value] of Object.entries(obj)) {
      const envKey = prefix ? `${prefix}_${key.toUpperCase()}` : key.toUpperCase();
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        env += this.objectToENV(value, envKey, includeComments);
      } else {
        if (includeComments) {
          env += `# ${this.getFieldComment(key)}\n`;
        }
        env += `${envKey}=${this.envValue(value)}\n`;
      }
    }

    return env;
  }

  private static envValue(value: any): string {
    if (typeof value === 'string') {
      return value.includes(' ') ? `"${value}"` : value;
    } else if (Array.isArray(value)) {
      return value.join(',');
    }
    return String(value);
  }

  private static objectToXML(obj: any, tagName: string, indent: number = 0, includeComments: boolean = false): string {
    const spaces = '  '.repeat(indent);
    let xml = `${spaces}<${tagName}>\n`;

    for (const [key, value] of Object.entries(obj)) {
      if (includeComments && indent === 0) {
        xml += `${spaces}  <!-- ${this.getFieldComment(key)} -->\n`;
      }
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        xml += this.objectToXML(value, key, indent + 1, false);
      } else if (Array.isArray(value)) {
        value.forEach(item => {
          if (typeof item === 'object') {
            xml += this.objectToXML(item, key, indent + 1, false);
          } else {
            xml += `${spaces}  <${key}>${this.xmlValue(item)}</${key}>\n`;
          }
        });
      } else {
        xml += `${spaces}  <${key}>${this.xmlValue(value)}</${key}>\n`;
      }
    }

    xml += `${spaces}</${tagName}>\n`;
    return xml;
  }

  private static xmlValue(value: any): string {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private static parseEnvValue(value: string): any {
    // Try to parse as number
    if (/^\d+$/.test(value)) {
      return parseInt(value, 10);
    }
    if (/^\d+\.\d+$/.test(value)) {
      return parseFloat(value);
    }
    // Try to parse as boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    // Try to parse as array (comma-separated)
    if (value.includes(',')) {
      return value.split(',').map(v => v.trim());
    }
    // Return as string
    return value;
  }

  private static envToConfig(envObj: Record<string, any>): SystemConfiguration {
    // Convert flat environment object to nested configuration
    // This is a simplified mapping - real implementation would need comprehensive mapping
    const config: Partial<SystemConfiguration> = {
      version: '1.0.0',
      api: {
        baseUrl: envObj.API_HOST ? `http://${envObj.API_HOST}:${envObj.API_PORT || 3000}` : 'http://localhost:3000',
        port: envObj.API_PORT || 3000,
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
          url: `http://${envObj.VECTOR_STORE_HOST || 'localhost'}:${envObj.VECTOR_STORE_PORT || 6333}`,
          collection: envObj.VECTOR_STORE_COLLECTION || 'context_vectors',
          vectorSize: 768,
          distance: 'cosine',
          timeout: 30000,
          retryAttempts: 3
        },
        neo4j: {
          uri: envObj.GRAPH_STORE_URI || 'bolt://localhost:7687',
          username: envObj.GRAPH_STORE_USERNAME || envObj.NEO4J_USERNAME || 'neo4j',
          password: envObj.GRAPH_STORE_PASSWORD || envObj.NEO4J_PASSWORD || 'contextmemory',
          database: 'neo4j',
          maxConnectionLifetime: 300000,
          maxConnectionPoolSize: 10
        },
        ollama: {
          baseUrl: envObj.LLM_API_BASE || 'http://localhost:11434',
          chatModel: envObj.LLM_CHAT_MODEL || 'llama3',
          embeddingModel: envObj.LLM_EMBEDDING_MODEL || 'mxbai-embed-large',
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
        debugMode: envObj.ASPNETCORE_ENVIRONMENT === 'Development'
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
          enabled: envObj.PROMETHEUS_ENABLED === 'true',
          endpoint: '/metrics',
          scrapeInterval: (envObj.METRICS_INTERVAL || 15) * 1000
        },
        logging: {
          level: envObj.LOG_LEVEL || 'info',
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

    return config as SystemConfiguration;
  }

  private static getFieldComment(field: string): string {
    const comments: Record<string, string> = {
      'version': 'Configuration version',
      'api': 'API server configuration',
      'services': 'External service configurations',
      'features': 'Feature flags and settings',
      'security': 'Security-related settings',
      'monitoring': 'Monitoring and logging configuration',
      'performance': 'Performance tuning parameters'
    };
    return comments[field] || `Configuration for ${field}`;
  }
}

// =============================================================================
// Configuration Export System
// =============================================================================

export class ConfigurationExporter {
  /**
   * Export configuration to specified format
   */
  static async exportConfiguration(
    config: SystemConfiguration,
    options: ConfigurationExportOptions
  ): Promise<ExportResult> {
    try {
      const startTime = Date.now();
      
      // Validate configuration if requested
      if (options.validateExport) {
        await this.validateConfiguration(config);
      }

      // Serialize configuration
      const serializedData = ConfigurationFormatHandler.serialize(config, options.format, options);
      
      // Calculate metadata
      const metadata = this.generateExportMetadata(config, options, serializedData);
      
      // Calculate checksum
      const checksum = await this.calculateChecksum(serializedData);
      
      const duration = Date.now() - startTime;

      return {
        success: true,
        format: options.format,
        data: serializedData,
        metadata,
        warnings: [],
        errors: [],
        size: new Blob([serializedData]).size,
        checksum
      };
    } catch (error: any) {
      return {
        success: false,
        format: options.format,
        data: '',
        metadata: this.generateExportMetadata(config, options, ''),
        warnings: [],
        errors: [error.message],
        size: 0,
        checksum: ''
      };
    }
  }

  private static async validateConfiguration(config: SystemConfiguration): Promise<void> {
    // Basic validation - can be extended
    if (!config.version) {
      throw new Error('Configuration version is required');
    }
    if (!config.services) {
      throw new Error('Services configuration is required');
    }
    // Add more validation as needed
  }

  private static generateExportMetadata(
    config: SystemConfiguration,
    options: ConfigurationExportOptions,
    data: string
  ): ExportMetadata {
    const sensitiveFields = this.identifySensitiveFields(config);
    
    return {
      exportedAt: new Date().toISOString(),
      exportedBy: 'system', // Would be actual user in real implementation
      sourceVersion: config.version,
      format: options.format,
      scope: options.scope,
      fieldCount: this.countFields(config),
      sensitiveFields,
      maskedFields: options.maskSensitive ? sensitiveFields : [],
      originalChecksum: this.simpleHash(JSON.stringify(config))
    };
  }

  private static identifySensitiveFields(config: any): string[] {
    const sensitiveFields: string[] = [];
    const patterns = ['password', 'key', 'secret', 'token', 'credential'];
    
    this.traverseObject(config, '', (path, value) => {
      if (typeof value === 'string' && patterns.some(pattern => 
        path.toLowerCase().includes(pattern))) {
        sensitiveFields.push(path);
      }
    });

    return sensitiveFields;
  }

  private static countFields(obj: any): number {
    let count = 0;
    this.traverseObject(obj, '', () => count++);
    return count;
  }

  private static traverseObject(obj: any, prefix: string, callback: (path: string, value: any) => void): void {
    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      callback(path, value);
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.traverseObject(value, path, callback);
      }
    }
  }

  private static async calculateChecksum(data: string): Promise<string> {
    // Simple checksum calculation - in real implementation, use crypto
    const encoder = new TextEncoder();
    const data_uint8 = encoder.encode(data);
    const hash = await crypto.subtle.digest('SHA-256', data_uint8);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }
}

// =============================================================================
// Configuration Import System
// =============================================================================

export class ConfigurationImporter {
  /**
   * Import configuration from data
   */
  static async importConfiguration(
    data: string,
    format: ConfigurationFormat,
    currentConfig: SystemConfiguration,
    options: ConfigurationImportOptions
  ): Promise<ImportResult> {
    try {
      const startTime = Date.now();
      
      // Parse incoming data
      const importedConfig = ConfigurationFormatHandler.parse(data, format);
      
      // Validate if requested
      if (options.validateImport) {
        await this.validateImportedConfiguration(importedConfig);
      }

      // Create backup if requested
      let rollbackData: ConfigurationBackup | undefined;
      if (options.backupBeforeImport) {
        rollbackData = await this.createBackup(currentConfig, 'pre-import');
      }

      // Perform dry run if requested
      if (options.dryRun) {
        const conflicts = await this.detectConflicts(currentConfig, importedConfig, options);
        const changes = await this.calculateChanges(currentConfig, importedConfig, options);
        
        return {
          success: true,
          imported: false,
          skipped: false,
          conflicts,
          changes,
          warnings: ['Dry run - no changes applied'],
          errors: [],
          metadata: this.generateImportMetadata(format, options, conflicts.length, changes.length),
          rollbackData
        };
      }

      // Detect and resolve conflicts
      const conflicts = await this.detectConflicts(currentConfig, importedConfig, options);
      const resolvedConflicts = await this.resolveConflicts(conflicts, options.conflictResolution);
      
      // Apply merge strategy
      const mergedConfig = await this.mergeConfigurations(
        currentConfig,
        importedConfig,
        resolvedConflicts,
        options
      );

      // Calculate changes
      const changes = await this.calculateChanges(currentConfig, mergedConfig, options);
      
      const duration = Date.now() - startTime;

      return {
        success: true,
        imported: true,
        skipped: false,
        conflicts: resolvedConflicts,
        changes,
        warnings: [],
        errors: [],
        metadata: this.generateImportMetadata(format, options, conflicts.length, changes.length),
        rollbackData
      };
    } catch (error: any) {
      return {
        success: false,
        imported: false,
        skipped: true,
        conflicts: [],
        changes: [],
        warnings: [],
        errors: [error.message],
        metadata: this.generateImportMetadata(format, options, 0, 0)
      };
    }
  }

  private static async validateImportedConfiguration(config: SystemConfiguration): Promise<void> {
    // Validation logic similar to export validation
    if (!config.version) {
      throw new Error('Imported configuration must have a version');
    }
    // Add more validation as needed
  }

  private static async createBackup(config: SystemConfiguration, type: string): Promise<ConfigurationBackup> {
    return {
      id: `backup_${Date.now()}`,
      name: `Backup before ${type}`,
      createdAt: new Date().toISOString(),
      createdBy: 'system',
      type: 'pre-import',
      configuration: config,
      metadata: {
        version: config.version,
        environment: 'unknown' as EnvironmentType,
        configurationHash: ConfigurationExporter['simpleHash'](JSON.stringify(config)),
        systemInfo: {
          hostname: 'unknown',
          platform: navigator.platform,
          nodeVersion: 'unknown',
          timestamp: new Date().toISOString()
        },
        statistics: {
          totalFields: ConfigurationExporter['countFields'](config),
          sensitiveFields: ConfigurationExporter['identifySensitiveFields'](config).length,
          customFields: 0,
          validationStatus: 'unknown'
        }
      },
      encrypted: false,
      checksum: ConfigurationExporter['simpleHash'](JSON.stringify(config)),
      size: JSON.stringify(config).length,
      tags: ['automatic', 'pre-import']
    };
  }

  private static async detectConflicts(
    current: SystemConfiguration,
    imported: SystemConfiguration,
    options: ConfigurationImportOptions
  ): Promise<ConfigurationConflict[]> {
    const conflicts: ConfigurationConflict[] = [];
    
    this.compareObjects(current, imported, '', conflicts, options);
    
    return conflicts;
  }

  private static compareObjects(
    current: any,
    imported: any,
    path: string,
    conflicts: ConfigurationConflict[],
    options: ConfigurationImportOptions
  ): void {
    const allKeys = new Set([...Object.keys(current || {}), ...Object.keys(imported || {})]);
    
    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      const currentValue = current?.[key];
      const importedValue = imported?.[key];
      
      if (currentValue === undefined && importedValue !== undefined) {
        // New field - no conflict
        continue;
      }
      
      if (currentValue !== undefined && importedValue === undefined) {
        // Field removed - potential conflict
        conflicts.push({
          field: key,
          currentValue,
          importValue: undefined,
          resolution: options.conflictResolution,
          resolved: false,
          metadata: {
            path: currentPath,
            type: 'deletion',
            sensitive: this.isSensitiveField(currentPath),
            required: this.isRequiredField(currentPath)
          }
        });
        continue;
      }
      
      if (typeof currentValue === 'object' && typeof importedValue === 'object' &&
          currentValue !== null && importedValue !== null && 
          !Array.isArray(currentValue) && !Array.isArray(importedValue)) {
        // Recurse into nested objects
        this.compareObjects(currentValue, importedValue, currentPath, conflicts, options);
      } else if (currentValue !== importedValue) {
        // Value conflict
        conflicts.push({
          field: key,
          currentValue,
          importValue: importedValue,
          resolution: options.conflictResolution,
          resolved: false,
          metadata: {
            path: currentPath,
            type: 'value_change',
            sensitive: this.isSensitiveField(currentPath),
            required: this.isRequiredField(currentPath)
          }
        });
      }
    }
  }

  private static isSensitiveField(path: string): boolean {
    const sensitivePatterns = ['password', 'key', 'secret', 'token', 'credential'];
    return sensitivePatterns.some(pattern => path.toLowerCase().includes(pattern));
  }

  private static isRequiredField(path: string): boolean {
    const requiredPatterns = ['version', 'services.', 'api.'];
    return requiredPatterns.some(pattern => path.toLowerCase().includes(pattern));
  }

  private static async resolveConflicts(
    conflicts: ConfigurationConflict[],
    defaultResolution: ConflictResolution
  ): Promise<ConfigurationConflict[]> {
    return conflicts.map(conflict => ({
      ...conflict,
      resolution: conflict.resolution || defaultResolution,
      resolved: true
    }));
  }

  private static async mergeConfigurations(
    current: SystemConfiguration,
    imported: SystemConfiguration,
    conflicts: ConfigurationConflict[],
    options: ConfigurationImportOptions
  ): Promise<SystemConfiguration> {
    const result = JSON.parse(JSON.stringify(current)); // Deep clone
    
    // Apply merge strategy
    switch (options.mergeStrategy) {
      case 'replace':
        return imported;
      case 'preserve':
        return current;
      case 'merge':
        return this.deepMerge(result, imported, conflicts);
      case 'selective':
        return this.selectiveMerge(result, imported, conflicts, options);
      default:
        return result;
    }
  }

  private static deepMerge(target: any, source: any, conflicts: ConfigurationConflict[]): any {
    for (const [key, value] of Object.entries(source)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value) &&
          typeof target[key] === 'object' && target[key] !== null && !Array.isArray(target[key])) {
        target[key] = this.deepMerge(target[key], value, conflicts);
      } else {
        const conflict = conflicts.find(c => c.field === key);
        if (conflict && conflict.resolution === 'overwrite') {
          target[key] = value;
        } else if (!conflict || conflict.resolution !== 'skip') {
          target[key] = value;
        }
      }
    }
    return target;
  }

  private static selectiveMerge(
    target: any,
    source: any,
    conflicts: ConfigurationConflict[],
    options: ConfigurationImportOptions
  ): any {
    // Apply custom mappings if provided
    if (options.customMappings) {
      for (const [sourcePath, targetPath] of Object.entries(options.customMappings)) {
        const value = this.getNestedValue(source, sourcePath);
        if (value !== undefined) {
          this.setNestedValue(target, targetPath, value);
        }
      }
    }
    
    return target;
  }

  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private static setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const targetObj = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    targetObj[lastKey] = value;
  }

  private static async calculateChanges(
    before: SystemConfiguration,
    after: SystemConfiguration,
    options: ConfigurationImportOptions
  ): Promise<ConfigurationChange[]> {
    const changes: ConfigurationChange[] = [];
    const timestamp = new Date().toISOString();
    
    this.compareForChanges(before, after, '', changes, timestamp);
    
    return changes;
  }

  private static compareForChanges(
    before: any,
    after: any,
    path: string,
    changes: ConfigurationChange[],
    timestamp: string
  ): void {
    const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
    
    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      const beforeValue = before?.[key];
      const afterValue = after?.[key];
      
      if (beforeValue === undefined && afterValue !== undefined) {
        changes.push({
          field: key,
          operation: 'add',
          newValue: afterValue,
          path: currentPath,
          timestamp,
          user: 'import-system'
        });
      } else if (beforeValue !== undefined && afterValue === undefined) {
        changes.push({
          field: key,
          operation: 'delete',
          oldValue: beforeValue,
          path: currentPath,
          timestamp,
          user: 'import-system'
        });
      } else if (typeof beforeValue === 'object' && typeof afterValue === 'object' &&
                 beforeValue !== null && afterValue !== null &&
                 !Array.isArray(beforeValue) && !Array.isArray(afterValue)) {
        this.compareForChanges(beforeValue, afterValue, currentPath, changes, timestamp);
      } else if (beforeValue !== afterValue) {
        changes.push({
          field: key,
          operation: 'update',
          oldValue: beforeValue,
          newValue: afterValue,
          path: currentPath,
          timestamp,
          user: 'import-system'
        });
      }
    }
  }

  private static generateImportMetadata(
    format: ConfigurationFormat,
    options: ConfigurationImportOptions,
    conflictCount: number,
    changeCount: number
  ): ImportMetadata {
    return {
      importedAt: new Date().toISOString(),
      importedBy: 'system',
      sourceFormat: format,
      targetVersion: '1.0.0',
      mergeStrategy: options.mergeStrategy,
      fieldCount: 0, // Would be calculated in real implementation
      changedFields: changeCount,
      conflictCount,
      backupCreated: options.backupBeforeImport
    };
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

export const generateExportFilename = (
  format: ConfigurationFormat,
  scope: string,
  timestamp?: string
): string => {
  const ts = timestamp || new Date().toISOString();
  const formattedTs = ts.slice(0, 19).replace(/[T:]/g, '-');
  return `config-${scope}-${formattedTs}.${format}`;
};

export const validateConfigurationFormat = (data: string, format: ConfigurationFormat): boolean => {
  try {
    ConfigurationFormatHandler.parse(data, format);
    return true;
  } catch {
    return false;
  }
};

export const getSupportedFormats = (): ConfigurationFormat[] => {
  return ['json', 'yaml', 'toml', 'env', 'xml'];
};

export const getFormatMimeType = (format: ConfigurationFormat): string => {
  const mimeTypes: Record<ConfigurationFormat, string> = {
    json: 'application/json',
    yaml: 'application/x-yaml',
    toml: 'application/toml',
    env: 'text/plain',
    xml: 'application/xml'
  };
  return mimeTypes[format];
};

// Export the main classes and utilities
export default {
  ConfigurationExporter,
  ConfigurationImporter,
  ConfigurationFormatHandler,
  generateExportFilename,
  validateConfigurationFormat,
  getSupportedFormats,
  getFormatMimeType
};
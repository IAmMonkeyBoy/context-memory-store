/**
 * Configuration Utilities
 * Phase 7.4.1 - Utilities for configuration management (merging, diffing, serialization, migration)
 */

import type { SystemConfiguration } from '../types/configuration';

// =============================================================================
// Configuration Utility Types
// =============================================================================

export interface ConfigurationDiff {
  path: string;
  type: 'added' | 'removed' | 'changed';
  oldValue?: any;
  newValue?: any;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface ConfigurationMergeOptions {
  /** Whether to merge arrays or replace them */
  mergeArrays: boolean;
  /** Whether to preserve null values */
  preserveNulls: boolean;
  /** Whether to validate the result after merging */
  validate: boolean;
  /** Paths to exclude from merging */
  excludePaths: string[];
  /** Custom merge strategies for specific paths */
  customStrategies: Record<string, (target: any, source: any) => any>;
}

export interface ConfigurationExportOptions {
  /** Export format */
  format: 'json' | 'yaml' | 'toml' | 'env';
  /** Whether to include comments */
  includeComments: boolean;
  /** Whether to include default values */
  includeDefaults: boolean;
  /** Whether to minify the output */
  minify: boolean;
  /** Sections to include in export */
  sections?: string[];
  /** Whether to mask sensitive values */
  maskSecrets: boolean;
}

export interface ConfigurationImportOptions {
  /** Whether to validate during import */
  validate: boolean;
  /** Whether to merge with existing configuration */
  merge: boolean;
  /** Merge options if merging */
  mergeOptions?: Partial<ConfigurationMergeOptions>;
  /** Whether to apply migrations */
  applyMigrations: boolean;
  /** Target version for migrations */
  targetVersion?: string;
}

export interface ConfigurationTemplate {
  name: string;
  description: string;
  category: 'development' | 'staging' | 'production' | 'testing' | 'custom';
  config: Partial<SystemConfiguration>;
  variables: Record<string, {
    description: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    required: boolean;
    default?: any;
    validation?: RegExp;
  }>;
}

// =============================================================================
// Configuration Merging Utilities
// =============================================================================

export class ConfigurationMerger {
  private readonly defaultOptions: ConfigurationMergeOptions = {
    mergeArrays: true,
    preserveNulls: false,
    validate: true,
    excludePaths: [],
    customStrategies: {}
  };

  /**
   * Ensure we have a complete configuration structure
   */
  private ensureCompleteConfiguration(config: Partial<SystemConfiguration>): SystemConfiguration {
    // Create a minimal default configuration to avoid circular dependency
    const defaultConfig: SystemConfiguration = {
      version: '1.0.0',
      api: {
        baseUrl: 'http://localhost:8080',
        port: 8080,
        cors: { enabled: true, origins: [], methods: [], allowedHeaders: [], credentials: false, maxAge: 3600 },
        rateLimiting: { enabled: false, requestsPerMinute: 100, burstLimit: 20, windowMs: 60000, skipSuccessfulRequests: false, skipFailedRequests: false, message: '' },
        authentication: { enabled: false, provider: 'none' },
        swagger: { enabled: true, path: '/swagger', title: 'API', version: '1.0.0', description: '' },
        compression: { enabled: true, level: 6, threshold: 1024, algorithm: 'gzip' },
        staticFiles: { enabled: true, root: 'wwwroot', index: 'index.html', maxAge: 3600, etag: true }
      } as any,
      services: {
        qdrant: { url: 'http://localhost:6333', collection: 'default', vectorSize: 768, distance: 'cosine', timeout: 30000, retryAttempts: 3, retryDelay: 1000, healthCheckInterval: 30, connectionPool: { maxConnections: 10, idleTimeout: 300000 } },
        neo4j: { uri: 'bolt://localhost:7687', username: 'neo4j', password: 'password', database: 'neo4j', maxConnectionLifetime: 3600000, maxConnectionPoolSize: 50, connectionAcquisitionTimeout: 60000, healthCheckInterval: 30, encrypted: false, trustStrategy: 'TRUST_ALL_CERTIFICATES' },
        ollama: { baseUrl: 'http://localhost:11434', chatModel: 'llama3', embeddingModel: 'mxbai-embed-large', timeout: 120000, maxRetries: 3, retryDelay: 2000, streamingEnabled: true, keepAlive: '5m', temperature: 0.7, topP: 0.9, topK: 40, contextWindow: 4096, models: { chat: ['llama3'], embedding: ['mxbai-embed-large'] } }
      },
      features: {
        realTimeUpdates: true, advancedAnalytics: false, experimentalFeatures: false, debugMode: false,
        batchProcessing: { enabled: true, batchSize: 100, maxConcurrency: 5, queueTimeout: 300000, retries: { maxAttempts: 3, delay: 1000, backoffMultiplier: 2 } },
        caching: { enabled: true, ttl: 3600, maxSize: 104857600, strategy: 'lru', layers: { memory: { enabled: true, maxEntries: 10000, ttl: 3600 } } },
        search: { fuzzySearch: true, maxResults: 100, relevanceThreshold: 0.5, indexing: { autoIndex: true, updateInterval: 300, maxSizeMb: 1024 } },
        streaming: { enabled: true, maxConcurrentStreams: 10, timeout: 300000, bufferSize: 8192, heartbeatInterval: 30 }
      },
      security: {
        https: { enabled: false, redirectHttp: false, minTlsVersion: '1.2' },
        headers: { contentSecurityPolicy: "default-src 'self'", strictTransportSecurity: 'max-age=31536000', xFrameOptions: 'DENY', xContentTypeOptions: 'nosniff', referrerPolicy: 'strict-origin-when-cross-origin', xXssProtection: '1; mode=block' },
        dataProtection: { hashSaltRounds: 12, cookieSecure: false, cookieSameSite: 'lax', dataRetentionDays: 365 },
        validation: { strictMode: false, maxRequestSize: 10485760, maxUrlLength: 2048, allowedFileTypes: ['.txt', '.md'], maxFileSize: 52428800 },
        audit: { enabled: false, events: [], retentionDays: 90, includeRequestBodies: false, includeResponseBodies: false }
      },
      monitoring: {
        logging: { level: 'info', format: 'json', outputs: [{ type: 'console', config: {} }], includeTimestamp: true, includeStackTrace: true, rotation: { enabled: false, maxSizeMb: 100, maxFiles: 10, interval: 'daily' } },
        metrics: { enabled: true, format: 'prometheus', endpoint: '/metrics', interval: 15, custom: [] },
        alerting: { enabled: false, channels: [], rules: [] },
        healthChecks: { enabled: true, interval: 30, timeout: 5000, services: [] },
        tracing: { enabled: false, provider: 'jaeger', endpoint: 'http://localhost:14268/api/traces', samplingRate: 0.1, serviceName: 'context-memory-store' }
      },
      performance: {
        timeouts: { request: 30000, connection: 5000, keepAlive: 60000, header: 10000, body: 30000 },
        connectionPools: { maxConnections: 100, minConnections: 10, idleTimeout: 300000, acquisitionTimeout: 30000, validateConnections: true },
        resourceLimits: { maxMemoryMb: 2048, maxCpuPercent: 80, maxConcurrentRequests: 1000, maxRequestQueueSize: 10000, maxFileDescriptors: 65536 },
        optimization: { http2Enabled: false, keepAliveEnabled: true, pipeliningEnabled: false, compressionEnabled: true, staticFileCachingEnabled: true, gc: { strategy: 'adaptive', heapSizeMb: 1024 } }
      }
    };
    
    return this.deepMerge(defaultConfig, config, this.defaultOptions, '') as SystemConfiguration;
  }

  /**
   * Deep merge two configuration objects
   */
  merge(
    target: Partial<SystemConfiguration>,
    source: Partial<SystemConfiguration>,
    options: Partial<ConfigurationMergeOptions> = {}
  ): SystemConfiguration {
    const opts = { ...this.defaultOptions, ...options };
    
    // Ensure we have a base configuration to start with
    const baseConfig = this.ensureCompleteConfiguration(target);
    const result = this.deepMerge(baseConfig, source, opts, '');
    
    if (opts.validate) {
      // TODO: Add validation here when validator is available
      console.log('Validation would be performed here');
    }
    
    return result as SystemConfiguration;
  }

  /**
   * Merge multiple configurations in order
   */
  mergeMultiple(
    configs: Partial<SystemConfiguration>[],
    options: Partial<ConfigurationMergeOptions> = {}
  ): SystemConfiguration {
    if (configs.length === 0) {
      throw new Error('At least one configuration must be provided');
    }

    return configs.reduce((result, config) => 
      this.merge(result, config, options)
    ) as SystemConfiguration;
  }

  /**
   * Deep merge implementation
   */
  private deepMerge(
    target: any,
    source: any,
    options: ConfigurationMergeOptions,
    currentPath: string
  ): any {
    // Check if path should be excluded
    if (options.excludePaths.some(path => currentPath.startsWith(path))) {
      return target;
    }

    // Check for custom strategy
    const customStrategy = options.customStrategies[currentPath];
    if (customStrategy) {
      return customStrategy(target, source);
    }

    // Handle null/undefined values
    if (source === null) {
      return options.preserveNulls ? null : target;
    }
    if (source === undefined) {
      return target;
    }
    if (target === null || target === undefined) {
      return source;
    }

    // Handle primitive types
    if (typeof source !== 'object' || typeof target !== 'object') {
      return source;
    }

    // Handle arrays
    if (Array.isArray(source)) {
      if (!Array.isArray(target)) {
        return source;
      }
      
      if (options.mergeArrays) {
        // Merge arrays by concatenating and removing duplicates
        const merged = [...target, ...source];
        return Array.from(new Set(merged.map(item => 
          typeof item === 'object' ? JSON.stringify(item) : item
        ))).map(item => {
          try {
            return JSON.parse(item);
          } catch {
            return item;
          }
        });
      } else {
        return source;
      }
    }

    // Handle objects
    const result = { ...target };
    
    for (const [key, value] of Object.entries(source)) {
      const newPath = currentPath ? `${currentPath}.${key}` : key;
      result[key] = this.deepMerge(target[key], value, options, newPath);
    }

    return result;
  }

  /**
   * Apply configuration inheritance
   */
  applyInheritance(
    config: Partial<SystemConfiguration>,
    baseConfig: Partial<SystemConfiguration>
  ): SystemConfiguration {
    return this.merge(baseConfig, config, {
      mergeArrays: false, // Child arrays replace parent arrays
      preserveNulls: true,
      validate: true,
      excludePaths: [],
      customStrategies: {
        // Custom strategies for specific configuration sections
        'api.cors.origins': (target, source) => source || target,
        'services': (target, source) => ({ ...target, ...source }),
        'security.headers': (target, source) => ({ ...target, ...source })
      }
    });
  }
}

// =============================================================================
// Configuration Diffing Utilities
// =============================================================================

export class ConfigurationDiffer {
  /**
   * Compare two configurations and return differences
   */
  diff(
    oldConfig: SystemConfiguration,
    newConfig: SystemConfiguration
  ): ConfigurationDiff[] {
    const differences: ConfigurationDiff[] = [];
    
    this.deepDiff(oldConfig, newConfig, '', differences);
    
    return differences.sort((a, b) => {
      // Sort by severity (high -> medium -> low) then by path
      const severityOrder = { high: 3, medium: 2, low: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      return severityDiff !== 0 ? severityDiff : a.path.localeCompare(b.path);
    });
  }

  /**
   * Get a summary of configuration changes
   */
  getSummary(differences: ConfigurationDiff[]): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    criticalChanges: ConfigurationDiff[];
  } {
    const byType = differences.reduce((acc, diff) => {
      acc[diff.type] = (acc[diff.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySeverity = differences.reduce((acc, diff) => {
      acc[diff.severity] = (acc[diff.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const criticalChanges = differences.filter(diff => 
      diff.severity === 'high' || this.isCriticalPath(diff.path)
    );

    return {
      total: differences.length,
      byType,
      bySeverity,
      criticalChanges
    };
  }

  /**
   * Deep diff implementation
   */
  private deepDiff(
    oldValue: any,
    newValue: any,
    path: string,
    differences: ConfigurationDiff[]
  ): void {
    // Handle null/undefined cases
    if (oldValue === undefined && newValue !== undefined) {
      differences.push({
        path,
        type: 'added',
        newValue,
        severity: this.getSeverityForPath(path),
        description: `Added ${path} with value: ${this.formatValue(newValue)}`
      });
      return;
    }

    if (oldValue !== undefined && newValue === undefined) {
      differences.push({
        path,
        type: 'removed',
        oldValue,
        severity: this.getSeverityForPath(path),
        description: `Removed ${path} (was: ${this.formatValue(oldValue)})`
      });
      return;
    }

    if (oldValue === newValue) {
      return;
    }

    // Handle primitive type changes
    if (
      typeof oldValue !== 'object' || 
      typeof newValue !== 'object' ||
      oldValue === null ||
      newValue === null
    ) {
      differences.push({
        path,
        type: 'changed',
        oldValue,
        newValue,
        severity: this.getSeverityForPath(path),
        description: `Changed ${path} from ${this.formatValue(oldValue)} to ${this.formatValue(newValue)}`
      });
      return;
    }

    // Handle array changes
    if (Array.isArray(oldValue) || Array.isArray(newValue)) {
      if (!Array.isArray(oldValue) || !Array.isArray(newValue)) {
        differences.push({
          path,
          type: 'changed',
          oldValue,
          newValue,
          severity: this.getSeverityForPath(path),
          description: `Changed ${path} type from ${typeof oldValue} to ${typeof newValue}`
        });
        return;
      }

      // Compare array contents
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        differences.push({
          path,
          type: 'changed',
          oldValue,
          newValue,
          severity: this.getSeverityForPath(path),
          description: `Modified array ${path} (${oldValue.length} -> ${newValue.length} items)`
        });
      }
      return;
    }

    // Handle object changes
    const allKeys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);
    
    for (const key of allKeys) {
      const newPath = path ? `${path}.${key}` : key;
      this.deepDiff(oldValue[key], newValue[key], newPath, differences);
    }
  }

  /**
   * Determine severity for a configuration path
   */
  private getSeverityForPath(path: string): 'low' | 'medium' | 'high' {
    // High severity paths (security, critical services)
    if (path.includes('security') || 
        path.includes('authentication') || 
        path.includes('password') ||
        path.includes('secret') ||
        path.includes('key') ||
        path.startsWith('services.')) {
      return 'high';
    }

    // Medium severity paths (performance, monitoring)
    if (path.includes('performance') ||
        path.includes('monitoring') ||
        path.includes('timeout') ||
        path.includes('limit')) {
      return 'medium';
    }

    // Low severity (features, UI settings)
    return 'low';
  }

  /**
   * Check if a path is critical
   */
  private isCriticalPath(path: string): boolean {
    const criticalPaths = [
      'api.port',
      'api.baseUrl',
      'services.qdrant.url',
      'services.neo4j.uri',
      'services.ollama.baseUrl',
      'security.https.enabled',
      'api.authentication.enabled'
    ];

    return criticalPaths.some(criticalPath => path === criticalPath);
  }

  /**
   * Format a value for display
   */
  private formatValue(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') {
      if (Array.isArray(value)) return `[${value.length} items]`;
      return `{${Object.keys(value).length} properties}`;
    }
    return String(value);
  }
}

// =============================================================================
// Configuration Serialization Utilities
// =============================================================================

export class ConfigurationSerializer {
  /**
   * Export configuration to various formats
   */
  export(
    config: SystemConfiguration,
    options: Partial<ConfigurationExportOptions> = {}
  ): string {
    const opts: ConfigurationExportOptions = {
      format: 'json',
      includeComments: false,
      includeDefaults: true,
      minify: false,
      maskSecrets: true,
      ...options
    };

    let processedConfig = this.processForExport(config, opts);

    switch (opts.format) {
      case 'json':
        return this.exportJson(processedConfig, opts);
      case 'yaml':
        return this.exportYaml(processedConfig, opts);
      case 'toml':
        return this.exportToml(processedConfig, opts);
      case 'env':
        return this.exportEnv(processedConfig, opts);
      default:
        throw new Error(`Unsupported export format: ${opts.format}`);
    }
  }

  /**
   * Import configuration from various formats
   */
  import(
    data: string,
    format: 'json' | 'yaml' | 'toml' | 'env',
    options: Partial<ConfigurationImportOptions> = {}
  ): SystemConfiguration {
    const opts: ConfigurationImportOptions = {
      validate: true,
      merge: false,
      applyMigrations: true,
      ...options
    };

    let parsed: any;

    switch (format) {
      case 'json':
        parsed = this.importJson(data);
        break;
      case 'yaml':
        parsed = this.importYaml(data);
        break;
      case 'toml':
        parsed = this.importToml(data);
        break;
      case 'env':
        parsed = this.importEnv(data);
        break;
      default:
        throw new Error(`Unsupported import format: ${format}`);
    }

    if (opts.validate) {
      // TODO: Add validation here
      console.log('Validation would be performed here');
    }

    if (opts.applyMigrations) {
      // TODO: Add migration logic
      console.log('Migration would be performed here');
    }

    return parsed;
  }

  /**
   * Process configuration for export
   */
  private processForExport(
    config: SystemConfiguration,
    options: ConfigurationExportOptions
  ): any {
    let processed = JSON.parse(JSON.stringify(config));

    // Filter sections if specified
    if (options.sections && options.sections.length > 0) {
      const filtered: any = { version: processed.version };
      for (const section of options.sections) {
        if (processed[section]) {
          filtered[section] = processed[section];
        }
      }
      processed = filtered;
    }

    // Mask secrets if enabled
    if (options.maskSecrets) {
      processed = this.maskSecrets(processed);
    }

    return processed;
  }

  /**
   * Mask sensitive values in configuration
   */
  private maskSecrets(config: any, path: string = ''): any {
    if (typeof config !== 'object' || config === null) {
      return config;
    }

    if (Array.isArray(config)) {
      return config.map((item, index) => 
        this.maskSecrets(item, `${path}[${index}]`)
      );
    }

    const result: any = {};
    
    for (const [key, value] of Object.entries(config)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (this.isSensitiveField(key, currentPath)) {
        result[key] = '***MASKED***';
      } else {
        result[key] = this.maskSecrets(value, currentPath);
      }
    }

    return result;
  }

  /**
   * Check if a field contains sensitive data
   */
  private isSensitiveField(key: string, path: string): boolean {
    const sensitiveKeys = [
      'password', 'secret', 'key', 'token', 'apiKey',
      'jwtSecret', 'encryptionKey', 'sessionSecret',
      'clientSecret', 'privateKey'
    ];

    const sensitivePaths = [
      'api.authentication.jwtSecret',
      'api.authentication.oauth.clientSecret',
      'api.authentication.apiKey.validKeys',
      'services.neo4j.password',
      'services.qdrant.apiKey',
      'security.dataProtection.encryptionKey',
      'security.dataProtection.sessionSecret'
    ];

    return sensitiveKeys.some(sensitive => 
      key.toLowerCase().includes(sensitive.toLowerCase())
    ) || sensitivePaths.includes(path);
  }

  /**
   * Export to JSON format
   */
  private exportJson(config: any, options: ConfigurationExportOptions): string {
    if (options.minify) {
      return JSON.stringify(config);
    }

    return JSON.stringify(config, null, 2);
  }

  /**
   * Export to YAML format (placeholder implementation)
   */
  private exportYaml(config: any, options: ConfigurationExportOptions): string {
    // This would require a YAML library like js-yaml
    // For now, return a JSON representation with YAML-like comments
    const json = JSON.stringify(config, null, 2);
    const lines = json.split('\n');
    
    return lines.map(line => {
      // Convert JSON syntax to YAML-like syntax
      return line
        .replace(/^\s*"([^"]+)":\s*/, '$1: ')
        .replace(/,\s*$/, '');
    }).join('\n');
  }

  /**
   * Export to TOML format (placeholder implementation)
   */
  private exportToml(config: any, options: ConfigurationExportOptions): string {
    // This would require a TOML library
    // For now, return a simplified TOML-like format
    const lines: string[] = [];
    
    const processSection = (obj: any, prefix: string = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
          lines.push(`[${fullKey}]`);
          processSection(value, fullKey);
        } else {
          lines.push(`${key} = ${JSON.stringify(value)}`);
        }
      }
    };

    processSection(config);
    return lines.join('\n');
  }

  /**
   * Export to environment variables format
   */
  private exportEnv(config: any, options: ConfigurationExportOptions): string {
    const envVars: string[] = [];
    
    const flatten = (obj: any, prefix: string = 'CMS') => {
      for (const [key, value] of Object.entries(obj)) {
        const envKey = `${prefix}_${key.toUpperCase()}`;
        
        if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
          flatten(value, envKey);
        } else {
          const envValue = Array.isArray(value) 
            ? value.join(',') 
            : String(value);
          envVars.push(`${envKey}=${envValue}`);
        }
      }
    };

    flatten(config);
    return envVars.sort().join('\n');
  }

  /**
   * Import from JSON format
   */
  private importJson(data: string): any {
    try {
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error}`);
    }
  }

  /**
   * Import from YAML format (placeholder)
   */
  private importYaml(data: string): any {
    // This would require a YAML parser
    throw new Error('YAML import not yet implemented');
  }

  /**
   * Import from TOML format (placeholder)
   */
  private importToml(data: string): any {
    // This would require a TOML parser
    throw new Error('TOML import not yet implemented');
  }

  /**
   * Import from environment variables format
   */
  private importEnv(data: string): any {
    const config: any = {};
    const lines = data.split('\n').filter(line => 
      line.trim() && !line.trim().startsWith('#')
    );

    for (const line of lines) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=');
      
      if (key && value !== undefined) {
        this.setNestedValue(config, key, value);
      }
    }

    return config;
  }

  /**
   * Set a nested value in an object using a dot-separated key
   */
  private setNestedValue(obj: any, key: string, value: string): void {
    const parts = key.toLowerCase().split('_').slice(1); // Remove CMS prefix
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }

    const finalKey = parts[parts.length - 1];
    
    // Try to parse as JSON, fallback to string
    try {
      current[finalKey] = JSON.parse(value);
    } catch {
      // Handle comma-separated arrays
      if (value.includes(',')) {
        current[finalKey] = value.split(',').map(v => v.trim());
      } else {
        current[finalKey] = value;
      }
    }
  }
}

// =============================================================================
// Configuration Templates
// =============================================================================

export class ConfigurationTemplateManager {
  private templates: ConfigurationTemplate[] = [];

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Get all available templates
   */
  getTemplates(): ConfigurationTemplate[] {
    return [...this.templates];
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: ConfigurationTemplate['category']): ConfigurationTemplate[] {
    return this.templates.filter(template => template.category === category);
  }

  /**
   * Get a specific template by name
   */
  getTemplate(name: string): ConfigurationTemplate | undefined {
    return this.templates.find(template => template.name === name);
  }

  /**
   * Add a custom template
   */
  addTemplate(template: ConfigurationTemplate): void {
    const existingIndex = this.templates.findIndex(t => t.name === template.name);
    if (existingIndex >= 0) {
      this.templates[existingIndex] = template;
    } else {
      this.templates.push(template);
    }
  }

  /**
   * Generate configuration from template
   */
  generateFromTemplate(
    templateName: string,
    variables: Record<string, any> = {}
  ): Partial<SystemConfiguration> {
    const template = this.getTemplate(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    // Validate required variables
    for (const [varName, varConfig] of Object.entries(template.variables)) {
      if (varConfig.required && !(varName in variables)) {
        throw new Error(`Required variable missing: ${varName}`);
      }
    }

    // Process template with variables
    const configStr = JSON.stringify(template.config);
    const processedStr = configStr.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      if (varName in variables) {
        return JSON.stringify(variables[varName]);
      }
      
      const varConfig = template.variables[varName];
      if (varConfig?.default !== undefined) {
        return JSON.stringify(varConfig.default);
      }
      
      throw new Error(`Variable not provided and no default: ${varName}`);
    });

    return JSON.parse(processedStr);
  }

  /**
   * Initialize default templates
   */
  private initializeDefaultTemplates(): void {
    this.templates = [
      {
        name: 'development',
        description: 'Development environment with debugging enabled',
        category: 'development',
        config: {
          features: {
            debugMode: true,
            experimentalFeatures: true,
            realTimeUpdates: true,
            advancedAnalytics: false
          },
          security: {
            https: { enabled: false },
            dataProtection: { cookieSecure: false }
          },
          monitoring: {
            logging: { level: 'debug' as const }
          }
        },
        variables: {}
      },
      {
        name: 'production',
        description: 'Production environment with security and performance optimizations',
        category: 'production',
        config: {
          features: {
            debugMode: false,
            experimentalFeatures: false,
            realTimeUpdates: true,
            advancedAnalytics: true
          },
          security: {
            https: { enabled: true },
            dataProtection: { cookieSecure: true }
          },
          monitoring: {
            logging: { level: 'warn' as const },
            metrics: { enabled: true },
            alerting: { enabled: true }
          },
          performance: {
            optimization: {
              compressionEnabled: true,
              staticFileCachingEnabled: true,
              http2Enabled: true
            }
          }
        },
        variables: {
          domain: {
            description: 'Production domain name',
            type: 'string',
            required: true
          },
          httpsPort: {
            description: 'HTTPS port number',
            type: 'number',
            required: false,
            default: 443
          }
        }
      },
      {
        name: 'testing',
        description: 'Testing environment with fast startup and minimal logging',
        category: 'testing',
        config: {
          features: {
            debugMode: false,
            experimentalFeatures: false,
            realTimeUpdates: false,
            advancedAnalytics: false
          },
          monitoring: {
            logging: { level: 'error' as const },
            metrics: { enabled: false },
            healthChecks: { enabled: false }
          },
          performance: {
            timeouts: {
              request: 5000,
              connection: 2000
            }
          }
        },
        variables: {}
      }
    ];
  }
}

// =============================================================================
// Export Utility Instances
// =============================================================================

export const configurationMerger = new ConfigurationMerger();
export const configurationDiffer = new ConfigurationDiffer();
export const configurationSerializer = new ConfigurationSerializer();
export const configurationTemplateManager = new ConfigurationTemplateManager();
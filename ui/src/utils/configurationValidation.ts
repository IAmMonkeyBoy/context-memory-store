/**
 * Configuration Validation Engine with Zod
 * Phase 7.4.1 - Comprehensive validation system for system configuration
 */

import { z } from 'zod';
import type {
  SystemConfiguration,
  ValidationResult,
  ValidationError,
  ConfigurationDependency,
  ConfigurationMigration
} from '../types/configuration';

// =============================================================================
// Zod Schema Definitions
// =============================================================================

// CORS Configuration Schema
const corsConfigurationSchema = z.object({
  enabled: z.boolean(),
  origins: z.array(z.string().url().or(z.literal('*'))),
  methods: z.array(z.string()),
  allowedHeaders: z.array(z.string()),
  credentials: z.boolean(),
  maxAge: z.number().min(0).max(86400) // 24 hours max
});

// Rate Limiting Configuration Schema
const rateLimitingConfigurationSchema = z.object({
  enabled: z.boolean(),
  requestsPerMinute: z.number().min(1).max(10000),
  burstLimit: z.number().min(1).max(1000),
  windowMs: z.number().min(1000).max(3600000), // 1 second to 1 hour
  skipSuccessfulRequests: z.boolean(),
  skipFailedRequests: z.boolean(),
  message: z.string().min(1).max(200)
});

// OAuth Configuration Schema
const oauthConfigurationSchema = z.object({
  provider: z.string().min(1),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  callbackUrl: z.string().url(),
  scopes: z.array(z.string())
});

// API Key Configuration Schema
const apiKeyConfigurationSchema = z.object({
  headerName: z.string().min(1),
  prefix: z.string().optional(),
  validKeys: z.array(z.string().min(1))
});

// Authentication Configuration Schema
const authenticationConfigurationSchema = z.object({
  enabled: z.boolean(),
  provider: z.enum(['jwt', 'oauth', 'apikey', 'none']),
  jwtSecret: z.string().min(32).optional(),
  tokenExpiry: z.string().optional(),
  refreshTokenExpiry: z.string().optional(),
  oauth: oauthConfigurationSchema.optional(),
  apiKey: apiKeyConfigurationSchema.optional()
});

// Swagger Configuration Schema
const swaggerConfigurationSchema = z.object({
  enabled: z.boolean(),
  path: z.string().min(1),
  title: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string(),
  contact: z.object({
    name: z.string(),
    email: z.string().email(),
    url: z.string().url()
  }).optional(),
  license: z.object({
    name: z.string(),
    url: z.string().url()
  }).optional()
});

// Compression Configuration Schema
const compressionConfigurationSchema = z.object({
  enabled: z.boolean(),
  level: z.number().min(0).max(9),
  threshold: z.number().min(0),
  algorithm: z.enum(['gzip', 'brotli', 'deflate'])
});

// Static Files Configuration Schema
const staticFilesConfigurationSchema = z.object({
  enabled: z.boolean(),
  root: z.string().min(1),
  index: z.string().min(1),
  maxAge: z.number().min(0),
  etag: z.boolean()
});

// API Configuration Schema
const apiConfigurationSchema = z.object({
  baseUrl: z.string().url(),
  port: z.number().min(1).max(65535),
  cors: corsConfigurationSchema,
  rateLimiting: rateLimitingConfigurationSchema,
  authentication: authenticationConfigurationSchema,
  swagger: swaggerConfigurationSchema,
  compression: compressionConfigurationSchema,
  staticFiles: staticFilesConfigurationSchema
});

// Qdrant Configuration Schema
const qdrantConfigurationSchema = z.object({
  url: z.string().url(),
  apiKey: z.string().optional(),
  collection: z.string().min(1),
  vectorSize: z.number().min(1).max(4096),
  distance: z.enum(['cosine', 'euclidean', 'dot', 'manhattan']),
  timeout: z.number().min(1000).max(300000), // 1 second to 5 minutes
  retryAttempts: z.number().min(0).max(10),
  retryDelay: z.number().min(100).max(60000), // 100ms to 1 minute
  healthCheckInterval: z.number().min(1).max(3600), // 1 second to 1 hour
  connectionPool: z.object({
    maxConnections: z.number().min(1).max(100),
    idleTimeout: z.number().min(1000).max(3600000) // 1 second to 1 hour
  })
});

// Neo4j Configuration Schema
const neo4jConfigurationSchema = z.object({
  uri: z.string().url(),
  username: z.string().min(1),
  password: z.string().min(1),
  database: z.string().min(1),
  maxConnectionLifetime: z.number().min(1000).max(3600000), // 1 second to 1 hour
  maxConnectionPoolSize: z.number().min(1).max(100),
  connectionAcquisitionTimeout: z.number().min(1000).max(300000), // 1 second to 5 minutes
  healthCheckInterval: z.number().min(1).max(3600), // 1 second to 1 hour
  encrypted: z.boolean(),
  trustStrategy: z.enum(['TRUST_ALL_CERTIFICATES', 'TRUST_SYSTEM_CA_SIGNED_CERTIFICATES'])
});

// Ollama Configuration Schema
const ollamaConfigurationSchema = z.object({
  baseUrl: z.string().url(),
  chatModel: z.string().min(1),
  embeddingModel: z.string().min(1),
  timeout: z.number().min(1000).max(300000), // 1 second to 5 minutes
  maxRetries: z.number().min(0).max(10),
  retryDelay: z.number().min(100).max(60000), // 100ms to 1 minute
  streamingEnabled: z.boolean(),
  keepAlive: z.string(),
  temperature: z.number().min(0).max(2),
  topP: z.number().min(0).max(1),
  topK: z.number().min(1).max(100),
  contextWindow: z.number().min(1024).max(131072), // 1K to 128K tokens
  models: z.object({
    chat: z.array(z.string().min(1)),
    embedding: z.array(z.string().min(1))
  })
});

// Services Configuration Schema
const servicesConfigurationSchema = z.object({
  qdrant: qdrantConfigurationSchema,
  neo4j: neo4jConfigurationSchema,
  ollama: ollamaConfigurationSchema
});

// Batch Processing Configuration Schema
const batchProcessingConfigurationSchema = z.object({
  enabled: z.boolean(),
  batchSize: z.number().min(1).max(10000),
  maxConcurrency: z.number().min(1).max(100),
  queueTimeout: z.number().min(1000).max(3600000), // 1 second to 1 hour
  retries: z.object({
    maxAttempts: z.number().min(0).max(10),
    delay: z.number().min(100).max(60000), // 100ms to 1 minute
    backoffMultiplier: z.number().min(1).max(10)
  })
});

// Caching Configuration Schema
const cachingConfigurationSchema = z.object({
  enabled: z.boolean(),
  ttl: z.number().min(1).max(86400), // 1 second to 24 hours
  maxSize: z.number().min(1024).max(1073741824), // 1KB to 1GB
  strategy: z.enum(['lru', 'lfu', 'fifo']),
  layers: z.object({
    memory: z.object({
      enabled: z.boolean(),
      maxEntries: z.number().min(1).max(1000000),
      ttl: z.number().min(1).max(86400)
    }),
    redis: z.object({
      enabled: z.boolean(),
      url: z.string().url(),
      ttl: z.number().min(1).max(86400)
    }).optional()
  })
});

// Search Configuration Schema
const searchConfigurationSchema = z.object({
  fuzzySearch: z.boolean(),
  maxResults: z.number().min(1).max(10000),
  relevanceThreshold: z.number().min(0).max(1),
  indexing: z.object({
    autoIndex: z.boolean(),
    updateInterval: z.number().min(1).max(86400), // 1 second to 24 hours
    maxSizeMb: z.number().min(1).max(10240) // 1MB to 10GB
  })
});

// Streaming Configuration Schema
const streamingConfigurationSchema = z.object({
  enabled: z.boolean(),
  maxConcurrentStreams: z.number().min(1).max(1000),
  timeout: z.number().min(1000).max(3600000), // 1 second to 1 hour
  bufferSize: z.number().min(1024).max(1048576), // 1KB to 1MB
  heartbeatInterval: z.number().min(1).max(300) // 1 second to 5 minutes
});

// Feature Configuration Schema
const featureConfigurationSchema = z.object({
  realTimeUpdates: z.boolean(),
  advancedAnalytics: z.boolean(),
  experimentalFeatures: z.boolean(),
  debugMode: z.boolean(),
  batchProcessing: batchProcessingConfigurationSchema,
  caching: cachingConfigurationSchema,
  search: searchConfigurationSchema,
  streaming: streamingConfigurationSchema
});

// HTTPS Configuration Schema
const httpsConfigurationSchema = z.object({
  enabled: z.boolean(),
  certificatePath: z.string().optional(),
  keyPath: z.string().optional(),
  redirectHttp: z.boolean(),
  minTlsVersion: z.enum(['1.2', '1.3']),
  cipherSuites: z.array(z.string()).optional()
}).refine((data) => {
  if (data.enabled && (!data.certificatePath || !data.keyPath)) {
    return false;
  }
  return true;
}, {
  message: "HTTPS requires both certificate and key paths"
});

// Security Headers Configuration Schema
const securityHeadersConfigurationSchema = z.object({
  contentSecurityPolicy: z.string(),
  strictTransportSecurity: z.string(),
  xFrameOptions: z.string(),
  xContentTypeOptions: z.string(),
  referrerPolicy: z.string(),
  xXssProtection: z.string(),
  permissionsPolicy: z.string().optional()
});

// Data Protection Configuration Schema
const dataProtectionConfigurationSchema = z.object({
  encryptionKey: z.string().min(32).optional(),
  hashSaltRounds: z.number().min(4).max(20),
  sessionSecret: z.string().min(32).optional(),
  cookieSecure: z.boolean(),
  cookieSameSite: z.enum(['strict', 'lax', 'none']),
  dataRetentionDays: z.number().min(1).max(36500) // 1 day to 100 years
});

// Validation Configuration Schema
const validationConfigurationSchema = z.object({
  strictMode: z.boolean(),
  maxRequestSize: z.number().min(1024).max(1073741824), // 1KB to 1GB
  maxUrlLength: z.number().min(100).max(8192),
  allowedFileTypes: z.array(z.string()),
  maxFileSize: z.number().min(1024).max(1073741824) // 1KB to 1GB
});

// Audit Configuration Schema
const auditConfigurationSchema = z.object({
  enabled: z.boolean(),
  events: z.array(z.string()),
  retentionDays: z.number().min(1).max(36500), // 1 day to 100 years
  includeRequestBodies: z.boolean(),
  includeResponseBodies: z.boolean()
});

// Security Configuration Schema
const securityConfigurationSchema = z.object({
  https: httpsConfigurationSchema,
  headers: securityHeadersConfigurationSchema,
  dataProtection: dataProtectionConfigurationSchema,
  validation: validationConfigurationSchema,
  audit: auditConfigurationSchema
});

// Logging Configuration Schema
const loggingConfigurationSchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']),
  format: z.enum(['json', 'text']),
  outputs: z.array(z.object({
    type: z.enum(['console', 'file', 'syslog', 'http']),
    config: z.record(z.any())
  })),
  includeTimestamp: z.boolean(),
  includeStackTrace: z.boolean(),
  rotation: z.object({
    enabled: z.boolean(),
    maxSizeMb: z.number().min(1).max(1024), // 1MB to 1GB
    maxFiles: z.number().min(1).max(100),
    interval: z.enum(['daily', 'weekly', 'monthly'])
  })
});

// Metrics Configuration Schema
const metricsConfigurationSchema = z.object({
  enabled: z.boolean(),
  format: z.enum(['prometheus', 'json']),
  endpoint: z.string().min(1),
  interval: z.number().min(1).max(3600), // 1 second to 1 hour
  custom: z.array(z.object({
    name: z.string().min(1),
    type: z.enum(['counter', 'gauge', 'histogram', 'summary']),
    description: z.string(),
    labels: z.array(z.string())
  }))
});

// Alerting Configuration Schema
const alertingConfigurationSchema = z.object({
  enabled: z.boolean(),
  channels: z.array(z.object({
    type: z.enum(['email', 'webhook', 'slack']),
    config: z.record(z.any())
  })),
  rules: z.array(z.object({
    name: z.string().min(1),
    metric: z.string().min(1),
    threshold: z.number(),
    operator: z.enum(['gt', 'lt', 'eq', 'gte', 'lte']),
    interval: z.number().min(1).max(3600), // 1 second to 1 hour
    severity: z.enum(['low', 'medium', 'high', 'critical'])
  }))
});

// Health Checks Configuration Schema
const healthChecksConfigurationSchema = z.object({
  enabled: z.boolean(),
  interval: z.number().min(1).max(3600), // 1 second to 1 hour
  timeout: z.number().min(1000).max(300000), // 1 second to 5 minutes
  services: z.array(z.object({
    name: z.string().min(1),
    url: z.string().url(),
    expectedStatus: z.number().min(100).max(599),
    interval: z.number().min(1).max(3600),
    timeout: z.number().min(1000).max(300000)
  }))
});

// Tracing Configuration Schema
const tracingConfigurationSchema = z.object({
  enabled: z.boolean(),
  provider: z.enum(['jaeger', 'zipkin', 'otlp']),
  endpoint: z.string().url(),
  samplingRate: z.number().min(0).max(1),
  serviceName: z.string().min(1)
});

// Monitoring Configuration Schema
const monitoringConfigurationSchema = z.object({
  logging: loggingConfigurationSchema,
  metrics: metricsConfigurationSchema,
  alerting: alertingConfigurationSchema,
  healthChecks: healthChecksConfigurationSchema,
  tracing: tracingConfigurationSchema
});

// Performance Configuration Schema
const performanceConfigurationSchema = z.object({
  timeouts: z.object({
    request: z.number().min(1000).max(300000), // 1 second to 5 minutes
    connection: z.number().min(1000).max(60000), // 1 second to 1 minute
    keepAlive: z.number().min(1000).max(300000), // 1 second to 5 minutes
    header: z.number().min(1000).max(60000), // 1 second to 1 minute
    body: z.number().min(1000).max(300000) // 1 second to 5 minutes
  }),
  connectionPools: z.object({
    maxConnections: z.number().min(1).max(1000),
    minConnections: z.number().min(0).max(100),
    idleTimeout: z.number().min(1000).max(3600000), // 1 second to 1 hour
    acquisitionTimeout: z.number().min(1000).max(300000), // 1 second to 5 minutes
    validateConnections: z.boolean()
  }).refine((data) => data.minConnections <= data.maxConnections, {
    message: "minConnections must be less than or equal to maxConnections",
    path: ["minConnections"]
  }),
  resourceLimits: z.object({
    maxMemoryMb: z.number().min(128).max(65536), // 128MB to 64GB
    maxCpuPercent: z.number().min(1).max(100),
    maxConcurrentRequests: z.number().min(1).max(10000),
    maxRequestQueueSize: z.number().min(1).max(100000),
    maxFileDescriptors: z.number().min(100).max(1000000)
  }),
  optimization: z.object({
    http2Enabled: z.boolean(),
    keepAliveEnabled: z.boolean(),
    pipeliningEnabled: z.boolean(),
    compressionEnabled: z.boolean(),
    staticFileCachingEnabled: z.boolean(),
    gc: z.object({
      strategy: z.enum(['adaptive', 'throughput', 'latency']),
      heapSizeMb: z.number().min(128).max(65536) // 128MB to 64GB
    })
  })
});

// Main System Configuration Schema
const systemConfigurationSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  api: apiConfigurationSchema,
  services: servicesConfigurationSchema,
  features: featureConfigurationSchema,
  security: securityConfigurationSchema,
  monitoring: monitoringConfigurationSchema,
  performance: performanceConfigurationSchema
});

// =============================================================================
// Configuration Dependencies
// =============================================================================

const configurationDependencies: ConfigurationDependency[] = [
  {
    source: 'api.authentication.enabled',
    target: 'api.authentication.provider',
    type: 'requires',
    condition: (enabled, provider) => enabled && !provider,
    message: 'Authentication enabled requires a valid provider'
  },
  {
    source: 'api.authentication',
    target: 'api.authentication.jwtSecret',
    type: 'requires',
    condition: (auth, secret) => auth?.enabled && auth?.provider === 'jwt' && !secret,
    message: 'JWT authentication requires a secret key'
  },
  {
    source: 'api.authentication',
    target: 'api.authentication.oauth',
    type: 'requires',
    condition: (auth, oauth) => auth?.enabled && auth?.provider === 'oauth' && !oauth,
    message: 'OAuth authentication requires OAuth configuration'
  },
  {
    source: 'api.authentication',
    target: 'api.authentication.apiKey',
    type: 'requires',
    condition: (auth, apiKey) => auth?.enabled && auth?.provider === 'apikey' && !apiKey,
    message: 'API Key authentication requires API key configuration'
  },
  {
    source: 'security.https.enabled',
    target: 'security.https.certificatePath',
    type: 'requires',
    condition: (enabled, certPath) => enabled && !certPath,
    message: 'HTTPS requires certificate path'
  },
  {
    source: 'security.https.enabled',
    target: 'security.https.keyPath',
    type: 'requires',
    condition: (enabled, keyPath) => enabled && !keyPath,
    message: 'HTTPS requires private key path'
  },
  {
    source: 'features.caching.layers.redis.enabled',
    target: 'features.caching.layers.redis.url',
    type: 'requires',
    condition: (enabled, url) => enabled && !url,
    message: 'Redis caching requires Redis URL'
  },
  {
    source: 'monitoring.tracing.enabled',
    target: 'monitoring.tracing.endpoint',
    type: 'requires',
    condition: (enabled, endpoint) => enabled && !endpoint,
    message: 'Tracing requires endpoint configuration'
  },
  {
    source: 'api.port',
    target: 'monitoring.healthChecks.services',
    type: 'conflicts',
    condition: (apiPort, healthServices) => {
      return Array.isArray(healthServices) && healthServices.some((service: any) => {
        try {
          const url = new URL(service.url);
          return parseInt(url.port) === apiPort;
        } catch {
          return false;
        }
      });
    },
    message: 'API port conflicts with health check service port'
  }
];

// =============================================================================
// Configuration Validator Class
// =============================================================================

export class ConfigurationValidator {
  private readonly dependencies: ConfigurationDependency[];
  private readonly migrations: ConfigurationMigration[];

  constructor() {
    this.dependencies = configurationDependencies;
    this.migrations = [];
  }

  /**
   * Validate a system configuration
   */
  async validate(config: SystemConfiguration): Promise<ValidationResult> {
    const startTime = Date.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const suggestions: ValidationError[] = [];

    try {
      // Schema validation - only validate if we have a complete configuration
      if (this.isCompleteConfiguration(config)) {
        const schemaResult = systemConfigurationSchema.safeParse(config);
        if (!schemaResult.success) {
          for (const issue of schemaResult.error.issues) {
            errors.push({
              path: issue.path.join('.'),
              message: issue.message,
              severity: 'error',
              code: issue.code,
              value: issue.received,
              expected: issue.expected
            });
          }
        }
      } else {
        // For partial configurations, just validate basic structure
        if (!config.version) {
          errors.push({
            path: 'version',
            message: 'Configuration version is required',
            severity: 'error',
            code: 'MISSING_VERSION'
          });
        }
      }

      // Dependency validation
      await this.validateDependencies(config, errors, warnings, suggestions);

      // Cross-reference validation
      await this.validateCrossReferences(config, errors, warnings, suggestions);

      // Performance validation
      await this.validatePerformance(config, warnings, suggestions);

      // Security validation
      await this.validateSecurity(config, warnings, suggestions);

    } catch (error) {
      errors.push({
        path: 'root',
        message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error',
        code: 'VALIDATION_EXCEPTION'
      });
    }

    const durationMs = Date.now() - startTime;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      metadata: {
        durationMs,
        schemaVersion: '1.0.0',
        timestamp: new Date().toISOString(),
        validatorVersion: '1.0.0'
      }
    };
  }

  /**
   * Validate configuration dependencies
   */
  private async validateDependencies(
    config: SystemConfiguration,
    errors: ValidationError[],
    warnings: ValidationError[],
    suggestions: ValidationError[]
  ): Promise<void> {
    for (const dependency of this.dependencies) {
      try {
        const sourceValue = this.getValueByPath(config, dependency.source);
        const targetValue = this.getValueByPath(config, dependency.target);

        let violated = false;

        switch (dependency.type) {
          case 'requires':
            if (dependency.condition) {
              if (dependency.condition(sourceValue, targetValue)) {
                violated = true;
              }
            } else if (sourceValue && !targetValue) {
              violated = true;
            }
            break;

          case 'conflicts':
            if (sourceValue && targetValue) {
              if (dependency.condition && dependency.condition(sourceValue, targetValue)) {
                violated = true;
              } else if (!dependency.condition) {
                violated = true;
              }
            }
            break;

          case 'implies':
            if (sourceValue && !targetValue) {
              violated = true;
            }
            break;

          case 'excludes':
            if (sourceValue && targetValue) {
              violated = true;
            }
            break;
        }

        if (violated) {
          errors.push({
            path: dependency.target,
            message: dependency.message,
            severity: 'error',
            code: 'DEPENDENCY_VIOLATION',
            suggestions: [`Check ${dependency.source} configuration`]
          });
        }
      } catch (error) {
        warnings.push({
          path: dependency.source,
          message: `Could not validate dependency: ${dependency.message}`,
          severity: 'warning',
          code: 'DEPENDENCY_CHECK_FAILED'
        });
      }
    }
  }

  /**
   * Validate cross-references between configuration sections
   */
  private async validateCrossReferences(
    config: SystemConfiguration,
    errors: ValidationError[],
    warnings: ValidationError[],
    suggestions: ValidationError[]
  ): Promise<void> {
    // Validate port conflicts
    const ports = new Set<number>();
    
    // Check API port
    if (config.api.port) {
      ports.add(config.api.port);
    }

    // Check service ports if they're on the same host
    try {
      const apiUrl = new URL(config.api.baseUrl);
      const qdrantUrl = new URL(config.services.qdrant.url);
      const neo4jUrl = new URL(config.services.neo4j.uri);
      const ollamaUrl = new URL(config.services.ollama.baseUrl);

      if (apiUrl.hostname === qdrantUrl.hostname && qdrantUrl.port) {
        const port = parseInt(qdrantUrl.port);
        if (ports.has(port)) {
          errors.push({
            path: 'services.qdrant.url',
            message: 'Qdrant port conflicts with API port',
            severity: 'error',
            code: 'PORT_CONFLICT'
          });
        }
        ports.add(port);
      }

      if (apiUrl.hostname === neo4jUrl.hostname && neo4jUrl.port) {
        const port = parseInt(neo4jUrl.port);
        if (ports.has(port)) {
          errors.push({
            path: 'services.neo4j.uri',
            message: 'Neo4j port conflicts with other services',
            severity: 'error',
            code: 'PORT_CONFLICT'
          });
        }
        ports.add(port);
      }

      if (apiUrl.hostname === ollamaUrl.hostname && ollamaUrl.port) {
        const port = parseInt(ollamaUrl.port);
        if (ports.has(port)) {
          errors.push({
            path: 'services.ollama.baseUrl',
            message: 'Ollama port conflicts with other services',
            severity: 'error',
            code: 'PORT_CONFLICT'
          });
        }
        ports.add(port);
      }
    } catch (error) {
      warnings.push({
        path: 'api.baseUrl',
        message: 'Could not validate URL cross-references',
        severity: 'warning',
        code: 'URL_VALIDATION_FAILED'
      });
    }

    // Validate model consistency
    if (!config.services.ollama.models.chat.includes(config.services.ollama.chatModel)) {
      warnings.push({
        path: 'services.ollama.chatModel',
        message: 'Chat model is not in the available models list',
        severity: 'warning',
        code: 'MODEL_NOT_AVAILABLE',
        suggestions: ['Add the model to available chat models', 'Choose a different chat model']
      });
    }

    if (!config.services.ollama.models.embedding.includes(config.services.ollama.embeddingModel)) {
      warnings.push({
        path: 'services.ollama.embeddingModel',
        message: 'Embedding model is not in the available models list',
        severity: 'warning',
        code: 'MODEL_NOT_AVAILABLE',
        suggestions: ['Add the model to available embedding models', 'Choose a different embedding model']
      });
    }
  }

  /**
   * Validate performance configurations
   */
  private async validatePerformance(
    config: SystemConfiguration,
    warnings: ValidationError[],
    suggestions: ValidationError[]
  ): Promise<void> {
    // Check timeout relationships
    if (config.performance.timeouts.connection > config.performance.timeouts.request) {
      warnings.push({
        path: 'performance.timeouts.connection',
        message: 'Connection timeout is greater than request timeout',
        severity: 'warning',
        code: 'TIMEOUT_MISMATCH',
        suggestions: ['Set connection timeout lower than request timeout']
      });
    }

    // Check memory limits
    if (config.performance.resourceLimits.maxMemoryMb < 512) {
      suggestions.push({
        path: 'performance.resourceLimits.maxMemoryMb',
        message: 'Memory limit is quite low, consider increasing for better performance',
        severity: 'info',
        code: 'LOW_MEMORY_LIMIT',
        suggestions: ['Consider setting memory limit to at least 512MB']
      });
    }

    // Connection pool validation is now handled by the schema
  }

  /**
   * Validate security configurations
   */
  private async validateSecurity(
    config: SystemConfiguration,
    warnings: ValidationError[],
    suggestions: ValidationError[]
  ): Promise<void> {
    // Check HTTPS in production
    if (!config.security.https.enabled) {
      suggestions.push({
        path: 'security.https.enabled',
        message: 'Consider enabling HTTPS for production environments',
        severity: 'info',
        code: 'HTTPS_RECOMMENDED',
        suggestions: ['Enable HTTPS with proper certificates']
      });
    }

    // Check authentication
    if (!config.api.authentication.enabled) {
      warnings.push({
        path: 'api.authentication.enabled',
        message: 'Authentication is disabled, consider enabling for security',
        severity: 'warning',
        code: 'NO_AUTHENTICATION',
        suggestions: ['Enable authentication for production use']
      });
    }

    // Check JWT secret strength
    if (config.api.authentication.provider === 'jwt' && 
        config.api.authentication.jwtSecret && 
        config.api.authentication.jwtSecret.length < 64) {
      warnings.push({
        path: 'api.authentication.jwtSecret',
        message: 'JWT secret is shorter than recommended (64 characters)',
        severity: 'warning',
        code: 'WEAK_JWT_SECRET',
        suggestions: ['Use a JWT secret with at least 64 characters']
      });
    }

    // Check CORS origins
    if (config.api.cors.enabled && config.api.cors.origins.includes('*')) {
      warnings.push({
        path: 'api.cors.origins',
        message: 'CORS allows all origins, consider restricting for security',
        severity: 'warning',
        code: 'PERMISSIVE_CORS',
        suggestions: ['Specify exact origins instead of using wildcard']
      });
    }
  }

  /**
   * Check if configuration has all required sections for full validation
   */
  private isCompleteConfiguration(config: any): boolean {
    if (!config || typeof config !== 'object') {
      return false;
    }
    
    const requiredSections = ['version', 'api', 'services', 'features', 'security', 'monitoring', 'performance'];
    return requiredSections.every(section => section in config && config[section] !== null && config[section] !== undefined);
  }

  /**
   * Get a value from an object using a dot-separated path
   */
  private getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Add a custom dependency
   */
  addDependency(dependency: ConfigurationDependency): void {
    this.dependencies.push(dependency);
  }

  /**
   * Add a configuration migration
   */
  addMigration(migration: ConfigurationMigration): void {
    this.migrations.push(migration);
  }

  /**
   * Migrate configuration from one version to another
   */
  async migrate(config: any, fromVersion: string, toVersion: string): Promise<any> {
    const migration = this.migrations.find(
      m => m.fromVersion === fromVersion && m.toVersion === toVersion
    );

    if (!migration) {
      throw new Error(`No migration found from ${fromVersion} to ${toVersion}`);
    }

    return migration.migrate(config);
  }
}

// =============================================================================
// Default Configuration Factory
// =============================================================================

export function createDefaultConfiguration(): SystemConfiguration {
  return {
    version: '1.0.0',
    api: {
      baseUrl: 'http://localhost:8080',
      port: 8080,
      cors: {
        enabled: true,
        origins: ['http://localhost:3000'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
        maxAge: 86400
      },
      rateLimiting: {
        enabled: false,
        requestsPerMinute: 100,
        burstLimit: 20,
        windowMs: 60000,
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
        message: 'Too many requests, please try again later'
      },
      authentication: {
        enabled: false,
        provider: 'none'
      },
      swagger: {
        enabled: true,
        path: '/swagger',
        title: 'Context Memory Store API',
        version: '1.0.0',
        description: 'API for managing context and memory in AI coding agent systems'
      },
      compression: {
        enabled: true,
        level: 6,
        threshold: 1024,
        algorithm: 'gzip'
      },
      staticFiles: {
        enabled: true,
        root: 'wwwroot',
        index: 'index.html',
        maxAge: 3600,
        etag: true
      }
    },
    services: {
      qdrant: {
        url: 'http://localhost:6333',
        collection: 'context_memory',
        vectorSize: 768,
        distance: 'cosine',
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        healthCheckInterval: 30,
        connectionPool: {
          maxConnections: 10,
          idleTimeout: 300000
        }
      },
      neo4j: {
        uri: 'bolt://localhost:7687',
        username: 'neo4j',
        password: 'contextmemory',
        database: 'neo4j',
        maxConnectionLifetime: 3600000,
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 60000,
        healthCheckInterval: 30,
        encrypted: false,
        trustStrategy: 'TRUST_ALL_CERTIFICATES'
      },
      ollama: {
        baseUrl: 'http://host.docker.internal:11434',
        chatModel: 'llama3',
        embeddingModel: 'mxbai-embed-large',
        timeout: 120000,
        maxRetries: 3,
        retryDelay: 2000,
        streamingEnabled: true,
        keepAlive: '5m',
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        contextWindow: 4096,
        models: {
          chat: ['llama3', 'llama3:70b', 'codellama'],
          embedding: ['mxbai-embed-large', 'nomic-embed-text']
        }
      }
    },
    features: {
      realTimeUpdates: true,
      advancedAnalytics: true,
      experimentalFeatures: false,
      debugMode: false,
      batchProcessing: {
        enabled: true,
        batchSize: 100,
        maxConcurrency: 5,
        queueTimeout: 300000,
        retries: {
          maxAttempts: 3,
          delay: 1000,
          backoffMultiplier: 2
        }
      },
      caching: {
        enabled: true,
        ttl: 3600,
        maxSize: 104857600, // 100MB
        strategy: 'lru',
        layers: {
          memory: {
            enabled: true,
            maxEntries: 10000,
            ttl: 3600
          }
        }
      },
      search: {
        fuzzySearch: true,
        maxResults: 100,
        relevanceThreshold: 0.5,
        indexing: {
          autoIndex: true,
          updateInterval: 300,
          maxSizeMb: 1024
        }
      },
      streaming: {
        enabled: true,
        maxConcurrentStreams: 10,
        timeout: 300000,
        bufferSize: 8192,
        heartbeatInterval: 30
      }
    },
    security: {
      https: {
        enabled: false,
        redirectHttp: false,
        minTlsVersion: '1.2'
      },
      headers: {
        contentSecurityPolicy: "default-src 'self'",
        strictTransportSecurity: 'max-age=31536000; includeSubDomains',
        xFrameOptions: 'DENY',
        xContentTypeOptions: 'nosniff',
        referrerPolicy: 'strict-origin-when-cross-origin',
        xXssProtection: '1; mode=block'
      },
      dataProtection: {
        hashSaltRounds: 12,
        cookieSecure: false,
        cookieSameSite: 'lax',
        dataRetentionDays: 365
      },
      validation: {
        strictMode: false,
        maxRequestSize: 10485760, // 10MB
        maxUrlLength: 2048,
        allowedFileTypes: ['.txt', '.md', '.json', '.csv', '.pdf'],
        maxFileSize: 52428800 // 50MB
      },
      audit: {
        enabled: false,
        events: ['login', 'logout', 'create', 'update', 'delete'],
        retentionDays: 90,
        includeRequestBodies: false,
        includeResponseBodies: false
      }
    },
    monitoring: {
      logging: {
        level: 'info',
        format: 'json',
        outputs: [
          {
            type: 'console',
            config: {}
          }
        ],
        includeTimestamp: true,
        includeStackTrace: true,
        rotation: {
          enabled: false,
          maxSizeMb: 100,
          maxFiles: 10,
          interval: 'daily'
        }
      },
      metrics: {
        enabled: true,
        format: 'prometheus',
        endpoint: '/metrics',
        interval: 15,
        custom: []
      },
      alerting: {
        enabled: false,
        channels: [],
        rules: []
      },
      healthChecks: {
        enabled: true,
        interval: 30,
        timeout: 5000,
        services: [
          {
            name: 'qdrant',
            url: 'http://localhost:6333/health',
            expectedStatus: 200,
            interval: 30,
            timeout: 5000
          },
          {
            name: 'neo4j',
            url: 'http://localhost:7474/db/data/',
            expectedStatus: 200,
            interval: 30,
            timeout: 5000
          }
        ]
      },
      tracing: {
        enabled: false,
        provider: 'jaeger',
        endpoint: 'http://localhost:14268/api/traces',
        samplingRate: 0.1,
        serviceName: 'context-memory-store'
      }
    },
    performance: {
      timeouts: {
        request: 30000,
        connection: 5000,
        keepAlive: 60000,
        header: 10000,
        body: 30000
      },
      connectionPools: {
        maxConnections: 100,
        minConnections: 10,
        idleTimeout: 300000,
        acquisitionTimeout: 30000,
        validateConnections: true
      },
      resourceLimits: {
        maxMemoryMb: 2048,
        maxCpuPercent: 80,
        maxConcurrentRequests: 1000,
        maxRequestQueueSize: 10000,
        maxFileDescriptors: 65536
      },
      optimization: {
        http2Enabled: false,
        keepAliveEnabled: true,
        pipeliningEnabled: false,
        compressionEnabled: true,
        staticFileCachingEnabled: true,
        gc: {
          strategy: 'adaptive',
          heapSizeMb: 1024
        }
      }
    }
  };
}

// Export the validator instance
export const configurationValidator = new ConfigurationValidator();